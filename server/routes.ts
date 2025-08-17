import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { simpleStorage } from "./storage-simple";
import { insertBookingSchema, insertTechnicianSchema, insertBlockedTimeSlotSchema } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import * as schema from "@shared/schema";
import { eq, and } from "drizzle-orm";

// Helper function to convert time string to minutes
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Availability logic functions
const generateTimeSlots = () => {
  const slots = [];
  // Generate hourly slots from 13:00 to 22:00
  for (let hour = 13; hour <= 21; hour++) {
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    slots.push(timeStr);
  }
  return slots;
};

const getAvailableTimeSlots = async (dateStr: string, duration: number) => {
  try {
    const slots = generateTimeSlots();
    const technicians = await simpleStorage.getTechnicians();
    const date = new Date(dateStr + 'T00:00:00.000Z');
    
    // Get existing bookings for the date
    const existingBookings = await db.select().from(schema.bookings)
      .where(eq(schema.bookings.bookingDate, date));
    
    // Get blocked time slots for the date
    const blockedSlots = await db.select().from(schema.blockedTimeSlots)
      .where(eq(schema.blockedTimeSlots.blockDate, date));
    
    const availableSlots = [];
    
    for (const timeSlot of slots) {
      const availableTechnicians = [];
      
      for (const technician of technicians) {
        // Check if technician is available at this time slot
        // Need to check if this time slot conflicts with any existing booking
        const isBooked = existingBookings.some(booking => {
          if (booking.technicianId !== technician.id) return false;
          
          // Convert times to minutes for easier calculation
          const slotStart = timeToMinutes(timeSlot);
          const bookingStart = timeToMinutes(booking.startTime);
          const bookingEnd = timeToMinutes(booking.endTime);
          
          // Check if this time slot overlaps with the booking
          return slotStart >= bookingStart && slotStart < bookingEnd;
        });
        
        const isBlocked = blockedSlots.some(blocked => {
          if (blocked.technicianId !== technician.id) return false;
          
          // Convert times to minutes for easier calculation
          const slotStart = timeToMinutes(timeSlot);
          const blockedStart = timeToMinutes(blocked.startTime);
          const blockedEnd = timeToMinutes(blocked.endTime);
          
          // Check if this time slot falls within the blocked period
          return slotStart >= blockedStart && slotStart < blockedEnd;
        });
        
        if (!isBooked && !isBlocked) {
          availableTechnicians.push(technician);
        }
      }
      
      if (availableTechnicians.length > 0) {
        availableSlots.push({
          time: timeSlot,
          availableTechnicians
        });
      }
    }
    
    return availableSlots;
  } catch (error) {
    console.error('Error getting available time slots:', error);
    return [];
  }
};

const getTechnicianAvailability = async (technicianId: number, dateStr: string) => {
  try {
    const slots = generateTimeSlots();
    const date = new Date(dateStr + 'T00:00:00.000Z');
    
    // Get existing bookings for the technician and date
    const existingBookings = await db.select().from(schema.bookings)
      .where(and(
        eq(schema.bookings.technicianId, technicianId),
        eq(schema.bookings.bookingDate, date)
      ));
    
    // Get blocked time slots for the technician and date
    const blockedSlots = await db.select().from(schema.blockedTimeSlots)
      .where(and(
        eq(schema.blockedTimeSlots.technicianId, technicianId),
        eq(schema.blockedTimeSlots.blockDate, date)
      ));
    
    const availableSlots = slots.filter(timeSlot => {
      // Check if this time slot conflicts with any existing booking
      const isBooked = existingBookings.some(booking => {
        // Convert times to minutes for easier calculation
        const slotStart = timeToMinutes(timeSlot);
        const bookingStart = timeToMinutes(booking.startTime);
        const bookingEnd = timeToMinutes(booking.endTime);
        
        // Check if this time slot overlaps with the booking
        return slotStart >= bookingStart && slotStart < bookingEnd;
      });
      
      const isBlocked = blockedSlots.some(blockedSlot => {
        // Convert times to minutes for easier calculation
        const slotStart = timeToMinutes(timeSlot);
        const blockedStart = timeToMinutes(blockedSlot.startTime);
        const blockedEnd = timeToMinutes(blockedSlot.endTime);
        
        // Check if this time slot falls within the blocked period
        return slotStart >= blockedStart && slotStart < blockedEnd;
      });
      
      return !isBooked && !isBlocked;
    });
    
    return availableSlots;
  } catch (error) {
    console.error('Error getting technician availability:', error);
    return [];
  }
};

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
      const technician = await simpleStorage.createTechnician(technicianData);
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
      const technician = await simpleStorage.updateTechnician(id, technicianData);
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
      await simpleStorage.deleteTechnician(id);
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
      const services = await simpleStorage.getAdditionalServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch additional services" });
    }
  });

  // Availability
  app.get("/api/availability/:date/:duration", async (req, res) => {
    try {
      const { date, duration } = req.params;
      if (!date || !duration) {
        return res.status(400).json({ message: "Date and duration are required" });
      }
      
      const availability = await getAvailableTimeSlots(
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
      
      const availability = await getTechnicianAvailability(id, date as string);
      res.json(availability);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch technician availability" });
    }
  });

  // Bookings
  app.get("/api/bookings", async (req, res) => {
    try {
      const bookings = await simpleStorage.getBookings();
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/bookings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const booking = await simpleStorage.getBooking(id);
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
      const booking = await simpleStorage.getBookingByCode(code);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Get related data
      const technician = await simpleStorage.getTechnician(booking.technicianId!);
      const service = await simpleStorage.getService(booking.serviceId!);
      const additionalServices = await Promise.all(
        (booking.additionalServiceIds || []).map(id => simpleStorage.getAdditionalService(id))
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
      console.log("Booking payload received:", JSON.stringify(req.body, null, 2));
      const bookingData = insertBookingSchema.parse(req.body);
      
      const booking = await simpleStorage.createBooking(bookingData);
      
      broadcast({ type: 'booking_created', data: booking });
      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log("Validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Booking creation error:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.put("/api/bookings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const bookingData = insertBookingSchema.partial().parse(req.body);
      const booking = await simpleStorage.updateBooking(id, bookingData);
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
      await simpleStorage.deleteBooking(id);
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
      const booking = await simpleStorage.getBooking(id);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Mock payment verification - in real implementation, this would check with payment provider
      const isPaymentValid = Math.random() > 0.1; // 90% success rate for demo
      
      if (isPaymentValid) {
        const updatedBooking = await simpleStorage.updateBooking(id, {
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
      const slots = await simpleStorage.getBlockedTimeSlots();
      res.json(slots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blocked time slots" });
    }
  });

  app.post("/api/blocked-time-slots", async (req, res) => {
    try {
      const slotData = insertBlockedTimeSlotSchema.parse(req.body);
      const slot = await simpleStorage.createBlockedTimeSlot(slotData);
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
      await simpleStorage.deleteBlockedTimeSlot(id);
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
      const admin = await simpleStorage.getAdminUserByUsername(username);
      
      if (!admin || admin.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // In a real implementation, you would generate and return a JWT token
      res.json({ success: true, admin: { id: admin.id, username: admin.username } });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });


  return httpServer;
}
