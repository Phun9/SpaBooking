import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

interface ServiceSelectionProps {
  bookingData: any;
  onBookingDataChange: (data: any) => void;
}

export default function ServiceSelection({ bookingData, onBookingDataChange }: ServiceSelectionProps) {
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['/api/services'],
  });

  const { data: additionalServices, isLoading: additionalLoading } = useQuery({
    queryKey: ['/api/additional-services'],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const handleServiceChange = (service: any) => {
    const basePrice = bookingData.selectedDuration === 60 ? service.price60 : service.price90;
    const additionalPrice = bookingData.additionalServices.reduce((sum: number, add: any) => sum + add.price, 0);
    const totalAmount = basePrice + additionalPrice;
    const depositAmount = Math.round(totalAmount * 0.2);

    onBookingDataChange({
      ...bookingData,
      selectedService: service,
      totalAmount,
      depositAmount,
    });
  };

  const handleDurationChange = (duration: number) => {
    if (bookingData.selectedService) {
      const basePrice = duration === 60 ? bookingData.selectedService.price60 : bookingData.selectedService.price90;
      const additionalPrice = bookingData.additionalServices.reduce((sum: number, add: any) => sum + add.price, 0);
      const totalAmount = basePrice + additionalPrice;
      const depositAmount = Math.round(totalAmount * 0.2);

      onBookingDataChange({
        ...bookingData,
        selectedDuration: duration,
        totalAmount,
        depositAmount,
      });
    }
  };

  const handleAdditionalServiceChange = (service: any, checked: boolean) => {
    let newAdditionalServices;
    
    if (checked) {
      newAdditionalServices = [...bookingData.additionalServices, service];
    } else {
      newAdditionalServices = bookingData.additionalServices.filter((s: any) => s.id !== service.id);
    }

    const basePrice = bookingData.selectedService 
      ? (bookingData.selectedDuration === 60 ? bookingData.selectedService.price60 : bookingData.selectedService.price90)
      : 0;
    const additionalPrice = newAdditionalServices.reduce((sum: number, add: any) => sum + add.price, 0);
    const totalAmount = basePrice + additionalPrice;
    const depositAmount = Math.round(totalAmount * 0.2);

    onBookingDataChange({
      ...bookingData,
      additionalServices: newAdditionalServices,
      totalAmount,
      depositAmount,
    });
  };

  if (servicesLoading || additionalLoading) {
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
        <CardTitle>Chọn dịch vụ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Services */}
        <div>
          <h4 className="font-medium mb-4">Dịch vụ chính</h4>
          <RadioGroup
            value={bookingData.selectedService?.id?.toString() || ""}
            onValueChange={(value) => {
              const service = services?.find((s: any) => s.id.toString() === value);
              if (service) handleServiceChange(service);
            }}
          >
            <div className="space-y-4">
              {services?.map((service: any) => (
                <div key={service.id} className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={service.id.toString()} id={service.id.toString()} />
                    <Label htmlFor={service.id.toString()} className="flex-1">
                      <div className="font-medium">{service.name}</div>
                      <div className="text-sm text-gray-500">{service.description}</div>
                    </Label>
                  </div>
                  
                  {bookingData.selectedService?.id === service.id && (
                    <div className="ml-6 space-y-2">
                      <div className="flex space-x-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id={`${service.id}-60`}
                            name="duration"
                            checked={bookingData.selectedDuration === 60}
                            onChange={() => handleDurationChange(60)}
                            className="w-4 h-4 text-primary"
                          />
                          <Label htmlFor={`${service.id}-60`} className="text-sm">
                            60 phút - {formatCurrency(service.price60)}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id={`${service.id}-90`}
                            name="duration"
                            checked={bookingData.selectedDuration === 90}
                            onChange={() => handleDurationChange(90)}
                            className="w-4 h-4 text-primary"
                          />
                          <Label htmlFor={`${service.id}-90`} className="text-sm">
                            90 phút - {formatCurrency(service.price90)}
                          </Label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* Additional Services */}
        <div>
          <h4 className="font-medium mb-3">Dịch vụ đi kèm</h4>
          <div className="space-y-2">
            {additionalServices?.map((service: any) => (
              <div key={service.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`additional-${service.id}`}
                  checked={bookingData.additionalServices.some((s: any) => s.id === service.id)}
                  onCheckedChange={(checked) => handleAdditionalServiceChange(service, checked)}
                />
                <Label htmlFor={`additional-${service.id}`} className="text-sm">
                  {service.name} (+{formatCurrency(service.price)})
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
