import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useWebSocket } from "@/hooks/use-websocket";
import { 
  Users, 
  Calendar, 
  Clock, 
  Plus, 
  Edit2, 
  Trash2, 
  Star,
  User,
  CalendarX,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from "lucide-react";

export default function AdminPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTechnician, setSelectedTechnician] = useState<number | null>(null);
  const [showTechnicianDialog, setShowTechnicianDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<any>(null);

  // WebSocket connection for real-time updates
  useWebSocket('/ws', {
    onMessage: (data) => {
      if (data.type === 'booking_created' || data.type === 'booking_updated') {
        queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
        queryClient.invalidateQueries({ queryKey: ['/api/availability'] });
      }
    },
  });

  // Fetch data
  const { data: technicians, isLoading: techniciansLoading } = useQuery({
    queryKey: ['/api/technicians'],
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['/api/bookings'],
  });

  const { data: blockedSlots, isLoading: blockedSlotsLoading } = useQuery({
    queryKey: ['/api/blocked-time-slots'],
  });

  // Mutations
  const createTechnicianMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/technicians', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/technicians'] });
      setShowTechnicianDialog(false);
      setEditingTechnician(null);
      toast({
        title: "Thành công",
        description: "Đã thêm kỹ thuật viên mới",
      });
    },
  });

  const updateTechnicianMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest('PUT', `/api/technicians/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/technicians'] });
      setShowTechnicianDialog(false);
      setEditingTechnician(null);
      toast({
        title: "Thành công",
        description: "Đã cập nhật thông tin kỹ thuật viên",
      });
    },
  });

  const deleteTechnicianMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/technicians/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/technicians'] });
      toast({
        title: "Thành công",
        description: "Đã xóa kỹ thuật viên",
      });
    },
  });

  const blockTimeSlotMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/blocked-time-slots', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blocked-time-slots'] });
      queryClient.invalidateQueries({ queryKey: ['/api/availability'] });
      setShowBlockDialog(false);
      toast({
        title: "Thành công",
        description: "Đã block thời gian thành công",
      });
    },
  });

  const unblockTimeSlotMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/blocked-time-slots/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blocked-time-slots'] });
      queryClient.invalidateQueries({ queryKey: ['/api/availability'] });
      toast({
        title: "Thành công",
        description: "Đã bỏ block thời gian",
      });
    },
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest('PUT', `/api/bookings/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Thành công",
        description: "Đã cập nhật trạng thái đặt lịch",
      });
    },
  });

  // Form handlers
  const handleTechnicianSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      name: formData.get('name') as string,
      birthYear: parseInt(formData.get('birthYear') as string),
      experience: parseInt(formData.get('experience') as string),
      specialties: (formData.get('specialties') as string).split(',').map(s => s.trim()),
      notes: formData.get('notes') as string,
      avatar: formData.get('avatar') as string,
    };

    if (editingTechnician) {
      updateTechnicianMutation.mutate({ id: editingTechnician.id, data });
    } else {
      createTechnicianMutation.mutate(data);
    }
  };

  const handleBlockTimeSlot = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      technicianId: parseInt(formData.get('technicianId') as string),
      blockDate: new Date(formData.get('blockDate') as string),
      startTime: formData.get('startTime') as string,
      endTime: formData.get('endTime') as string,
      reason: formData.get('reason') as string,
    };

    blockTimeSlotMutation.mutate(data);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Đã xác nhận';
      case 'pending':
        return 'Chờ xác nhận';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const todayBookings = bookings?.filter((booking: any) => {
    const bookingDate = new Date(booking.bookingDate);
    const today = new Date();
    return bookingDate.toDateString() === today.toDateString();
  });

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Kỹ thuật viên</p>
                <p className="text-2xl font-bold">{technicians?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Lịch hẹn hôm nay</p>
                <p className="text-2xl font-bold">{todayBookings?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CalendarX className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Thời gian bị block</p>
                <p className="text-2xl font-bold">{blockedSlots?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm text-gray-600">Chờ xác nhận</p>
                <p className="text-2xl font-bold">
                  {bookings?.filter((b: any) => b.status === 'pending').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="technicians" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="technicians">Kỹ thuật viên</TabsTrigger>
          <TabsTrigger value="bookings">Lịch đặt</TabsTrigger>
          <TabsTrigger value="schedule">Quản lý lịch</TabsTrigger>
        </TabsList>

        {/* Technicians Tab */}
        <TabsContent value="technicians" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Quản lý kỹ thuật viên</h3>
            <Dialog open={showTechnicianDialog} onOpenChange={setShowTechnicianDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingTechnician(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm kỹ thuật viên
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingTechnician ? 'Cập nhật kỹ thuật viên' : 'Thêm kỹ thuật viên mới'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleTechnicianSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Tên kỹ thuật viên</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editingTechnician?.name || ''}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="birthYear">Năm sinh</Label>
                    <Input
                      id="birthYear"
                      name="birthYear"
                      type="number"
                      defaultValue={editingTechnician?.birthYear || ''}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="experience">Kinh nghiệm (năm)</Label>
                    <Input
                      id="experience"
                      name="experience"
                      type="number"
                      defaultValue={editingTechnician?.experience || ''}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="specialties">Chuyên môn (phân cách bằng dấu phẩy)</Label>
                    <Input
                      id="specialties"
                      name="specialties"
                      defaultValue={editingTechnician?.specialties?.join(', ') || ''}
                      placeholder="Massage Thái, Massage toàn thân"
                    />
                  </div>
                  <div>
                    <Label htmlFor="avatar">URL ảnh đại diện</Label>
                    <Input
                      id="avatar"
                      name="avatar"
                      defaultValue={editingTechnician?.avatar || ''}
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Ghi chú</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      defaultValue={editingTechnician?.notes || ''}
                      placeholder="Ghi chú về kỹ thuật viên..."
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button type="submit" disabled={createTechnicianMutation.isPending || updateTechnicianMutation.isPending}>
                      {(createTechnicianMutation.isPending || updateTechnicianMutation.isPending) && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      {editingTechnician ? 'Cập nhật' : 'Thêm'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowTechnicianDialog(false)}
                    >
                      Hủy
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {techniciansLoading ? (
              <div className="col-span-2 flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              technicians?.map((technician: any) => (
                <Card key={technician.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      {technician.avatar && (
                        <img
                          src={technician.avatar}
                          alt={technician.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium">{technician.name}</h4>
                        <p className="text-sm text-gray-500">
                          Năm sinh: {technician.birthYear} • {technician.experience} năm kinh nghiệm
                        </p>
                        <div className="flex items-center space-x-1 mt-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600">{technician.rating}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingTechnician(technician);
                            setShowTechnicianDialog(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteTechnicianMutation.mutate(technician.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {technician.specialties && technician.specialties.length > 0 && (
                      <div className="mb-2">
                        <p className="text-sm text-gray-600">Chuyên môn:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {technician.specialties.map((specialty: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {technician.notes && (
                      <p className="text-sm text-gray-600">{technician.notes}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Lịch đặt hôm nay</h3>
          </div>

          <div className="space-y-4">
            {bookingsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : todayBookings?.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Chưa có lịch đặt nào hôm nay</p>
                </CardContent>
              </Card>
            ) : (
              todayBookings?.map((booking: any) => (
                <Card key={booking.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{booking.customerName}</h4>
                          <p className="text-sm text-gray-500">{booking.customerPhone}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(booking.status)}>
                        {getStatusText(booking.status)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Thời gian:</p>
                        <p className="font-medium">{booking.startTime} - {booking.endTime}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Kỹ thuật viên:</p>
                        <p className="font-medium">
                          {technicians?.find((t: any) => t.id === booking.technicianId)?.name || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Mã đặt lịch:</p>
                        <p className="font-medium">{booking.bookingCode}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Tổng tiền:</p>
                        <p className="font-medium">{formatCurrency(booking.totalAmount)}</p>
                      </div>
                    </div>

                    {booking.status === 'pending' && (
                      <div className="flex space-x-2 mt-4">
                        <Button
                          size="sm"
                          onClick={() => updateBookingMutation.mutate({
                            id: booking.id,
                            data: { status: 'confirmed' }
                          })}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Xác nhận
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateBookingMutation.mutate({
                            id: booking.id,
                            data: { status: 'cancelled' }
                          })}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Hủy
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Block Time Slot */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CalendarX className="h-5 w-5" />
                  <span>Block thời gian</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Block thời gian mới
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Block thời gian</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleBlockTimeSlot} className="space-y-4">
                      <div>
                        <Label htmlFor="technicianId">Kỹ thuật viên</Label>
                        <Select name="technicianId" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn kỹ thuật viên" />
                          </SelectTrigger>
                          <SelectContent>
                            {technicians?.map((tech: any) => (
                              <SelectItem key={tech.id} value={tech.id.toString()}>
                                {tech.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="blockDate">Ngày</Label>
                        <Input
                          id="blockDate"
                          name="blockDate"
                          type="date"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="startTime">Từ</Label>
                          <Input
                            id="startTime"
                            name="startTime"
                            type="time"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="endTime">Đến</Label>
                          <Input
                            id="endTime"
                            name="endTime"
                            type="time"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="reason">Lý do</Label>
                        <Textarea
                          id="reason"
                          name="reason"
                          placeholder="Lý do block thời gian..."
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button type="submit" disabled={blockTimeSlotMutation.isPending}>
                          {blockTimeSlotMutation.isPending && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Block
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowBlockDialog(false)}
                        >
                          Hủy
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Blocked Time Slots */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Thời gian đã block</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {blockedSlotsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : blockedSlots?.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      Chưa có thời gian nào bị block
                    </p>
                  ) : (
                    blockedSlots?.map((slot: any) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium">
                            {technicians?.find((t: any) => t.id === slot.technicianId)?.name || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDateTime(slot.blockDate)} • {slot.startTime} - {slot.endTime}
                          </p>
                          {slot.reason && (
                            <p className="text-xs text-gray-500 mt-1">{slot.reason}</p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => unblockTimeSlotMutation.mutate(slot.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
