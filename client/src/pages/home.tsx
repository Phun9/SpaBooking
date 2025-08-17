import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import BookingFlow from "@/components/booking-flow";
import BookingSummary from "@/components/booking-summary";
import PaymentModal from "@/components/payment-modal";
import QRScanner from "@/components/qr-scanner";
import { Waves, QrCode, Settings } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { toast } = useToast();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [bookingData, setBookingData] = useState({
    method: "time",
    selectedDate: new Date().toISOString().split('T')[0],
    selectedTime: "",
    selectedTechnician: null,
    selectedService: null,
    selectedDuration: 45,
    additionalServices: [],
    customerInfo: {
      name: "",
      phone: "",
      notes: "",
    },
    totalAmount: 0,
    depositAmount: 0,
  });

  // Seed data on first load
  const { data: seedResult } = useQuery({
    queryKey: ['/api/seed'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/seed', { method: 'POST' });
        if (!response.ok) throw new Error('Failed to seed');
        return response.json();
      } catch (error) {
        // Ignore errors if data already exists
        return null;
      }
    },
    staleTime: Infinity,
    retry: false,
  });

  const handleBookingSubmit = () => {
    if (!bookingData.selectedService || !bookingData.selectedTechnician || !bookingData.selectedTime) {
      toast({
        title: "Thông tin chưa đầy đủ",
        description: "Vui lòng chọn đầy đủ dịch vụ, kỹ thuật viên và thời gian",
        variant: "destructive",
      });
      return;
    }

    if (!bookingData.customerInfo.name || !bookingData.customerInfo.phone) {
      toast({
        title: "Thông tin khách hàng chưa đầy đủ",
        description: "Vui lòng điền đầy đủ họ tên và số điện thoại",
        variant: "destructive",
      });
      return;
    }

    setShowPaymentModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Waves className="text-white text-lg" />
              </div>
              <h1 className="text-xl font-bold text-gray-800">Spa Thư Giãn</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowQRScanner(true)}
                className="text-gray-600 hover:text-primary"
              >
                <QrCode className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="text-gray-600 hover:text-primary"
              >
                <Link href="/admin">
                  <Settings className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hero Section */}
          <div className="lg:col-span-3">
            <Card className="bg-gradient-to-r from-primary to-blue-600 text-white">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-2">Đặt Lịch Massage</h2>
                <p className="text-blue-100 mb-4">Thư giãn với dịch vụ massage chuyên nghiệp</p>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <span>🕐</span>
                    <span>13:00 - 20:00</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>⭐</span>
                    <span>4.9/5 (2,341 đánh giá)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Flow */}
          <div className="lg:col-span-2">
            <BookingFlow
              bookingData={bookingData}
              onBookingDataChange={setBookingData}
            />
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <BookingSummary
              bookingData={bookingData}
              onSubmit={handleBookingSubmit}
            />
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        bookingData={bookingData}
      />

      {/* QR Scanner */}
      <QRScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
      />
    </div>
  );
}
