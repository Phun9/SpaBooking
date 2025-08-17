# Replit.md

## Overview

This is a Vietnamese massage spa booking web application built with a modern full-stack architecture. The system allows customers to book massage appointments, view available time slots, and make deposits for reservations. It includes an admin panel for managing technicians, services, and bookings.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (August 17, 2025)

- **Migration Completed**: Successfully migrated from Replit Agent to Replit environment
- **Blocked Time Slot Bug Fix**: Fixed critical logic error where blocked time slots only blocked exact start times
  - Changed logic to properly block ALL time slots within blocked time ranges
  - Example: If technician blocked 13:00-17:30, now correctly blocks 13:00, 14:00, 15:00, 16:00, 17:00
  - Updated both `getAvailableTimeSlots` and `getTechnicianAvailability` functions
- **UI Bug Fix**: Removed non-functional "Hoàn tất" button from step 3 "Thông tin khách hàng"
  - Button was trying to navigate to non-existent step 4
  - Booking completion is properly handled through BookingSummary component
- **Duration Update**: Changed service duration from 60 minutes to 45 minutes throughout the system:
  - Updated frontend display text from "60 phút" to "45 phút"
  - Modified all duration logic in components (service selection, booking summary, booking lookup)
  - Updated database records: all existing bookings changed from 60 to 45 minutes
  - Updated default duration in booking initialization
  - **Database Schema Update**: Renamed column from `price_60` to `price_45` in services table
  - **Code Update**: Changed all references from `price60` to `price45` throughout the application
  - Fixed total calculation logic in booking summary
  - **Time Slot Bug Fix**: Fixed multi-slot booking availability logic - 90-minute bookings now correctly block all overlapping time slots
- **Enhanced Payment Modals**: Improved payment flow user experience
  - **Success Modal Enhancement**: Added complete booking information including massage time, additional services, total/deposit/remaining amounts
  - **Button Update**: Changed "Xong" to "Hoàn tất" with page refresh functionality
  - **Payment Verification Improvement**: Added complete bank transfer information in verification modal for users who missed previous step
  - **Page Refresh**: Added page refresh functionality when clicking "Hủy" in payment verification modal
- **Database Setup**: Created PostgreSQL database and pushed schema successfully
- **Dependencies**: Installed missing tsx package and resolved build issues

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **UI Library**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Routing**: Wouter for client-side routing
- **State Management**: React Query (TanStack Query) for server state management
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and build processes

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Real-time**: WebSocket support for live updates
- **Session Management**: Express sessions with PostgreSQL storage

### Key Components

#### Database Schema
- **Technicians**: Store massage therapist information (name, birth year, avatar, photos, specialties, experience, rating)
- **Services**: Massage service types with pricing for 60 and 90-minute sessions
- **Additional Services**: Add-on services like hot stones, cupping, acupressure
- **Bookings**: Customer reservations with payment status and booking codes
- **Blocked Time Slots**: Admin-managed unavailable time periods
- **Admin Users**: Authentication for admin panel access

#### Core Features
1. **Booking System**:
   - Two booking methods: by available time or by technician
   - Service selection with duration options (60/90 minutes)
   - Additional services selection
   - Customer information collection
   - 20% deposit requirement calculation

2. **Payment Integration**:
   - Bank transfer verification system
   - QR code generation for booking lookup
   - Booking code system for easy access

3. **Admin Panel**:
   - Technician management (CRUD operations)
   - Service and pricing management
   - Booking oversight and status updates
   - Time slot blocking functionality

4. **Real-time Features**:
   - WebSocket connections for live booking updates
   - Prevents double-booking through real-time synchronization

## Data Flow

1. **Customer Booking Flow**:
   - Customer selects booking method (time-first or technician-first)
   - Chooses service type and duration
   - Selects available time slot
   - Enters customer information
   - Reviews booking summary with deposit calculation
   - Completes payment verification
   - Receives booking confirmation with QR code

2. **Admin Management Flow**:
   - Admin logs in through authentication system
   - Manages technician profiles and availability
   - Updates service offerings and pricing
   - Monitors and manages customer bookings
   - Blocks specific time slots as needed

3. **Real-time Updates**:
   - WebSocket broadcasts booking changes
   - Clients receive live availability updates
   - Prevents booking conflicts through immediate synchronization

## External Dependencies

### UI and Styling
- Radix UI primitives for accessible components
- Tailwind CSS for utility-first styling
- Lucide React for icons
- Class Variance Authority for component variants

### Data Management
- Drizzle ORM for type-safe database operations
- Drizzle Zod for schema validation
- React Query for server state management
- React Hook Form for form handling

### Development Tools
- Vite for fast development and building
- TypeScript for type safety
- ESBuild for server bundling
- Replit-specific plugins for development environment

## Deployment Strategy

The application is designed for deployment on free hosting platforms:

1. **Database**: Uses Neon Database (serverless PostgreSQL) for free tier compatibility
2. **Frontend**: Static build output suitable for platforms like Vercel, Netlify, or Replit
3. **Backend**: Express server bundled with ESBuild for Node.js hosting
4. **Environment**: Configured for both development and production modes
5. **WebSocket**: Uses standard WebSocket API for real-time features

The build process creates a production-ready bundle with the frontend in `dist/public` and the backend server in `dist/index.js`, making it easy to deploy on various hosting platforms while maintaining the full-stack functionality.