import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Clock, User, Check } from "lucide-react";
import ServiceSelection from "./service-selection";
import TimeSlotPicker from "./time-slot-picker";
import TechnicianSelection from "./technician-selection";

interface BookingFlowProps {
  bookingData: any;
  onBookingDataChange: (data: any) => void;
}

export default function BookingFlow({ bookingData, onBookingDataChange }: BookingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { number: 1, title: "Chọn cách đặt lịch", completed: currentStep > 1 },
    { number: 2, title: "Chọn dịch vụ", completed: currentStep > 2 },
    { number: 3, title: "Thông tin khách hàng", completed: currentStep > 3 },
  ];

  const handleMethodChange = (method: string) => {
    onBookingDataChange({ ...bookingData, method });
  };

  const handleCustomerInfoChange = (field: string, value: string) => {
    onBookingDataChange({
      ...bookingData,
      customerInfo: {
        ...bookingData.customerInfo,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step.completed
                        ? "bg-green-500 text-white"
                        : currentStep === step.number
                        ? "bg-primary text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step.completed ? <Check className="h-4 w-4" /> : step.number}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      step.completed || currentStep === step.number
                        ? "text-primary"
                        : "text-gray-500"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 bg-gray-200 mx-4" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Booking Method */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Chọn cách đặt lịch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  bookingData.method === "time"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-primary"
                }`}
                onClick={() => handleMethodChange("time")}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Clock className="text-primary text-lg" />
                  </div>
                  <div>
                    <h4 className="font-medium">Theo giờ còn trống</h4>
                    <p className="text-sm text-gray-500">Chọn khung giờ phù hợp</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Xem tất cả khung giờ còn trống và lựa chọn kỹ thuật viên phù hợp
                </p>
              </div>

              <div
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  bookingData.method === "technician"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-primary"
                }`}
                onClick={() => handleMethodChange("technician")}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                    <User className="text-secondary text-lg" />
                  </div>
                  <div>
                    <h4 className="font-medium">Theo kỹ thuật viên</h4>
                    <p className="text-sm text-gray-500">Chọn kỹ thuật viên yêu thích</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Chọn kỹ thuật viên trước, sau đó xem lịch trống của họ
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setCurrentStep(2)}
                disabled={!bookingData.method}
              >
                Tiếp theo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Service Selection & Time/Technician */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* Time/Technician Selection */}
          {bookingData.method === "time" ? (
            <TimeSlotPicker
              bookingData={bookingData}
              onBookingDataChange={onBookingDataChange}
            />
          ) : (
            <TechnicianSelection
              bookingData={bookingData}
              onBookingDataChange={onBookingDataChange}
            />
          )}

          {/* Service Selection */}
          <ServiceSelection
            bookingData={bookingData}
            onBookingDataChange={onBookingDataChange}
          />

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              Quay lại
            </Button>
            <Button
              onClick={() => setCurrentStep(3)}
              disabled={!bookingData.selectedService || !bookingData.selectedTime || !bookingData.selectedTechnician}
            >
              Tiếp theo
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Customer Information */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Thông tin khách hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Họ và tên *</Label>
                <Input
                  id="customerName"
                  type="text"
                  value={bookingData.customerInfo.name}
                  onChange={(e) => handleCustomerInfoChange("name", e.target.value)}
                  placeholder="Nhập họ và tên"
                  required
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Số điện thoại *</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={bookingData.customerInfo.phone}
                  onChange={(e) => handleCustomerInfoChange("phone", e.target.value)}
                  placeholder="Nhập số điện thoại"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="customerNotes">Ghi chú</Label>
                <Textarea
                  id="customerNotes"
                  value={bookingData.customerInfo.notes}
                  onChange={(e) => handleCustomerInfoChange("notes", e.target.value)}
                  placeholder="Ghi chú về yêu cầu đặc biệt (không bắt buộc)"
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-start">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                Quay lại
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
