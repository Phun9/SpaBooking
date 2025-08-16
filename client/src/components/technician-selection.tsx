import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Star } from "lucide-react";

interface TechnicianSelectionProps {
  bookingData: any;
  onBookingDataChange: (data: any) => void;
}

export default function TechnicianSelection({ bookingData, onBookingDataChange }: TechnicianSelectionProps) {
  const { data: technicians, isLoading: techniciansLoading } = useQuery({
    queryKey: ['/api/technicians'],
  });

  const { data: availability, isLoading: availabilityLoading } = useQuery({
    queryKey: ['/api/technicians', bookingData.selectedTechnician?.id, 'availability', bookingData.selectedDate],
    enabled: !!bookingData.selectedTechnician?.id && !!bookingData.selectedDate,
  });

  const generateDateOptions = () => {
    const options = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      options.push({
        date: date,
        dateString: date.toISOString().split('T')[0],
        displayText: i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : date.toLocaleDateString('vi-VN'),
      });
    }
    
    return options;
  };

  const dateOptions = generateDateOptions();

  const handleTechnicianSelect = (technician: any) => {
    onBookingDataChange({
      ...bookingData,
      selectedTechnician: technician,
      selectedTime: "",
    });
  };

  const handleDateSelect = (dateString: string) => {
    onBookingDataChange({
      ...bookingData,
      selectedDate: dateString,
      selectedTime: "",
    });
  };

  const handleTimeSelect = (time: string) => {
    onBookingDataChange({
      ...bookingData,
      selectedTime: time,
    });
  };

  if (techniciansLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chọn kỹ thuật viên</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Technician Selection */}
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-2">Chọn kỹ thuật viên</Label>
          <div className="space-y-3">
            {technicians?.map((technician: any) => (
              <div
                key={technician.id}
                className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  bookingData.selectedTechnician?.id === technician.id
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-primary"
                }`}
                onClick={() => handleTechnicianSelect(technician)}
              >
                <input
                  type="radio"
                  name="technician"
                  checked={bookingData.selectedTechnician?.id === technician.id}
                  onChange={() => handleTechnicianSelect(technician)}
                  className="w-4 h-4 text-primary"
                />
                <div className="flex items-center space-x-3 flex-1">
                  {technician.avatar && (
                    <img
                      src={technician.avatar}
                      alt={technician.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{technician.name}</div>
                    <div className="text-sm text-gray-500">
                      {technician.experience} năm kinh nghiệm • {technician.rating}★
                    </div>
                    {technician.specialties && technician.specialties.length > 0 && (
                      <div className="text-xs text-gray-400">
                        Chuyên môn: {technician.specialties.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Date Selection */}
        {bookingData.selectedTechnician && (
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {dateOptions.map((option) => (
                <button
                  key={option.dateString}
                  onClick={() => handleDateSelect(option.dateString)}
                  className={`text-center p-3 rounded-lg border-2 transition-all ${
                    bookingData.selectedDate === option.dateString
                      ? "border-primary bg-primary text-white"
                      : "border-gray-200 hover:border-primary"
                  }`}
                >
                  <div className="text-sm font-medium">{option.displayText}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Time Slots */}
        {bookingData.selectedTechnician && bookingData.selectedDate && (
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Giờ còn trống của {bookingData.selectedTechnician.name}
            </Label>
            {availabilityLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {availability?.map((time: string) => (
                  <button
                    key={time}
                    onClick={() => handleTimeSelect(time)}
                    className={`text-center p-3 rounded-lg border transition-all ${
                      bookingData.selectedTime === time
                        ? "border-primary bg-primary text-white"
                        : "border-gray-200 hover:border-primary hover:bg-blue-50"
                    }`}
                  >
                    <div className="font-medium">{time}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
