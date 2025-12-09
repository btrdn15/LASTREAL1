# Warehouse Management System Design Guidelines

## Design Approach

**Selected Approach:** Design System - Material Design inspired admin dashboard
**Justification:** This is a utility-focused, information-dense application requiring efficiency, clarity, and consistent data presentation. Drawing inspiration from Linear's clean data tables, Notion's organized layouts, and modern admin dashboards.

**Core Principles:**
- Information clarity over decoration
- Consistent data presentation
- Immediate visual feedback
- Efficient workflows

## Typography

**Font Family:** Inter or Roboto via Google Fonts CDN
- Headings: 600 weight, 24px-32px
- Subheadings: 500 weight, 18px-20px  
- Body text: 400 weight, 14px-16px
- Table data: 400 weight, 14px
- Labels: 500 weight, 12px uppercase letter-spacing

**Mongolian Text:** Ensure selected font has excellent Cyrillic support

## Layout System

**Spacing Units:** Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-4 to p-6
- Section spacing: gap-6 to gap-8
- Card margins: m-4
- Input fields: p-3

**Page Structure:**
- Fixed top navigation bar (h-16) with logo and page links
- Main content area with max-w-7xl container
- Responsive grid layouts for data presentation

## Component Library

### Navigation
- Horizontal top bar with three navigation items: Борлуулалт, Агуулах, Түүх
- Active state indicator (underline or bold weight)
- User info and logout button on right side
- Sticky positioning for persistent access

### Login Page
- Centered card (max-w-md) on viewport
- Logo/title at top
- Two input fields (username, password) stacked vertically with gap-4
- Full-width primary button
- Clear error message display area below button

### Data Tables
- Full-width tables with alternating row treatment for readability
- Fixed header row with medium weight text
- Column headers: Product Name (flex-1), Quantity (w-24), Price (w-32), Actions (w-24)
- Cell padding: px-4 py-3
- Border separation between rows

### Борлуулалт (Sales) Page Layout
**Two-Column Split:**
- Left side (w-2/3): Product selection area
  - Search bar at top (w-full with icon)
  - Scrollable product list with auto-index numbers
  - Each row: Index | Product Name | Quantity Input (w-20) | Price Input (w-28)
- Right side (w-1/3): Selected products panel
  - Fixed sidebar showing cart summary
  - Product list with quantities and prices
  - Bold total sum at bottom
  - Дуусгах button (full-width, prominent)

### Агуулах (Warehouse) Page
- Add product form at top in card container
- Input fields inline: Product Name (flex-1) | Quantity (w-32) | Add Button
- Product inventory table below showing all products with current quantities
- Clear visual separation between form and table (mb-8)

### Түүх (Transaction History) Page
- CSV download button positioned top-right
- Transaction cards or table rows showing:
  - Date/Time (prominent)
  - Product details in nested list
  - Total amount (bold, larger text)
- Chronological ordering (newest first)

### Form Inputs
- Consistent height: h-10 to h-12
- Rounded corners: rounded-md
- Clear focus states with ring treatment
- Placeholder text in lighter treatment
- Labels above inputs with mb-2

### Buttons
**Primary (Дуусгах, Add Product):**
- Padding: px-6 py-3
- Rounded: rounded-md
- Font: 500 weight, 14px
- Full-width on mobile, auto width on desktop

**Secondary (CSV Download):**
- Icon + text combination
- Padding: px-4 py-2
- Outlined style with border

### Cards/Containers
- Rounded: rounded-lg
- Shadow: shadow-sm for subtle elevation
- Padding: p-6
- Used for login form, add product section, transaction cards

### Search Bar
- Icon on left side (from Heroicons via CDN)
- Placeholder text in Mongolian
- Full-width with max-w-md on larger screens
- Height: h-10

### Icons
**Library:** Heroicons (outline style) via CDN
- Search icon in search bar
- Plus icon for add actions
- Download icon for CSV button
- Logout icon in navigation
- Arrow/chevron for sorting indicators

## Interactions & States

**Real-time Updates:**
- Right sidebar on Sales page updates instantly as user enters quantities/prices
- Running total recalculates on each input change
- Visual confirmation when product added to cart

**Table Interactions:**
- Hover state on table rows for better scanning
- Input fields with clear focus rings
- Disabled state for Дуусгах button when cart is empty

**Feedback:**
- Success message after completing sale
- Confirmation when product added to warehouse
- Download progress indicator for CSV export

## Responsive Behavior

**Desktop (1024px+):** Two-column layout on Sales page, full tables
**Tablet (768px-1023px):** Stack columns on Sales page, maintain table structure
**Mobile (<768px):** Single column everywhere, horizontal scroll for wide tables, simplified navigation to hamburger menu

## Accessibility

- High contrast text
- Clear focus indicators on all interactive elements
- ARIA labels for icon-only buttons
- Logical tab order through forms
- Sufficient touch target sizes (min 44px)

**No animations** - Focus on instant, responsive interactions for productivity.