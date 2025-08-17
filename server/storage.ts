import {
  technicians,
  services,
  additionalServices,
  bookings,
  blockedTimeSlots,
  adminUsers,
  type Technician,
  type Service,
  type AdditionalService,
  type Booking,
  type BlockedTimeSlot,
  type AdminUser,
  type InsertTechnician,
  type InsertService,
  type InsertAdditionalService,
  type InsertBooking,
  type InsertBlockedTimeSlot,
  type InsertAdminUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, like, desc, sql } from "drizzle-orm";
// import { generateBookingQRCode } from "../client/src/lib/qr-utils";

export interface IStorage {
  // Technicians
  getTechnicians(): Promise<Technician[]>;
  getTechnician(id: number): Promise<Technician | undefined>;
  createTechnician(technician: InsertTechnician): Promise<Technician>;
  updateTechnician(id: number, technician: Partial<InsertTechnician>): Promise<Technician>;
  deleteTechnician(id: number): Promise<void>;

  // Services
  getServices(): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service>;
  deleteService(id: number): Promise<void>;

  // Additional Services
  getAdditionalServices(): Promise<AdditionalService[]>;
  getAdditionalService(id: number): Promise<AdditionalService | undefined>;
  createAdditionalService(service: InsertAdditionalService): Promise<AdditionalService>;
  updateAdditionalService(id: number, service: Partial<InsertAdditionalService>): Promise<AdditionalService>;
  deleteAdditionalService(id: number): Promise<void>;

  // Bookings
  getBookings(): Promise<Booking[]>;
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingByCode(code: string): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, booking: Partial<InsertBooking>): Promise<Booking>;
  deleteBooking(id: number): Promise<void>;
  getBookingsByDate(date: string): Promise<Booking[]>;
  getBookingsByTechnician(technicianId: number, date?: string): Promise<Booking[]>;

  // Blocked Time Slots
  getBlockedTimeSlots(): Promise<BlockedTimeSlot[]>;
  getBlockedTimeSlot(id: number): Promise<BlockedTimeSlot | undefined>;
  createBlockedTimeSlot(slot: InsertBlockedTimeSlot): Promise<BlockedTimeSlot>;
  updateBlockedTimeSlot(id: number, slot: Partial<InsertBlockedTimeSlot>): Promise<BlockedTimeSlot>;
  deleteBlockedTimeSlot(id: number): Promise<void>;
  getBlockedTimeSlotsByTechnician(technicianId: number, date?: string): Promise<BlockedTimeSlot[]>;

  // Admin Users
  getAdminUsers(): Promise<AdminUser[]>;
  getAdminUser(id: number): Promise<AdminUser | undefined>;
  getAdminUserByUsername(username: string): Promise<AdminUser | undefined>;
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;
  updateAdminUser(id: number, user: Partial<InsertAdminUser>): Promise<AdminUser>;
  deleteAdminUser(id: number): Promise<void>;

  // Availability
  getAvailableTimeSlots(date: string, duration: number): Promise<{ time: string; availableTechnicians: Technician[] }[]>;
  getTechnicianAvailability(technicianId: number, date: string): Promise<string[]>;
}

export class DatabaseStorage implements IStorage {
  // Technicians
  async getTechnicians(): Promise<Technician[]> {
    return await db.select().from(technicians).orderBy(technicians.name);
  }

  async getTechnician(id: number): Promise<Technician | undefined> {
    const [technician] = await db.select().from(technicians).where(eq(technicians.id, id));
    return technician;
  }

  async createTechnician(technician: InsertTechnician): Promise<Technician> {
    const [newTechnician] = await db
      .insert(technicians)
      .values(technician)
      .returning();
    return newTechnician;
  }

  async updateTechnician(id: number, technician: Partial<InsertTechnician>): Promise<Technician> {
    const [updatedTechnician] = await db
      .update(technicians)
      .set(technician)
      .where(eq(technicians.id, id))
      .returning();
    return updatedTechnician;
  }

  async deleteTechnician(id: number): Promise<void> {
    await db.delete(technicians).where(eq(technicians.id, id));
  }

  // Services
  async getServices(): Promise<Service[]> {
    return await db.select().from(services).orderBy(services.name);
  }

  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db
      .insert(services)
      .values(service)
      .returning();
    return newService;
  }

  async updateService(id: number, service: Partial<InsertService>): Promise<Service> {
    const [updatedService] = await db
      .update(services)
      .set(service)
      .where(eq(services.id, id))
      .returning();
    return updatedService;
  }

  async deleteService(id: number): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  // Additional Services
  async getAdditionalServices(): Promise<AdditionalService[]> {
    return await db.select().from(additionalServices).orderBy(additionalServices.name);
  }

  async getAdditionalService(id: number): Promise<AdditionalService | undefined> {
    const [service] = await db.select().from(additionalServices).where(eq(additionalServices.id, id));
    return service;
  }

  async createAdditionalService(service: InsertAdditionalService): Promise<AdditionalService> {
    const [newService] = await db
      .insert(additionalServices)
      .values(service)
      .returning();
    return newService;
  }

  async updateAdditionalService(id: number, service: Partial<InsertAdditionalService>): Promise<AdditionalService> {
    const [updatedService] = await db
      .update(additionalServices)
      .set(service)
      .where(eq(additionalServices.id, id))
      .returning();
    return updatedService;
  }

  async deleteAdditionalService(id: number): Promise<void> {
    await db.delete(additionalServices).where(eq(additionalServices.id, id));
  }

  // Bookings
  async getBookings(): Promise<Booking[]> {
    return await db.select().from(bookings).orderBy(desc(bookings.createdAt));
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async getBookingByCode(code: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.bookingCode, code));
    return booking;
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const bookingCode = this.generateBookingCode();
    const qrCode = this.generateQRCode(bookingCode);
    
    const [newBooking] = await db
      .insert(bookings)
      .values({
        ...booking,
        bookingCode,
        qrCode,
      })
      .returning();
    
    return newBooking;
  }

  async updateBooking(id: number, booking: Partial<InsertBooking>): Promise<Booking> {
    const [updatedBooking] = await db
      .update(bookings)
      .set(booking)
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking;
  }

  async deleteBooking(id: number): Promise<void> {
    await db.delete(bookings).where(eq(bookings.id, id));
  }

  async getBookingsByDate(date: string): Promise<Booking[]> {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    
    return await db
      .select()
      .from(bookings)
      .where(and(
        gte(bookings.bookingDate, startDate),
        lte(bookings.bookingDate, endDate)
      ))
      .orderBy(bookings.startTime);
  }

  async getBookingsByTechnician(technicianId: number, date?: string): Promise<Booking[]> {
    let query = db.select().from(bookings).where(eq(bookings.technicianId, technicianId));
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      query = db.select().from(bookings).where(and(
        eq(bookings.technicianId, technicianId),
        gte(bookings.bookingDate, startDate),
        lte(bookings.bookingDate, endDate)
      ));
    }
    
    return await query.orderBy(bookings.startTime);
  }

  // Blocked Time Slots
  async getBlockedTimeSlots(): Promise<BlockedTimeSlot[]> {
    return await db.select().from(blockedTimeSlots).orderBy(desc(blockedTimeSlots.blockDate));
  }

  async getBlockedTimeSlot(id: number): Promise<BlockedTimeSlot | undefined> {
    const [slot] = await db.select().from(blockedTimeSlots).where(eq(blockedTimeSlots.id, id));
    return slot;
  }

  async createBlockedTimeSlot(slot: InsertBlockedTimeSlot): Promise<BlockedTimeSlot> {
    const [newSlot] = await db
      .insert(blockedTimeSlots)
      .values(slot)
      .returning();
    return newSlot;
  }

  async updateBlockedTimeSlot(id: number, slot: Partial<InsertBlockedTimeSlot>): Promise<BlockedTimeSlot> {
    const [updatedSlot] = await db
      .update(blockedTimeSlots)
      .set(slot)
      .where(eq(blockedTimeSlots.id, id))
      .returning();
    return updatedSlot;
  }

  async deleteBlockedTimeSlot(id: number): Promise<void> {
    await db.delete(blockedTimeSlots).where(eq(blockedTimeSlots.id, id));
  }

  async getBlockedTimeSlotsByTechnician(technicianId: number, date?: string): Promise<BlockedTimeSlot[]> {
    let query = db.select().from(blockedTimeSlots).where(eq(blockedTimeSlots.technicianId, technicianId));
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      query = db.select().from(blockedTimeSlots).where(and(
        eq(blockedTimeSlots.technicianId, technicianId),
        gte(blockedTimeSlots.blockDate, startDate),
        lte(blockedTimeSlots.blockDate, endDate)
      ));
    }
    
    return await query.orderBy(blockedTimeSlots.startTime);
  }

  // Admin Users
  async getAdminUsers(): Promise<AdminUser[]> {
    return await db.select().from(adminUsers).orderBy(adminUsers.username);
  }

  async getAdminUser(id: number): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return user;
  }

  async getAdminUserByUsername(username: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return user;
  }

  async createAdminUser(user: InsertAdminUser): Promise<AdminUser> {
    const [newUser] = await db
      .insert(adminUsers)
      .values(user)
      .returning();
    return newUser;
  }

  async updateAdminUser(id: number, user: Partial<InsertAdminUser>): Promise<AdminUser> {
    const [updatedUser] = await db
      .update(adminUsers)
      .set(user)
      .where(eq(adminUsers.id, id))
      .returning();
    return updatedUser;
  }

  async deleteAdminUser(id: number): Promise<void> {
    await db.delete(adminUsers).where(eq(adminUsers.id, id));
  }

  // Availability
  async getAvailableTimeSlots(date: string, duration: number): Promise<{ time: string; availableTechnicians: Technician[] }[]> {
    const allTechnicians = await this.getTechnicians();
    const activeBookings = await this.getBookingsByDate(date);
    const blockedSlots = await this.getBlockedTimeSlotsByDate(date);
    
    const operatingHours = this.generateOperatingHours();
    const availableSlots: { time: string; availableTechnicians: Technician[] }[] = [];
    
    for (const time of operatingHours) {
      const availableTechnicians: Technician[] = [];
      
      for (const technician of allTechnicians) {
        if (technician.isActive && this.isTechnicianAvailable(
          technician,
          time,
          duration,
          activeBookings,
          blockedSlots
        )) {
          availableTechnicians.push(technician);
        }
      }
      
      if (availableTechnicians.length > 0) {
        availableSlots.push({ time, availableTechnicians });
      }
    }
    
    return availableSlots;
  }

  async getTechnicianAvailability(technicianId: number, date: string): Promise<string[]> {
    const technician = await this.getTechnician(technicianId);
    if (!technician || !technician.isActive) return [];
    
    const activeBookings = await this.getBookingsByTechnician(technicianId, date);
    const blockedSlots = await this.getBlockedTimeSlotsByTechnician(technicianId, date);
    
    const operatingHours = this.generateOperatingHours();
    const availableTimes: string[] = [];
    
    for (const time of operatingHours) {
      if (this.isTechnicianAvailable(technician, time, 60, activeBookings, blockedSlots)) {
        availableTimes.push(time);
      }
    }
    
    return availableTimes;
  }

  private async getBlockedTimeSlotsByDate(date: string): Promise<BlockedTimeSlot[]> {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    
    return await db
      .select()
      .from(blockedTimeSlots)
      .where(and(
        gte(blockedTimeSlots.blockDate, startDate),
        lte(blockedTimeSlots.blockDate, endDate)
      ));
  }

  private generateOperatingHours(): string[] {
    const hours = [];
    for (let hour = 9; hour <= 21; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        hours.push(time);
      }
    }
    return hours;
  }

  private isTechnicianAvailable(
    technician: Technician,
    startTime: string,
    duration: number,
    bookings: Booking[],
    blockedSlots: BlockedTimeSlot[]
  ): boolean {
    const endTime = this.addMinutes(startTime, duration);
    
    // Check against existing bookings
    for (const booking of bookings) {
      if (booking.technicianId === technician.id && 
          this.hasTimeConflict(startTime, endTime, booking.startTime, booking.endTime)) {
        return false;
      }
    }
    
    // Check against blocked time slots
    for (const slot of blockedSlots) {
      if (slot.technicianId === technician.id && 
          this.hasTimeConflict(startTime, endTime, slot.startTime, slot.endTime)) {
        return false;
      }
    }
    
    return true;
  }

  private hasTimeConflict(start1: string, end1: string, start2: string, end2: string): boolean {
    return start1 < end2 && end1 > start2;
  }

  private addMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  }

  private generateBookingCode(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8);
    return `MB${timestamp.slice(-6)}${random.toUpperCase()}`;
  }

  private generateQRCode(bookingCode: string): string {
    // Generate QR code data for the booking code
    const qrData = {
      code: bookingCode,
      timestamp: Date.now(),
      type: 'booking'
    };
    return `MB-${bookingCode}-${qrData.timestamp}`;
  }
}

export const storage = new DatabaseStorage();