import { pgTable, text, serial, integer, boolean, timestamp, decimal, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const technicians = pgTable("technicians", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  birthYear: integer("birth_year").notNull(),
  avatar: text("avatar"),
  photos: json("photos").$type<string[]>().default([]),
  notes: text("notes"),
  specialties: json("specialties").$type<string[]>().default([]),
  experience: integer("experience").notNull(), // years
  rating: decimal("rating", { precision: 2, scale: 1 }).default('0.0'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price60: integer("price_60").notNull(), // price for 60 minutes in VND
  price90: integer("price_90").notNull(), // price for 90 minutes in VND
  isActive: boolean("is_active").default(true),
});

export const additionalServices = pgTable("additional_services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: integer("price").notNull(), // price in VND
  isActive: boolean("is_active").default(true),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  bookingCode: text("booking_code").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerNotes: text("customer_notes"),
  technicianId: integer("technician_id").references(() => technicians.id),
  serviceId: integer("service_id").references(() => services.id),
  duration: integer("duration").notNull(), // 60 or 90 minutes
  additionalServiceIds: json("additional_service_ids").$type<number[]>().default([]),
  bookingDate: timestamp("booking_date").notNull(),
  startTime: text("start_time").notNull(), // "13:00" format
  endTime: text("end_time").notNull(), // "14:00" format
  totalAmount: integer("total_amount").notNull(),
  depositAmount: integer("deposit_amount").notNull(),
  isPaid: boolean("is_paid").default(false),
  status: text("status").notNull().default("pending"), // pending, confirmed, completed, cancelled
  paymentMethod: text("payment_method"), // bank_transfer, cash, etc.
  qrCode: text("qr_code"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const blockedTimeSlots = pgTable("blocked_time_slots", {
  id: serial("id").primaryKey(),
  technicianId: integer("technician_id").references(() => technicians.id),
  blockDate: timestamp("block_date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const techniciansRelations = relations(technicians, ({ many }) => ({
  bookings: many(bookings),
  blockedTimeSlots: many(blockedTimeSlots),
}));

export const servicesRelations = relations(services, ({ many }) => ({
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  technician: one(technicians, {
    fields: [bookings.technicianId],
    references: [technicians.id],
  }),
  service: one(services, {
    fields: [bookings.serviceId],
    references: [services.id],
  }),
}));

export const blockedTimeSlotsRelations = relations(blockedTimeSlots, ({ one }) => ({
  technician: one(technicians, {
    fields: [blockedTimeSlots.technicianId],
    references: [technicians.id],
  }),
}));

// Insert schemas
export const insertTechnicianSchema = createInsertSchema(technicians).omit({
  id: true,
  createdAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
});

export const insertAdditionalServiceSchema = createInsertSchema(additionalServices).omit({
  id: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  bookingCode: true,
  qrCode: true,
  createdAt: true,
}).extend({
  bookingDate: z.string().or(z.date()).transform((val) => {
    return typeof val === 'string' ? new Date(val) : val;
  }),
});

export const insertBlockedTimeSlotSchema = createInsertSchema(blockedTimeSlots).omit({
  id: true,
  createdAt: true,
}).extend({
  blockDate: z.string().or(z.date()).transform((val) => {
    return typeof val === 'string' ? new Date(val) : val;
  }),
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
});

// Types
export type Technician = typeof technicians.$inferSelect;
export type InsertTechnician = z.infer<typeof insertTechnicianSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type AdditionalService = typeof additionalServices.$inferSelect;
export type InsertAdditionalService = z.infer<typeof insertAdditionalServiceSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type BlockedTimeSlot = typeof blockedTimeSlots.$inferSelect;
export type InsertBlockedTimeSlot = z.infer<typeof insertBlockedTimeSlotSchema>;

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
