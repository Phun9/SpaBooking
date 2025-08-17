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
  Loader2,
  Search,
  Filter,
  Eye
} from "lucide-react";

export default function AdminPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTechnician, setSelectedTechnician] = useState<number | null>(null);
  const [showTechnicianDialog, setShowTechnicianDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<any>(null);
  const [bookingFilters, setBookingFilters] = useState({
    search: '',
    technician: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);

  // WebSocket connection for real-time updates
  const handleWebSocketMessage = (data: any) => {
    if (data.type === 'booking_created' || data.type === 'booking_updated') {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/availability'] });
    }
  };

  useWebSocket('/ws', {
    onMessage: handleWebSocketMessage,
  });

  // Fetch data
  const { data: technicians, isLoading: techniciansLoading } = useQuery({
    queryKey: ['/api/technicians'],
    queryFn: async () => {
      const response = await fetch('/api/technicians');
      if (!response.ok) throw new Error('Failed to fetch technicians');
      return response.json();
    },
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['/api/bookings'],
    queryFn: async () => {
      const response = await fetch('/api/bookings');
      if (!response.ok) throw new Error('Failed to fetch bookings');
      return response.json();
    },
  });

  const { data: blockedSlots, isLoading: blockedSlotsLoading } = useQuery({
    queryKey: ['/api/blocked-time-slots'],
    queryFn: async () => {
      const response = await fetch('/api/blocked-time-slots');
      if (!response.ok) throw new Error('Failed to fetch blocked slots');
      return response.json();
    },
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

  const todayBookings = Array.isArray(bookings) ? bookings.filter((booking: any) => {
    const bookingDate = new Date(booking.bookingDate);
    const today = new Date();
    return bookingDate.toDateString() === today.toDateString();
  }) : [];

  const filteredBookings = Array.isArray(bookings) ? bookings.filter((booking: any) => {
    const searchMatch = !bookingFilters.search || 
      booking.customerName?.toLowerCase().includes(bookingFilters.search.toLowerCase()) ||
      booking.customerPhone?.includes(bookingFilters.search) ||
      booking.bookingCode?.toLowerCase().includes(bookingFilters.search.toLowerCase());
    
    const technicianMatch = !bookingFilters.technician || bookingFilters.technician === 'all' || 
      booking.technicianId?.toString() === bookingFilters.technician;
    
    const statusMatch = !bookingFilters.status || bookingFilters.status === 'all' || 
      booking.status === bookingFilters.status;
    
    const dateMatch = (!bookingFilters.dateFrom || new Date(booking.bookingDate) >= new Date(bookingFilters.dateFrom)) &&
                     (!bookingFilters.dateTo || new Date(booking.bookingDate) <= new Date(bookingFilters.dateTo));
    
    return searchMatch && technicianMatch && statusMatch && dateMatch;
  }) : [];


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
                <p className="text-2xl font-bold">{Array.isArray(technicians) ? technicians.length : 0}</p>
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
                <p className="text-2xl font-bold">{todayBookings.length}</p>
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
                <p className="text-2xl font-bold">{Array.isArray(blockedSlots) ? blockedSlots.length : 0}</p>
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
                  {Array.isArray(bookings) ? bookings.filter((b: any) => b.status === 'pending').length : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="technicians" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="technicians">Kỹ thuật viên</TabsTrigger>
          <TabsTrigger value="bookings">Lịch đặt hôm nay</TabsTrigger>
          <TabsTrigger value="all-bookings">Tất cả lịch đặt</TabsTrigger>
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
            ) : Array.isArray(technicians) ? (
              technicians.map((technician: any) => (
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
            ) : (
              <div className="col-span-2 text-center py-4 text-gray-500">
                Không có kỹ thuật viên nào
              </div>
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
                          {Array.isArray(technicians) ? technicians.find((t: any) => t.id === booking.technicianId)?.name || 'N/A' : 'N/A'}
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

        {/* All Bookings Tab */}
        <TabsContent value="all-bookings" className="space-y-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Tất cả lịch đặt</h3>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Bộ lọc</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="search">Tìm kiếm</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Tên, SĐT, mã đặt lịch..."
                      value={bookingFilters.search}
                      onChange={(e) => setBookingFilters({...bookingFilters, search: e.target.value})}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="technician-filter">Kỹ thuật viên</Label>
                  <Select
                    value={bookingFilters.technician}
                    onValueChange={(value) => setBookingFilters({...bookingFilters, technician: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả kỹ thuật viên" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả kỹ thuật viên</SelectItem>
                      {Array.isArray(technicians) ? technicians.map((tech: any) => (
                        <SelectItem key={tech.id} value={tech.id.toString()}>
                          {tech.name}
                        </SelectItem>
                      )) : null}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status-filter">Trạng thái</Label>
                  <Select
                    value={bookingFilters.status}
                    onValueChange={(value) => setBookingFilters({...bookingFilters, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả trạng thái</SelectItem>
                      <SelectItem value="pending">Chờ xác nhận</SelectItem>
                      <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                      <SelectItem value="cancelled">Đã hủy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date-from">Từ ngày</Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={bookingFilters.dateFrom}
                    onChange={(e) => setBookingFilters({...bookingFilters, dateFrom: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="date-to">Đến ngày</Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={bookingFilters.dateTo}
                    onChange={(e) => setBookingFilters({...bookingFilters, dateTo: e.target.value})}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => setBookingFilters({search: '', technician: 'all', status: 'all', dateFrom: '', dateTo: ''})}
                    className="w-full"
                  >
                    Xóa bộ lọc
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bookings List */}
          <div className="space-y-4">
            {bookingsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : filteredBookings.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Không tìm thấy lịch đặt nào</p>
                </CardContent>
              </Card>
            ) : (
              filteredBookings.map((booking: any) => (
                <Card key={booking.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-lg">{booking.customerName}</h4>
                          <p className="text-sm text-gray-500">{booking.customerPhone}</p>
                          <p className="text-xs text-gray-400">Mã: {booking.bookingCode}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(booking.status)}>
                          {getStatusText(booking.status)}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowBookingDetails(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 font-medium">Ngày & Giờ:</p>
                        <p className="font-medium">{formatDateTime(booking.bookingDate)}</p>
                        <p className="text-sm">{booking.startTime} - {booking.endTime}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium">Kỹ thuật viên:</p>
                        <p className="font-medium">
                          {Array.isArray(technicians) ? technicians.find((t: any) => t.id === booking.technicianId)?.name || 'N/A' : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium">Thời gian massage:</p>
                        <p className="font-medium">{booking.duration} phút</p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium">Tổng tiền:</p>
                        <p className="font-medium text-lg text-green-600">{formatCurrency(booking.totalAmount)}</p>
                        <p className="text-xs text-gray-500">Cọc: {formatCurrency(booking.depositAmount)}</p>
                      </div>
                    </div>

                    {booking.customerNotes && (
                      <div className="mt-3 p-2 bg-gray-50 rounded">
                        <p className="text-sm text-gray-600"><strong>Ghi chú:</strong> {booking.customerNotes}</p>
                      </div>
                    )}

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

          {/* Booking Details Dialog */}
          <Dialog open={showBookingDetails} onOpenChange={setShowBookingDetails}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Chi tiết đặt lịch - {selectedBooking?.bookingCode}</DialogTitle>
              </DialogHeader>
              {selectedBooking && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Thông tin khách hàng</h4>
                      <div className="space-y-1 text-sm">
                        <p><strong>Tên:</strong> {selectedBooking.customerName}</p>
                        <p><strong>SĐT:</strong> {selectedBooking.customerPhone}</p>
                        {selectedBooking.customerNotes && (
                          <p><strong>Ghi chú:</strong> {selectedBooking.customerNotes}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Thông tin dịch vụ</h4>
                      <div className="space-y-1 text-sm">
                        <p><strong>Ngày:</strong> {formatDateTime(selectedBooking.bookingDate)}</p>
                        <p><strong>Giờ:</strong> {selectedBooking.startTime} - {selectedBooking.endTime}</p>
                        <p><strong>Thời gian:</strong> {selectedBooking.duration} phút</p>
                        <p><strong>Kỹ thuật viên:</strong> {Array.isArray(technicians) ? technicians.find((t: any) => t.id === selectedBooking.technicianId)?.name || 'N/A' : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Thanh toán</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Tổng tiền:</strong> {formatCurrency(selectedBooking.totalAmount)}</p>
                      <p><strong>Tiền cọc:</strong> {formatCurrency(selectedBooking.depositAmount)}</p>
                      <p><strong>Trạng thái thanh toán:</strong> {selectedBooking.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}</p>
                      <p><strong>Phương thức:</strong> {selectedBooking.paymentMethod || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Trạng thái</h4>
                    <Badge className={getStatusColor(selectedBooking.status)}>
                      {getStatusText(selectedBooking.status)}
                    </Badge>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
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
                            {Array.isArray(technicians) ? technicians.map((tech: any) => (
                              <SelectItem key={tech.id} value={tech.id.toString()}>
                                {tech.name}
                              </SelectItem>
                            )) : null}
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
                  ) : !Array.isArray(blockedSlots) || blockedSlots.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      Chưa có thời gian nào bị block
                    </p>
                  ) : (
                    blockedSlots.map((slot: any) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium">
                            {Array.isArray(technicians) ? technicians.find((t: any) => t.id === slot.technicianId)?.name || 'N/A' : 'N/A'}
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
