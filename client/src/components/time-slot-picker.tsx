import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

interface TimeSlotPickerProps {
  bookingData: any;
  onBookingDataChange: (data: any) => void;
}

export default function TimeSlotPicker({ bookingData, onBookingDataChange }: TimeSlotPickerProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: availability, isLoading } = useQuery({
    queryKey: ['availability', bookingData.selectedDate, bookingData.selectedDuration],
    queryFn: async () => {
      const response = await fetch(`/api/availability/${bookingData.selectedDate}/${bookingData.selectedDuration}`);
      if (!response.ok) throw new Error('Failed to fetch availability');
      return response.json();
    },
    enabled: !!bookingData.selectedDate && !!bookingData.selectedDuration,
  });

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const generateWeekDays = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        date: date,
        dateString: formatDate(date),
        dayName: date.toLocaleDateString('vi-VN', { weekday: 'short' }),
        dayNumber: date.getDate(),
      });
    }
    
    return days;
  };

  const weekDays = generateWeekDays();

  const handleDateSelect = (dateString: string) => {
    onBookingDataChange({
      ...bookingData,
      selectedDate: dateString,
      selectedTime: "",
      selectedTechnician: null,
    });
  };

  const handleTimeSelect = (time: string, availableTechnicians: any[]) => {
    onBookingDataChange({
      ...bookingData,
      selectedTime: time,
      availableTechnicians,
      selectedTechnician: availableTechnicians.length === 1 ? availableTechnicians[0] : null,
    });
  };

  const handleTechnicianSelect = (technician: any) => {
    onBookingDataChange({
      ...bookingData,
      selectedTechnician: technician,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chọn ngày và giờ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Selection */}
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</Label>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => (
              <button
                key={day.dateString}
                onClick={() => handleDateSelect(day.dateString)}
                className={`text-center p-3 rounded-lg border-2 transition-all ${
                  bookingData.selectedDate === day.dateString
                    ? "border-primary bg-primary text-white"
                    : "border-gray-200 hover:border-primary"
                }`}
              >
                <div className="text-xs">{day.dayName}</div>
                <div className="font-medium">{day.dayNumber}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Time Slots */}
        {bookingData.selectedDate && (
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">Khung giờ còn trống</Label>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {availability && Array.isArray(availability) && availability.length > 0 ? availability.map((slot: any) => (
                  <button
                    key={slot.time}
                    onClick={() => handleTimeSelect(slot.time, slot.availableTechnicians)}
                    className={`text-center p-3 rounded-lg border transition-all ${
                      bookingData.selectedTime === slot.time
                        ? "border-primary bg-primary text-white"
                        : "border-gray-200 hover:border-primary hover:bg-blue-50"
                    }`}
                  >
                    <div className="font-medium">{slot.time}</div>
                    <div className="text-xs text-gray-500">
                      {slot.availableTechnicians.length} KTV
                    </div>
                  </button>
                )) : (
                  <div className="col-span-full text-center py-4 text-gray-500">
                    Không có khung giờ trống
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Technician Selection */}
        {bookingData.selectedTime && bookingData.availableTechnicians && bookingData.availableTechnicians.length > 1 && (
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn kỹ thuật viên ({bookingData.selectedTime})
            </Label>
            <div className="space-y-3">
              {bookingData.availableTechnicians.map((technician: any) => (
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
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{technician.name}</div>
                      <div className="text-sm text-gray-500">
                        {technician.experience} năm kinh nghiệm • {technician.rating}★
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
