import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { simpleStorage } from "./storage-simple";
import { insertBookingSchema, insertTechnicianSchema, insertBlockedTimeSlotSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize sample data
  await simpleStorage.initializeSampleData();
  
  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  // Broadcast to all connected clients
  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // Technicians
  app.get("/api/technicians", async (req, res) => {
    try {
      const technicians = await simpleStorage.getTechnicians();
      res.json(technicians);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch technicians" });
    }
  });

  app.get("/api/technicians/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const technicians = await simpleStorage.getTechnicians();
      const technician = technicians.find(t => t.id === id);
      if (!technician) {
        return res.status(404).json({ message: "Technician not found" });
      }
      res.json(technician);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch technician" });
    }
  });

  app.post("/api/technicians", async (req, res) => {
    try {
      const technicianData = insertTechnicianSchema.parse(req.body);
      const technician = await storage.createTechnician(technicianData);
      broadcast({ type: 'technician_created', data: technician });
      res.status(201).json(technician);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create technician" });
    }
  });

  app.put("/api/technicians/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const technicianData = insertTechnicianSchema.partial().parse(req.body);
      const technician = await storage.updateTechnician(id, technicianData);
      broadcast({ type: 'technician_updated', data: technician });
      res.json(technician);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update technician" });
    }
  });

  app.delete("/api/technicians/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTechnician(id);
      broadcast({ type: 'technician_deleted', data: { id } });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete technician" });
    }
  });

  // Services
  app.get("/api/services", async (req, res) => {
    try {
      const services = await simpleStorage.getServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.get("/api/additional-services", async (req, res) => {
    try {
      const services = await storage.getAdditionalServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch additional services" });
    }
  });

  // Availability
  app.get("/api/availability", async (req, res) => {
    try {
      const { date, duration } = req.query;
      if (!date || !duration) {
        return res.status(400).json({ message: "Date and duration are required" });
      }
      
      const availability = await storage.getAvailableTimeSlots(
        date as string,
        parseInt(duration as string)
      );
      res.json(availability);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch availability" });
    }
  });

  app.get("/api/technicians/:id/availability", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { date } = req.query;
      if (!date) {
        return res.status(400).json({ message: "Date is required" });
      }
      
      const availability = await storage.getTechnicianAvailability(id, date as string);
      res.json(availability);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch technician availability" });
    }
  });

  // Bookings
  app.get("/api/bookings", async (req, res) => {
    try {
      const bookings = await storage.getBookings();
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/bookings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  app.get("/api/bookings/lookup/:code", async (req, res) => {
    try {
      const code = req.params.code;
      const booking = await storage.getBookingByCode(code);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Get related data
      const technician = await storage.getTechnician(booking.technicianId!);
      const service = await storage.getService(booking.serviceId!);
      const additionalServices = await Promise.all(
        (booking.additionalServiceIds || []).map(id => storage.getAdditionalService(id))
      );
      
      res.json({
        ...booking,
        technician,
        service,
        additionalServices: additionalServices.filter(Boolean),
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to lookup booking" });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);
      
      // Calculate deposit (20% of total)
      const depositAmount = Math.round(bookingData.totalAmount * 0.2);
      
      const booking = await storage.createBooking({
        ...bookingData,
        depositAmount,
      });
      
      broadcast({ type: 'booking_created', data: booking });
      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.put("/api/bookings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const bookingData = insertBookingSchema.partial().parse(req.body);
      const booking = await storage.updateBooking(id, bookingData);
      broadcast({ type: 'booking_updated', data: booking });
      res.json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  app.delete("/api/bookings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBooking(id);
      broadcast({ type: 'booking_deleted', data: { id } });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete booking" });
    }
  });

  // Mock payment verification
  app.post("/api/bookings/:id/verify-payment", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const booking = await storage.getBooking(id);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Mock payment verification - in real implementation, this would check with payment provider
      const isPaymentValid = Math.random() > 0.1; // 90% success rate for demo
      
      if (isPaymentValid) {
        const updatedBooking = await storage.updateBooking(id, {
          isPaid: true,
          status: 'confirmed',
          paymentMethod: 'bank_transfer',
        });
        
        broadcast({ type: 'payment_verified', data: updatedBooking });
        res.json({ success: true, booking: updatedBooking });
      } else {
        res.status(400).json({ success: false, message: "Payment verification failed" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to verify payment" });
    }
  });

  // Blocked time slots
  app.get("/api/blocked-time-slots", async (req, res) => {
    try {
      const slots = await storage.getBlockedTimeSlots();
      res.json(slots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blocked time slots" });
    }
  });

  app.post("/api/blocked-time-slots", async (req, res) => {
    try {
      const slotData = insertBlockedTimeSlotSchema.parse(req.body);
      const slot = await storage.createBlockedTimeSlot(slotData);
      broadcast({ type: 'time_slot_blocked', data: slot });
      res.status(201).json(slot);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create blocked time slot" });
    }
  });

  app.delete("/api/blocked-time-slots/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBlockedTimeSlot(id);
      broadcast({ type: 'time_slot_unblocked', data: { id } });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete blocked time slot" });
    }
  });

  // Admin authentication (basic implementation)
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const admin = await storage.getAdminUserByUsername(username);
      
      if (!admin || admin.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // In a real implementation, you would generate and return a JWT token
      res.json({ success: true, admin: { id: admin.id, username: admin.username } });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Seed initial data
  app.post("/api/seed", async (req, res) => {
    try {
      // Create default services
      const massageServices = [
        {
          name: "Massage Toàn Body",
          description: "Massage thư giãn toàn thân với tinh dầu thiên nhiên",
          price60: 300000,
          price90: 450000,
        },
        {
          name: "Massage Cổ-Vai-Gáy",
          description: "Massage chuyên sâu vùng cổ, vai, gáy giảm mỏi nhức",
          price60: 250000,
          price90: 350000,
        },
        {
          name: "Massage Thái",
          description: "Massage Thái truyền thống với kỹ thuật kéo giãn",
          price60: 350000,
          price90: 500000,
        },
      ];

      const additionalServices = [
        { name: "Đá Nóng", price: 50000 },
        { name: "Giác Hơi", price: 30000 },
        { name: "Ấn Huyệt", price: 40000 },
      ];

      const technicians = [
        {
          name: "Chị Linh",
          birthYear: 1990,
          experience: 5,
          specialties: ["Massage Thái", "Massage Toàn Body"],
          rating: '4.9',
          notes: "Kỹ thuật viên có kinh nghiệm, phục vụ tận tâm",
          avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
        },
        {
          name: "Anh Minh",
          birthYear: 1985,
          experience: 7,
          specialties: ["Massage Cổ-Vai-Gáy", "Ấn Huyệt"],
          rating: '4.8',
          notes: "Kỹ thuật mạnh tay, phù hợp với khách nam",
          avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
        },
        {
          name: "Chị Hương",
          birthYear: 1992,
          experience: 4,
          specialties: ["Massage Toàn Body", "Đá Nóng"],
          rating: '4.9',
          notes: "Chuyên về massage thư giãn, tay nghề tốt",
          avatar: "https://images.unsplash.com/photo-1594824019243-30a6aa670c3c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
        },
      ];

      // Create services
      for (const service of massageServices) {
        await storage.createService(service);
      }

      for (const service of additionalServices) {
        await storage.createAdditionalService(service);
      }

      // Create technicians
      for (const technician of technicians) {
        await storage.createTechnician(technician);
      }

      // Create admin user
      await storage.createAdminUser({
        username: "admin",
        password: "admin123", // In production, this should be hashed
      });

      res.json({ message: "Seed data created successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to seed data" });
    }
  });

  return httpServer;
}
