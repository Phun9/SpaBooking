import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Search, QrCode, Calendar, User, Clock } from "lucide-react";
import { Link } from "wouter";

export default function BookingLookup() {
  const [bookingCode, setBookingCode] = useState("");
  const [shouldFetch, setShouldFetch] = useState(false);

  const { data: booking, isLoading, error } = useQuery({
    queryKey: ['/api/bookings/lookup', bookingCode],
    enabled: shouldFetch && bookingCode.length > 0,
    retry: false,
  });

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setShouldFetch(true);
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-xl font-bold text-gray-800">Tra cứu đặt lịch</h1>
            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <QrCode className="h-5 w-5" />
              <span>Tra cứu thông tin đặt lịch</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLookup} className="space-y-4">
              <div>
                <Label htmlFor="bookingCode">Mã đặt lịch</Label>
                <Input
                  id="bookingCode"
                  type="text"
                  value={bookingCode}
                  onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã đặt lịch (VD: SR123456)"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                <Search className="h-4 w-4 mr-2" />
                {isLoading ? "Đang tra cứu..." : "Tra cứu"}
              </Button>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">Không tìm thấy thông tin đặt lịch</p>
              </div>
            )}

            {booking && (
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Thông tin đặt lịch</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-green-600" />
                      <span>
                        <strong>Ngày:</strong> {formatDate(booking.bookingDate)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-green-600" />
                      <span>
                        <strong>Giờ:</strong> {booking.startTime} - {booking.endTime}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-green-600" />
                      <span>
                        <strong>Kỹ thuật viên:</strong> {booking.technician?.name}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Thông tin khách hàng</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Tên:</strong> {booking.customerName}</p>
                    <p><strong>Số điện thoại:</strong> {booking.customerPhone}</p>
                    {booking.customerNotes && (
                      <p><strong>Ghi chú:</strong> {booking.customerNotes}</p>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Dịch vụ</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>{booking.service?.name} ({booking.duration} phút)</span>
                      <span className="font-medium">
                        {formatCurrency(booking.duration === 45 ? booking.service?.price45 : booking.service?.price90)}
                      </span>
                    </div>
                    {booking.additionalServices?.map((service: any) => (
                      <div key={service.id} className="flex justify-between">
                        <span>{service.name}</span>
                        <span className="font-medium">{formatCurrency(service.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">Thanh toán</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Tổng tiền:</span>
                      <span className="font-medium">{formatCurrency(booking.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Đã đặt cọc:</span>
                      <span className="font-medium">{formatCurrency(booking.depositAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Còn lại:</span>
                      <span className="font-medium">{formatCurrency(booking.totalAmount - booking.depositAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trạng thái:</span>
                      <span className={`font-medium ${
                        booking.status === 'confirmed' ? 'text-green-600' :
                        booking.status === 'pending' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {booking.status === 'confirmed' ? 'Đã xác nhận' :
                         booking.status === 'pending' ? 'Chờ xác nhận' :
                         'Đã hủy'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
