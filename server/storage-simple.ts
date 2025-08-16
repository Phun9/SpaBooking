import { db } from "./db";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

export class SimpleDatabaseStorage {
  // Initialize sample data
  async initializeSampleData() {
    try {
      // Check if data already exists
      const existingTechnicians = await db.select().from(schema.technicians).limit(1);
      if (existingTechnicians.length > 0) {
        console.log("Sample data already exists");
        return;
      }

      // Create sample technicians
      const techniciansData = [
        {
          name: "Nguyễn Thị Lan",
          birthYear: 1985,
          experience: 8,
          avatar: null,
          photos: ["https://via.placeholder.com/150x200/4F46E5/FFFFFF?text=Technician+1"],
          notes: "Chuyên massage thái và massage toàn thân",
          specialties: ["Massage Thái", "Massage Toàn Thân"],
          rating: "4.8",
          isActive: true
        },
        {
          name: "Trần Văn Minh",
          birthYear: 1990,
          experience: 5,
          avatar: null,
          photos: ["https://via.placeholder.com/150x200/059669/FFFFFF?text=Technician+2"],
          notes: "Chuyên massage cổ vai gáy và châm cứu",
          specialties: ["Massage Cổ-Vai-Gáy", "Châm cứu"],
          rating: "4.5",
          isActive: true
        },
        {
          name: "Lê Thị Hương",
          birthYear: 1988,
          experience: 6,
          avatar: null,
          photos: ["https://via.placeholder.com/150x200/DC2626/FFFFFF?text=Technician+3"],
          notes: "Chuyên massage thư giãn và đá nóng",
          specialties: ["Massage Thư Giãn", "Đá Nóng"],
          rating: "4.7",
          isActive: true
        }
      ];

      await db.insert(schema.technicians).values(techniciansData);

      // Create sample services
      const servicesData = [
        {
          name: "Massage Toàn Thân",
          description: "Massage thư giãn toàn thân giúp giảm căng thẳng",
          price60: 400000,
          price90: 600000,
          isActive: true
        },
        {
          name: "Massage Cổ-Vai-Gáy",
          description: "Massage tập trung vào vùng cổ, vai và gáy",
          price60: 300000,
          price90: 450000,
          isActive: true
        },
        {
          name: "Massage Thái",
          description: "Massage theo phong cách truyền thống Thái Lan",
          price60: 450000,
          price90: 650000,
          isActive: true
        }
      ];

      await db.insert(schema.services).values(servicesData);

      // Create sample additional services
      const additionalServicesData = [
        {
          name: "Đá Nóng",
          price: 100000,
          isActive: true
        },
        {
          name: "Giác Hơi",
          price: 80000,
          isActive: true
        },
        {
          name: "Ấn Huyệt",
          price: 120000,
          isActive: true
        }
      ];

      await db.insert(schema.additionalServices).values(additionalServicesData);

      console.log("Sample data initialized successfully");
    } catch (error) {
      console.error("Error initializing sample data:", error);
    }
  }

  // Simple methods that work with the database
  async getTechnicians() {
    return await db.select().from(schema.technicians).where(eq(schema.technicians.isActive, true));
  }

  async getServices() {
    return await db.select().from(schema.services).where(eq(schema.services.isActive, true));
  }

  async getAdditionalServices() {
    return await db.select().from(schema.additionalServices).where(eq(schema.additionalServices.isActive, true));
  }

  async getBookings() {
    return await db.select().from(schema.bookings);
  }

  async createBooking(bookingData: any) {
    const bookingCode = this.generateBookingCode();
    const qrCode = `MB-${bookingCode}-${Date.now()}`;
    
    const [booking] = await db.insert(schema.bookings).values({
      ...bookingData,
      bookingCode,
      qrCode,
      additionalServiceIds: bookingData.additionalServiceIds || []
    }).returning();
    
    return booking;
  }

  async getBookingByCode(code: string) {
    const [booking] = await db.select().from(schema.bookings).where(eq(schema.bookings.bookingCode, code));
    return booking;
  }

  private generateBookingCode(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8);
    return `MB${timestamp.slice(-6)}${random.toUpperCase()}`;
  }
}

export const simpleStorage = new SimpleDatabaseStorage();