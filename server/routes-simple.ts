import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { simpleStorage } from "./storage-simple";

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

  // API Routes
  app.get("/api/technicians", async (req, res) => {
    try {
      const technicians = await simpleStorage.getTechnicians();
      res.json(technicians);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch technicians" });
    }
  });

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
      const additionalServices = await simpleStorage.getAdditionalServices();
      res.json(additionalServices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch additional services" });
    }
  });

  app.get("/api/bookings", async (req, res) => {
    try {
      const bookings = await simpleStorage.getBookings();
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/bookings/lookup/:code", async (req, res) => {
    try {
      const code = req.params.code;
      const booking = await simpleStorage.getBookingByCode(code);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    try {
      const bookingData = req.body;
      const booking = await simpleStorage.createBooking(bookingData);
      broadcast({ type: 'booking_created', data: booking });
      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  // Simple availability endpoint
  app.get("/api/availability", async (req, res) => {
    try {
      const { date, duration } = req.query;
      if (!date || !duration) {
        return res.status(400).json({ message: "Date and duration are required" });
      }
      
      // For now, return all technicians as available
      const technicians = await simpleStorage.getTechnicians();
      const operatingHours = [];
      
      // Generate time slots from 9 AM to 9 PM (every 30 minutes)
      for (let hour = 9; hour <= 21; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          operatingHours.push({
            time,
            availableTechnicians: technicians
          });
        }
      }
      
      res.json(operatingHours);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch availability" });
    }
  });

  return httpServer;
}