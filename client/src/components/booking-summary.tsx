import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, User, Clock, MapPin } from "lucide-react";

interface BookingSummaryProps {
  bookingData: any;
  onSubmit: () => void;
}

export default function BookingSummary({ bookingData, onSubmit }: BookingSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateEndTime = (startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  const isFormValid = bookingData.selectedService && 
                     bookingData.selectedTechnician && 
                     bookingData.selectedTime &&
                     bookingData.customerInfo.name &&
                     bookingData.customerInfo.phone;

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle>Tóm tắt đặt lịch</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Booking Details */}
        {bookingData.selectedDate && bookingData.selectedTime && (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">
                  {formatDate(bookingData.selectedDate)}
                </div>
                <div className="text-sm text-gray-500">
                  {bookingData.selectedTime} - {calculateEndTime(bookingData.selectedTime, bookingData.selectedDuration)}
                </div>
              </div>
            </div>
            
            {bookingData.selectedTechnician && (
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">{bookingData.selectedTechnician.name}</div>
                  <div className="text-sm text-gray-500">Kỹ thuật viên</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Service Details */}
        {bookingData.selectedService && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-3">Dịch vụ đã chọn</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">
                    {bookingData.selectedService.name} ({bookingData.selectedDuration} phút)
                  </span>
                  <span className="text-sm font-medium">
                    {formatCurrency(
                      bookingData.selectedDuration === 45 
                        ? bookingData.selectedService.price45 
                        : bookingData.selectedService.price90
                    )}
                  </span>
                </div>
                
                {bookingData.additionalServices.map((service: any) => (
                  <div key={service.id} className="flex justify-between">
                    <span className="text-sm">{service.name}</span>
                    <span className="text-sm font-medium">{formatCurrency(service.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Total and Deposit */}
        {bookingData.totalAmount > 0 && (
          <>
            <Separator />
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Tổng cộng</span>
                <span className="font-medium">{formatCurrency(bookingData.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Cần đặt cọc (20%)</span>
                <span className="font-medium text-amber-600">
                  {formatCurrency(bookingData.depositAmount)}
                </span>
              </div>
            </div>
          </>
        )}

        {/* Customer Info */}
        {bookingData.customerInfo.name && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-2">Thông tin khách hàng</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Tên:</strong> {bookingData.customerInfo.name}</p>
                <p><strong>SĐT:</strong> {bookingData.customerInfo.phone}</p>
                {bookingData.customerInfo.notes && (
                  <p><strong>Ghi chú:</strong> {bookingData.customerInfo.notes}</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <Button 
            className="w-full" 
            onClick={onSubmit}
            disabled={!isFormValid}
          >
            Đặt lịch ngay
          </Button>
          {!isFormValid && (
            <p className="text-sm text-gray-500 text-center">
              Vui lòng điền đầy đủ thông tin để đặt lịch
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
