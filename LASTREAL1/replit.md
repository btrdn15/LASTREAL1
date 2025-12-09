# Warehouse Management System

## Overview

This is a Mongolian-language warehouse management system built as a full-stack web application. The system enables inventory tracking, sales transactions, and historical reporting for warehouse operations. It features a Material Design-inspired admin dashboard with clean data tables and efficient workflows optimized for information-dense operations.

The application serves three main functional areas:
1. **Sales (Борлуулалт)** - Point of sale interface for processing transactions with shopping cart functionality
2. **Warehouse (Агуулах)** - Inventory management for adding and tracking products
3. **History (Түүх)** - Transaction history viewing and CSV export capabilities

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool and development server.

**Routing**: Client-side routing implemented with Wouter, a lightweight alternative to React Router. The application uses a single-page architecture with three main routes corresponding to the core business functions.

**UI Component System**: Shadcn/ui component library (New York style variant) built on Radix UI primitives. This provides:
- Accessible, composable UI components
- Tailwind CSS for styling with CSS variables for theming
- Material Design-inspired visual language emphasizing clarity and efficiency
- Typography using Inter/Roboto fonts with excellent Cyrillic support for Mongolian text

**State Management**: 
- TanStack Query (React Query) for server state management, caching, and data synchronization
- Local React state for UI-specific concerns (cart, form inputs, search filters)
- Context API for authentication state

**Design System**: Custom design tokens defined in Tailwind config and CSS variables, including:
- Spacing system based on Tailwind's default scale
- Neutral color palette with primary accent color (HSL-based for theming)
- Elevation system using subtle shadows and borders
- Responsive breakpoints for mobile adaptation

### Backend Architecture

**Server Framework**: Express.js running on Node.js with TypeScript.

**API Design**: RESTful API with the following endpoints:
- `/api/auth/*` - Authentication (login, session check, logout)
- `/api/products` - Product CRUD operations
- `/api/transactions` - Transaction creation and history retrieval
- `/api/transactions/csv` - CSV export of transaction data

**Session Management**: Express-session middleware with:
- In-memory session storage (suitable for development/single-instance deployment)
- HTTP-only cookies for session tokens
- 24-hour session expiration
- CSRF protection through same-origin policy

**Authentication**: Simple username/password authentication without external providers. Passwords are stored in plaintext (development-grade security) with hardcoded valid users. The system uses session-based authentication with a `requireAuth` middleware protecting API routes.

**Data Layer**: In-memory storage implementation (`MemStorage` class) that maintains:
- User accounts in a Map structure
- Product inventory with quantity tracking
- Transaction history with line items

This storage approach is designed for prototyping and can be replaced with a database implementation implementing the `IStorage` interface.

### Data Storage

**Current Implementation**: In-memory storage using JavaScript Maps, suitable for development and demonstration purposes. Data is lost on server restart.

**Schema Design**: The application defines TypeScript types and Zod schemas for data validation:
- **User**: `{ id, username, password }` - Basic user accounts
- **Product**: `{ id, name, quantity }` - Inventory items
- **Transaction**: Contains transaction metadata and an array of transaction items
- **TransactionItem**: `{ productId, productName, quantity, price }` - Individual line items

**Prepared for Database Migration**: 
- Drizzle ORM configured with PostgreSQL dialect
- Database configuration in `drizzle.config.ts` expecting a `DATABASE_URL` environment variable
- Storage abstraction through `IStorage` interface enables swapping storage implementations
- Migration tooling configured in package.json (`db:push` script)

The codebase anticipates PostgreSQL as the production database, with Drizzle providing type-safe query building and schema management.

### External Dependencies

**UI Component Libraries**:
- Radix UI - Headless component primitives for accessible UI elements
- Shadcn/ui - Pre-styled component collection built on Radix
- Lucide React - Icon library
- Embla Carousel - Carousel/slider functionality
- CMDK - Command palette component

**Data Management**:
- TanStack Query - Async state management and caching
- React Hook Form - Form state and validation
- Zod - Runtime type validation and schema definition
- Date-fns - Date manipulation and formatting

**Backend Services**:
- Drizzle ORM - Database toolkit and query builder
- @neondatabase/serverless - PostgreSQL client optimized for serverless environments
- Connect-pg-simple - PostgreSQL session store (currently unused, prepared for production)

**Build & Development Tools**:
- Vite - Frontend build tool and dev server
- ESBuild - Server-side bundling for production
- TypeScript - Type safety across the stack
- Tailwind CSS - Utility-first CSS framework
- PostCSS with Autoprefixer - CSS processing

**Deployment Configuration**:
- Build process bundles both client and server code
- Client built to `dist/public` directory
- Server bundled as single CJS file to reduce cold start times
- Static file serving in production mode
- Replit-specific plugins for development (cartographer, dev banner, runtime error overlay)

**Notable Architectural Decisions**:
- Session secret can be configured via environment variable or uses default value
- Allowlist approach for server dependencies to optimize bundle size
- HMR (Hot Module Replacement) configured for efficient development workflow
- Path aliases (`@/`, `@shared/`, `@assets/`) for clean imports
- Shared schema definitions between client and server prevent type drift