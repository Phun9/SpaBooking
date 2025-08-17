import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Check, QrCode, Copy } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: any;
}

export default function PaymentModal({ isOpen, onClose, bookingData }: PaymentModalProps) {
  const [step, setStep] = useState<'payment' | 'verification' | 'success'>('verification');
  const [booking, setBooking] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Auto-create booking when modal opens
  useEffect(() => {
    if (isOpen && !booking && !createBookingMutation.isPending) {
      handleCreateBooking();
    }
  }, [isOpen]);

  const createBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/bookings', data);
      return response.json();
    },
    onSuccess: (newBooking) => {
      setBooking(newBooking);
      setStep('verification');
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/availability'] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể tạo đặt lịch. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const response = await apiRequest('POST', `/api/bookings/${bookingId}/verify-payment`, {});
      return response.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        setBooking(result.booking);
        setStep('success');
        toast({
          title: "Thành công",
          description: "Đặt lịch thành công! Cảm ơn bạn đã sử dụng dịch vụ.",
        });
      } else {
        toast({
          title: "Lỗi",
          description: "Không thể xác thực thanh toán. Vui lòng thử lại.",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xác thực thanh toán. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  const handleCreateBooking = () => {
    const bookingPayload = {
      customerName: bookingData.customerInfo.name,
      customerPhone: bookingData.customerInfo.phone,
      customerNotes: bookingData.customerInfo.notes || '',
      technicianId: parseInt(bookingData.selectedTechnician.id),
      serviceId: parseInt(bookingData.selectedService.id),
      duration: parseInt(bookingData.selectedDuration),
      additionalServiceIds: bookingData.additionalServices?.map((s: any) => parseInt(s.id)) || [],
      bookingDate: new Date(bookingData.selectedDate + 'T00:00:00.000Z'),
      startTime: bookingData.selectedTime,
      endTime: calculateEndTime(bookingData.selectedTime, bookingData.selectedDuration),
      totalAmount: parseInt(bookingData.totalAmount),
      depositAmount: parseInt(bookingData.depositAmount),
      status: 'pending',
    };

    console.log('Sending booking payload:', bookingPayload);
    createBookingMutation.mutate(bookingPayload);
  };

  const calculateEndTime = (startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMins = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Đã sao chép",
      description: "Thông tin đã được sao chép vào clipboard",
    });
  };

  const handleClose = () => {
    setStep('verification');
    setBooking(null);
    onClose();
  };

  const handleCloseWithRefresh = () => {
    setStep('verification');
    setBooking(null);
    onClose();
    // Refresh the page to update all data
    window.location.reload();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {step === 'payment' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Thanh toán đặt cọc</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-center text-gray-600">
                Vui lòng chuyển khoản để hoàn tất đặt lịch
              </p>
              
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3">Thông tin chuyển khoản</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Ngân hàng:</span>
                      <span className="font-medium">Vietcombank</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Số tài khoản:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">0123456789</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard('0123456789')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>Chủ tài khoản:</span>
                      <span className="font-medium">Spa Relaxation</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Số tiền:</span>
                      <span className="font-medium text-amber-600">
                        {formatCurrency(bookingData.depositAmount)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center">
                <div className="w-48 h-48 bg-gray-100 rounded-xl mx-auto flex items-center justify-center mb-4">
                  <div className="text-center">
                    <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Mã QR thanh toán</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  className="flex-1"
                  onClick={handleCreateBooking}
                  disabled={createBookingMutation.isPending}
                >
                  {createBookingMutation.isPending ? "Đang xử lý..." : "Tạo đặt lịch"}
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleClose}>
                  Hủy
                </Button>
              </div>
            </div>
          </>
        )}

        {createBookingMutation.isPending && (
          <>
            <DialogHeader>
              <DialogTitle>Đang tạo đặt lịch...</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-600">Vui lòng đợi trong giây lát...</p>
            </div>
          </>
        )}

        {step === 'verification' && booking && (
          <>
            <DialogHeader>
              <DialogTitle>Xác thực thanh toán</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3">Thông tin đặt lịch</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Mã đặt lịch:</span>
                      <span className="font-medium">{booking.bookingCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Số tiền cọc:</span>
                      <span className="font-medium text-amber-600">
                        {formatCurrency(booking.depositAmount)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3">Thông tin chuyển khoản</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Ngân hàng:</span>
                      <span className="font-medium">Vietcombank</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Số tài khoản:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">0123456789</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard('0123456789')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>Chủ tài khoản:</span>
                      <span className="font-medium">Spa Relaxation</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Số tiền:</span>
                      <span className="font-medium text-amber-600">
                        {formatCurrency(booking.depositAmount)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center">
                <div className="w-48 h-48 bg-gray-100 rounded-xl mx-auto flex items-center justify-center mb-4">
                  <div className="text-center">
                    <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Mã QR thanh toán</p>
                  </div>
                </div>
              </div>

              <p className="text-center text-gray-600">Lịch hẹn sẽ tự động hủy sau 10 phút nếu khách hàng không chuyển khoản cọc!
              Vui lòng chuyển khoản theo thông tin trên và bấm "Đã cọc" để hoàn tất đặt lịch hẹn.</p>

              <div className="flex space-x-3">
                <Button
                  className="flex-1"
                  onClick={() => verifyPaymentMutation.mutate(booking.id)}
                  disabled={verifyPaymentMutation.isPending}
                >
                  {verifyPaymentMutation.isPending ? "Đang xác thực..." : "Đã cọc"}
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleCloseWithRefresh}>
                  Hủy
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'success' && booking && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Đặt lịch thành công!</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-center text-gray-600">
                Cảm ơn bạn đã đặt lịch. Vui lòng đến đúng giờ.
              </p>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3">Thông tin đặt lịch</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Mã đặt lịch:</span>
                      <span className="font-medium">{booking.bookingCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ngày giờ:</span>
                      <span className="font-medium">
                        {new Date(booking.bookingDate).toLocaleDateString('vi-VN')} - {booking.startTime}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Thời gian massage:</span>
                      <span className="font-medium">{booking.startTime} - {booking.endTime} ({booking.duration} phút)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kỹ thuật viên:</span>
                      <span className="font-medium">{bookingData.selectedTechnician.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dịch vụ:</span>
                      <span className="font-medium">{bookingData.selectedService.name}</span>
                    </div>
                    {bookingData.additionalServices && bookingData.additionalServices.length > 0 && (
                      <div className="flex justify-between">
                        <span>Dịch vụ thêm:</span>
                        <span className="font-medium">{bookingData.additionalServices.map((s: any) => s.name).join(', ')}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between">
                        <span>Tổng tiền:</span>
                        <span className="font-medium">{formatCurrency(booking.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Đã cọc:</span>
                        <span className="font-medium text-green-600">{formatCurrency(booking.depositAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Còn lại:</span>
                        <span className="font-medium text-amber-600">{formatCurrency(booking.totalAmount - booking.depositAmount)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center">
                <div className="w-48 h-48 bg-gray-100 rounded-xl mx-auto flex items-center justify-center mb-4">
                  <div className="text-center">
                    <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Mã QR đặt lịch</p>
                  </div>
                </div>
              </div>

              <Button className="w-full" onClick={handleCloseWithRefresh}>
                Hoàn tất
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
