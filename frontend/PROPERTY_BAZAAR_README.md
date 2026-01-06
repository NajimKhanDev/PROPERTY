# Property Bazaar - Property Management System

A complete property management application built with Next.js, featuring property registration, sales management, and comprehensive reporting.

## Features

### 🔐 Authentication
- Simple login system (Username: `admin`, Password: `admin`)
- Session management with localStorage
- Protected routes

### 🏠 Property Management
- **Register Properties**: Add new properties with detailed information
  - Property details (address, type, price, bedrooms, bathrooms, area)
  - Owner information (name, phone, email)
  - Property description
- **Property Status**: Track available vs sold properties

### 💰 Sales Management
- **Sell Properties**: Process property sales with buyer information
- **Buyer Details**: Capture complete buyer information
- **Sale Records**: Track sale price, date, and transaction details
- **Profit/Loss Tracking**: Compare original price vs sale price

### 📊 Comprehensive Reports
- **Summary Dashboard**: 
  - Total properties, sales count, revenue, and profit
  - Property type distribution
  - Sales statistics (average, highest, lowest prices)
- **Property Reports**: Detailed view of all registered properties
- **Sales History**: Complete transaction history with profit/loss analysis

### 🎨 User Interface
- Clean, responsive design with Tailwind CSS
- Intuitive navigation between sections
- Data tables with sorting and filtering
- Real-time statistics and charts

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd property-bazaar-f
```

2. Install dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Login Credentials
- **Username**: `admin`
- **Password**: `admin`

## Application Structure

```
app/
├── page.tsx                 # Home page (redirects to login/dashboard)
├── layout.tsx              # Root layout
├── globals.css             # Global styles
├── login/
│   └── page.tsx            # Login page
├── dashboard/
│   └── page.tsx            # Main dashboard
├── register-property/
│   └── page.tsx            # Property registration form
├── sell-property/
│   └── page.tsx            # Property sales form
└── reports/
    └── page.tsx            # Reports and analytics
```

## Data Storage

The application uses localStorage for data persistence:
- `isLoggedIn`: Authentication status
- `properties`: Array of registered properties
- `sales`: Array of completed sales transactions

## Usage Guide

### 1. Login
- Navigate to the application
- Enter credentials (admin/admin)
- Redirected to dashboard

### 2. Register a Property
- Click "Register Property" in navigation
- Fill in property details:
  - Address, type, price
  - Bedrooms, bathrooms, area
  - Owner contact information
  - Property description
- Submit to add to inventory

### 3. Sell a Property
- Click "Sell Property" in navigation
- Select an available property from dropdown
- Enter buyer information:
  - Name, phone, email, address
  - Sale price and date
- Submit to complete transaction

### 4. View Reports
- Click "Reports" in navigation
- Three report sections:
  - **Summary**: Key metrics and statistics
  - **All Properties**: Complete property inventory
  - **Sales History**: Transaction history with profit/loss

## Key Features Explained

### Property Registration
- Comprehensive property information capture
- Owner contact details for communication
- Automatic status tracking (available/sold)
- Timestamp for registration date

### Sales Processing
- Select from available properties only
- Complete buyer information capture
- Flexible pricing (can differ from listing price)
- Automatic status update to "sold"
- Profit/loss calculation

### Reporting & Analytics
- Real-time dashboard statistics
- Property type distribution analysis
- Sales performance metrics
- Detailed transaction history
- Profit/loss tracking per sale

## Technical Details

### Built With
- **Next.js 16.1.1** - React framework
- **React 19.2.3** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **localStorage** - Data persistence

### Key Components
- Client-side routing with Next.js App Router
- Form handling with React hooks
- Local state management
- Responsive design patterns
- Data validation and error handling

## Future Enhancements

Potential improvements for production use:
- Database integration (PostgreSQL, MongoDB)
- User authentication system
- File upload for property images
- Advanced search and filtering
- Email notifications
- PDF report generation
- Multi-user support with roles
- Property image gallery
- Map integration
- Advanced analytics and charts

## Development

### Project Structure
- Uses Next.js App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Component-based architecture
- Client-side data persistence

### Adding New Features
1. Create new page in `app/` directory
2. Add navigation links in existing components
3. Update data models in localStorage
4. Add corresponding report sections

## Support

For issues or questions:
1. Check the console for error messages
2. Verify localStorage data structure
3. Ensure all required fields are filled
4. Clear localStorage to reset application state

---

**Property Bazaar** - Complete Property Management Solution