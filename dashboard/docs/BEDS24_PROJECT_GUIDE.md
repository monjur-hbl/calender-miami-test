# Beds24 Hotel Management System - Complete Development Guide

> **Purpose**: Complete knowledge base for building hotel management dashboards connected to Beds24 PMS
> **Based On**: Miami Beach Resort project (v28.4) - January 2026
> **Author**: Claude Code Assistant

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Beds24 API V2 Deep Dive](#beds24-api-v2-deep-dive)
3. [Authentication Strategy](#authentication-strategy)
4. [Project Setup](#project-setup)
5. [Core Components](#core-components)
6. [API Proxy Design](#api-proxy-design)
7. [Dashboard Features](#dashboard-features)
8. [Critical Rules & Gotchas](#critical-rules--gotchas)
9. [Deployment Guide](#deployment-guide)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Dashboard (React SPA)                                   │   │
│  │  - Single HTML file with inline Babel                    │   │
│  │  - Tailwind CSS for styling                              │   │
│  │  - GitHub Pages hosting                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND APIs                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │   Main API       │  │   HK API         │  │  Beds24      │  │
│  │   (Node/Express) │  │   (Node/Express) │  │  Proxy       │  │
│  │                  │  │                  │  │              │  │
│  │  - Booking CRUD  │  │  - Housekeeping  │  │  - Token     │  │
│  │  - Calendar      │  │  - Tasks         │  │    refresh   │  │
│  │  - Revenue       │  │  - Notifications │  │  - Rate      │  │
│  │  - Search        │  │  - Auth          │  │    limiting  │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│           │                    │                    │           │
│           └────────────────────┼────────────────────┘           │
│                                │                                 │
│                    Cloud Run (GCP)                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                            │
│  ┌──────────────────┐  ┌──────────────────────────────────────┐ │
│  │   Firestore      │  │          Beds24 API V2               │ │
│  │   (Database)     │  │   https://api.beds24.com/v2/         │ │
│  │                  │  │                                      │ │
│  │  - room_config   │  │   - /bookings                        │ │
│  │  - users         │  │   - /properties                      │ │
│  │  - hk_tasks      │  │   - /rooms                           │ │
│  │  - notifications │  │   - /inventory                       │ │
│  └──────────────────┘  └──────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack Recommendations

| Layer | Technology | Why |
|-------|------------|-----|
| Frontend | React (single-file) | Simple deployment, no build step needed |
| Styling | Tailwind CSS (CDN) | Rapid UI development |
| Backend | Node.js + Express | Easy Beds24 integration, async handling |
| Database | Firestore | Real-time, serverless, cheap |
| Hosting (FE) | GitHub Pages | Free, automatic deployment |
| Hosting (BE) | Google Cloud Run | Serverless, auto-scaling, pay-per-use |
| Auth | Firebase Auth | Simple, secure, integrates with Firestore |

---

## Beds24 API V2 Deep Dive

### API Base URL
```
https://api.beds24.com/v2/
```

### API Documentation
```
https://beds24.com/api/v2/apiV2.yaml
```

### Key Endpoints

#### Bookings
```javascript
// GET all bookings
GET /bookings?propertyId=XXXXX&arrivalFrom=YYYY-MM-DD&arrivalTo=YYYY-MM-DD

// GET single booking
GET /bookings/{bookingId}

// CREATE/UPDATE booking
POST /bookings
Body: [{ ...bookingData }]  // Always an array!

// Response includes booking ID on success
```

#### Rooms & Units
```javascript
// GET all rooms for property
GET /rooms?propertyId=XXXXX

// Response structure:
{
  "data": [{
    "id": 123,
    "name": "Deluxe Room",
    "units": [{
      "id": 456,
      "name": "101"  // Room number
    }]
  }]
}
```

### Booking Object Structure

```javascript
const booking = {
    // Required for new booking
    propertyId: 279646,
    roomId: 123,           // Room type ID
    unitId: 456,           // Specific unit/room number
    arrival: "2026-01-15", // YYYY-MM-DD format
    departure: "2026-01-17",

    // Guest info
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "+1234567890",

    // Pricing
    price: 5000,           // Total price (used by autoInvoiceItemCharge)
    deposit: 2000,         // Amount paid/received

    // Guest count
    numAdult: 2,
    numChild: 1,

    // Status
    status: "confirmed",   // confirmed, cancelled, inquiry, etc.

    // Optional
    notes: "Guest notes",
    notesInternal: "Staff notes (not visible to guest)",
    rateDescription: "Rate breakdown text",

    // Invoice items (for payments)
    invoiceItems: [{
        type: "payment",
        description: "Cash Received",
        qty: 1,
        amount: 2000
    }],

    // Actions
    actions: {
        autoInvoiceItemCharge: true  // Auto-create charge from price
    }
};
```

### Invoice Items - CRITICAL KNOWLEDGE

#### The Problem
Manual invoice item creation is unreliable. Beds24's recommended approach is different.

#### The Solution - autoInvoiceItemCharge

```javascript
// CORRECT: Let Beds24 create the charge automatically
const bookingData = {
    propertyId: 279646,
    roomId: 123,
    unitId: 456,
    arrival: "2026-01-10",
    departure: "2026-01-12",
    price: 3000,              // Total price - Beds24 creates charge from this
    deposit: 500,             // Payment received
    actions: {
        autoInvoiceItemCharge: true  // KEY: Auto-creates charge from price field
    },
    invoiceItems: [{          // Only add payments manually
        type: "payment",
        description: "Cash Received",
        qty: 1,
        amount: 500
    }]
};
```

#### Alternative: Explicit Invoice Items (if needed)

```javascript
// Use Beds24 template variables for charge description
const bookingData = {
    // ... other fields
    invoiceItems: [
        {
            type: "charge",
            description: "[ROOMNAME1] [FIRSTNIGHT] - [LEAVINGDAY]",
            qty: 1,
            amount: 3000  // NOT 'price', use 'amount'!
        },
        {
            type: "payment",
            description: "Cash Payment",
            qty: 1,
            amount: 500
        }
    ]
};
```

#### Template Variables Available
- `[ROOMNAME1]` - First room name
- `[FIRSTNIGHT]` - Check-in date
- `[LEAVINGDAY]` - Check-out date
- `[NUMNIGHT]` - Number of nights
- `[GUESTNAME]` - Guest full name

### Adding Payments to Existing Bookings

```javascript
// To add a payment to an existing booking
const updateData = {
    id: existingBookingId,  // Required - the booking ID
    deposit: currentDeposit + newPaymentAmount,  // Update total deposit
    invoiceItems: [{
        type: "payment",
        description: "Bkash Payment TXN123456",
        qty: 1,
        amount: newPaymentAmount
    }]
};

// POST to /bookings (same endpoint as create)
await fetch(API + "/bookings", {
    method: "POST",
    body: JSON.stringify([updateData])  // Always array!
});
```

---

## Authentication Strategy

### Dual-Token System

Beds24 API V2 uses two types of tokens:

```javascript
// 1. READ TOKEN (Permanent)
// - Used for: GET requests
// - Never expires
// - Safe to store in environment variables
const READ_TOKEN = process.env.BEDS24_READ_TOKEN;

// 2. WRITE TOKEN (Auto-refresh)
// - Used for: POST, PUT, DELETE requests
// - Expires every ~24 hours
// - Must be refreshed using refresh token
const WRITE_REFRESH_TOKEN = process.env.BEDS24_WRITE_REFRESH_TOKEN;
```

### Token Selection Logic

```javascript
async function fetchBeds24(endpoint, params = {}, method = 'GET', body = null) {
    // Select correct token based on HTTP method
    const token = (method === 'POST' || method === 'PUT' || method === 'DELETE')
        ? await getWriteToken()    // Refresh if needed
        : await getReadToken();    // Permanent token

    // Make request with selected token
    const response = await fetch(`https://api.beds24.com/v2/${endpoint}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'token': token
        },
        body: body ? JSON.stringify(body) : undefined
    });

    return response.json();
}
```

### Token Refresh Implementation

```javascript
let writeTokenCache = { token: null, expiresAt: 0 };

async function getWriteToken() {
    const now = Date.now();
    const BUFFER = 5 * 60 * 1000; // 5 minute buffer before expiry

    // Return cached token if still valid
    if (writeTokenCache.token && writeTokenCache.expiresAt > now + BUFFER) {
        return writeTokenCache.token;
    }

    // Refresh token
    const response = await fetch('https://api.beds24.com/v2/authentication/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            refreshToken: process.env.BEDS24_WRITE_REFRESH_TOKEN
        })
    });

    const data = await response.json();

    writeTokenCache = {
        token: data.token,
        expiresAt: now + (data.expiresIn * 1000)
    };

    return writeTokenCache.token;
}
```

### Getting Tokens from Beds24

1. Log into Beds24 Control Panel
2. Go to: Settings > Account > API
3. Create API tokens:
   - **Read Token**: For GET operations (permanent)
   - **Write Refresh Token**: For POST/PUT/DELETE (needs refresh)

---

## Project Setup

### Directory Structure

```
hotel-project/
├── dashboard/                 # Frontend
│   ├── index.html            # Main React app (single file)
│   ├── CLAUDE.md             # AI assistant instructions
│   └── .github/
│       └── workflows/
│           └── pages.yml     # GitHub Pages deployment
├── api/                      # Main backend API
│   ├── index.js              # Express server
│   ├── Dockerfile
│   ├── package.json
│   └── .github/
│       └── workflows/
│           └── deploy.yml    # Cloud Run deployment
├── proxy/                    # Beds24 proxy (optional)
│   ├── index.js
│   ├── Dockerfile
│   └── package.json
├── docs/                     # Documentation
│   └── BEDS24_PROJECT_GUIDE.md
├── CLAUDE.md                 # Project-level AI instructions
├── SYNC_STATUS.md            # Deployment tracking
└── CHANGELOG.md              # Version history
```

### Frontend Setup (Single-File React)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hotel Dashboard</title>
    <!-- React -->
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        /* Custom CSS here */
    </style>
</head>
<body>
<div id="root"></div>
<script type="text/babel">
const {useState, useEffect, useMemo, useCallback} = React;

// API Configuration
const API_BASE = "https://your-api.run.app";

// Main App Component
function App() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch data on mount
    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/bookings`);
            const data = await res.json();
            setBookings(data);
        } catch (e) {
            console.error('Failed to fetch:', e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Your UI here */}
        </div>
    );
}

ReactDOM.render(<App/>, document.getElementById('root'));
</script>
</body>
</html>
```

### Backend Setup (Express)

```javascript
// index.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Environment variables
const BEDS24_API = 'https://api.beds24.com/v2';
const PROPERTY_ID = process.env.PROPERTY_ID;
const READ_TOKEN = process.env.BEDS24_READ_TOKEN;
const WRITE_REFRESH_TOKEN = process.env.BEDS24_WRITE_REFRESH_TOKEN;

// Token cache
let writeTokenCache = { token: null, expiresAt: 0 };

// Helper: Get write token with auto-refresh
async function getWriteToken() {
    const now = Date.now();
    if (writeTokenCache.token && writeTokenCache.expiresAt > now + 300000) {
        return writeTokenCache.token;
    }

    const res = await fetch(`${BEDS24_API}/authentication/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: WRITE_REFRESH_TOKEN })
    });

    const data = await res.json();
    writeTokenCache = { token: data.token, expiresAt: now + data.expiresIn * 1000 };
    return writeTokenCache.token;
}

// Helper: Fetch from Beds24
async function fetchBeds24(endpoint, method = 'GET', body = null) {
    const token = (method === 'GET') ? READ_TOKEN : await getWriteToken();

    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'token': token
        }
    };

    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${BEDS24_API}/${endpoint}`, options);
    return res.json();
}

// Routes
app.get('/', (req, res) => {
    res.json({ status: 'API Running', propertyId: PROPERTY_ID });
});

app.get('/api/bookings', async (req, res) => {
    try {
        const data = await fetchBeds24(`bookings?propertyId=${PROPERTY_ID}`);
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/bookings', async (req, res) => {
    try {
        const data = await fetchBeds24('bookings', 'POST', req.body);
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

### Dockerfile

```dockerfile
FROM node:18-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
CMD ["node", "index.js"]
```

---

## Core Components

### 1. Room Inventory Management

```javascript
// CRITICAL: Room count should be DYNAMIC, not hardcoded!

// Fetch room config from your database
const [totalRooms, setTotalRooms] = useState(45); // Default fallback

useEffect(() => {
    fetch(`${API}/room-config`)
        .then(r => r.json())
        .then(data => setTotalRooms(data.totalRooms || 45));
}, []);

// Correct occupancy calculation
const calculateOccupancy = (stayingGuests) => {
    // Count UNIQUE room/unit combinations (not booking count!)
    const occupiedSet = new Set(
        stayingGuests.map(b => `${b.roomId}-${b.unitId}`)
    );

    const occupiedUnits = occupiedSet.size;
    const availableUnits = totalRooms - occupiedUnits;
    const occupancyRate = Math.round((occupiedUnits / totalRooms) * 100);

    return { occupiedUnits, availableUnits, occupancyRate };
};
```

### 2. Calendar View

```javascript
// Generate date range for calendar
const generateDates = (startDate, days) => {
    const dates = [];
    const start = new Date(startDate);

    for (let i = 0; i < days; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        dates.push(d.toISOString().slice(0, 10));
    }

    return dates;
};

// Check if booking spans a date
const isBookingOnDate = (booking, date) => {
    return booking.arrival <= date && booking.departure > date;
};

// Get booking for specific room/date cell
const getBookingForCell = (roomId, unitId, date, bookings) => {
    return bookings.find(b =>
        b.roomId === roomId &&
        b.unitId === unitId &&
        isBookingOnDate(b, date)
    );
};
```

### 3. Booking Creation Form

```javascript
const BookingForm = ({ selectedRoom, checkIn, checkOut, onSubmit }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        numAdult: 2,
        numChild: 0,
        price: '',
        deposit: '',
        priceType: 'total', // 'total' or 'perNight'
        paymentMethod: 'Cash'
    });

    const nights = Math.ceil(
        (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
    );

    // Calculate total price
    const totalPrice = formData.priceType === 'perNight'
        ? parseFloat(formData.price || 0) * nights
        : parseFloat(formData.price || 0);

    const handleSubmit = async () => {
        const bookingData = {
            propertyId: PROPERTY_ID,
            roomId: selectedRoom.roomId,
            unitId: selectedRoom.unitId,
            arrival: checkIn,
            departure: checkOut,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            numAdult: formData.numAdult,
            numChild: formData.numChild,
            price: totalPrice,
            deposit: parseFloat(formData.deposit) || 0,
            actions: {
                autoInvoiceItemCharge: true
            },
            invoiceItems: formData.deposit ? [{
                type: "payment",
                description: `${formData.paymentMethod} Received`,
                qty: 1,
                amount: parseFloat(formData.deposit)
            }] : []
        };

        await onSubmit(bookingData);
    };

    return (/* JSX form */);
};
```

### 4. Timezone Handling

```javascript
// CRITICAL: Use correct timezone for the hotel location!

const TIMEZONE = 'Asia/Dhaka'; // Bangladesh GMT+6

// Get today's date in hotel timezone
const getTodayInTimezone = () => {
    return new Date().toLocaleDateString('en-CA', {
        timeZone: TIMEZONE
    }); // Returns YYYY-MM-DD
};

// Format date for display
const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
        timeZone: TIMEZONE,
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};
```

---

## API Proxy Design

### Why Use a Proxy?

1. **Hide API tokens** from frontend
2. **Rate limiting** protection
3. **Caching** frequently accessed data
4. **Error handling** centralization
5. **Token refresh** automation

### Proxy Implementation

```javascript
// beds24-proxy/index.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const BEDS24_API = 'https://api.beds24.com/v2';
const PROPERTY_ID = process.env.PROPERTY_ID;

// Token management (same as above)
// ...

// Rate limiting
const rateLimit = {
    remaining: 1000,
    resetTime: Date.now() + 3600000
};

// Generic endpoint handler
app.all('/', async (req, res) => {
    const endpoint = req.query.endpoint;
    if (!endpoint) {
        return res.status(400).json({ error: 'Missing endpoint parameter' });
    }

    try {
        const method = req.method;
        const token = (method === 'GET')
            ? process.env.READ_TOKEN
            : await getWriteToken();

        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'token': token
            }
        };

        if (req.body && Object.keys(req.body).length > 0) {
            options.body = JSON.stringify(req.body);
        }

        const response = await fetch(`${BEDS24_API}/${endpoint}`, options);
        const data = await response.json();

        // Update rate limit from headers
        if (response.headers.get('x-ratelimit-remaining')) {
            rateLimit.remaining = parseInt(response.headers.get('x-ratelimit-remaining'));
        }

        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Convenience endpoints
app.get('/getBookings', async (req, res) => {
    // Implementation
});

app.get('/getRooms', async (req, res) => {
    // Implementation
});

app.listen(process.env.PORT || 8080);
```

---

## Dashboard Features

### Essential Features Checklist

- [ ] **Today View**: Check-ins, check-outs, staying guests
- [ ] **Calendar View**: Multi-day room availability grid
- [ ] **Search**: Find bookings by guest name, phone, booking ID
- [ ] **New Booking**: Create bookings with guest info, pricing
- [ ] **Booking Details**: View/edit existing bookings
- [ ] **Payments**: Record payments, view payment history
- [ ] **Occupancy Stats**: Real-time occupancy rate display
- [ ] **Housekeeping**: Room cleaning status (optional)
- [ ] **Revenue Reports**: Daily/monthly revenue tracking

### Feature: Overbooking Detection

```javascript
// Detect multiple bookings for same room/date
const getAllBookingsForCell = (roomId, unitId, date, bookings) => {
    return bookings.filter(b =>
        b.roomId === roomId &&
        b.unitId === unitId &&
        b.arrival <= date &&
        b.departure > date &&
        b.status !== 'cancelled'
    );
};

// In calendar cell render:
const cellBookings = getAllBookingsForCell(roomId, unitId, date, bookings);
const isOverbooked = cellBookings.length > 1;

if (isOverbooked) {
    // Show warning indicator
    return <div className="overbooking-alert">
        OVERBOOK ({cellBookings.length})
    </div>;
}
```

### Feature: Double-Click Prevention

```javascript
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async () => {
    // Prevent double submission
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
        await createBooking(formData);
        // Success handling
    } catch (e) {
        // Error handling
    } finally {
        setIsSubmitting(false);
    }
};

// Button with disabled state
<button
    onClick={handleSubmit}
    disabled={isSubmitting}
    style={{
        opacity: isSubmitting ? 0.5 : 1,
        pointerEvents: isSubmitting ? 'none' : 'auto'
    }}
>
    {isSubmitting ? 'Creating...' : 'Create Booking'}
</button>
```

---

## Critical Rules & Gotchas

### DO's

1. **Always use arrays for POST /bookings**
   ```javascript
   // CORRECT
   body: JSON.stringify([bookingData])

   // WRONG
   body: JSON.stringify(bookingData)
   ```

2. **Use `amount` not `price` for invoice items**
   ```javascript
   // CORRECT
   { type: "payment", amount: 500 }

   // WRONG
   { type: "payment", price: 500 }
   ```

3. **Use correct token for operation type**
   - GET requests = READ token
   - POST/PUT/DELETE = WRITE token

4. **Count unique room/unit combos for occupancy**
   ```javascript
   // CORRECT
   new Set(bookings.map(b => `${b.roomId}-${b.unitId}`)).size

   // WRONG
   bookings.length
   ```

5. **Use hotel timezone for all date operations**

6. **Store room count dynamically, not hardcoded**

### DON'Ts

1. **Never use `useState` inside conditionals/callbacks**
   ```javascript
   // WRONG - Will freeze the app!
   if (condition) {
       const [state, setState] = useState(false);
   }

   // CORRECT
   const [state, setState] = useState(false);
   ```

2. **Never expose API tokens in frontend code**

3. **Never trust `allRooms.length` for total room count**

4. **Never use `autoInvoiceItemCharge` WITH explicit charge items**
   - Use one OR the other, not both

5. **Never display "Beds24" in the UI**
   - Use your hotel brand name instead

6. **Never hardcode property IDs in multiple places**
   - Use environment variables or config

### Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Unexpected token <" | Wrong token type used | Use WRITE token for POST |
| Invoice items not showing | Using `price` instead of `amount` | Use `amount` field |
| Duplicate charge created | Using autoInvoiceItemCharge + explicit charge | Choose one method |
| App freezes | useState in conditional | Move useState to top level |
| Wrong occupancy | Counting bookings not rooms | Count unique room/unit combos |
| Wrong dates | Server timezone vs local | Use explicit timezone |

---

## Deployment Guide

### GitHub Pages (Frontend)

1. Create `.github/workflows/pages.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      - uses: actions/deploy-pages@v4
```

2. Enable GitHub Pages in repo settings
3. Push to main branch - auto deploys!

### Google Cloud Run (Backend)

1. Create Dockerfile (see above)

2. Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  PROJECT_ID: your-gcp-project
  SERVICE: your-api
  REGION: us-central1

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: google-github-actions/auth@v2
        with:
          credentials_json: '${{ secrets.GCP_SA_KEY }}'

      - uses: google-github-actions/setup-gcloud@v2

      - run: gcloud auth configure-docker

      - run: |
          docker build -t gcr.io/$PROJECT_ID/$SERVICE:$GITHUB_SHA .
          docker push gcr.io/$PROJECT_ID/$SERVICE:$GITHUB_SHA

      - run: |
          gcloud run deploy $SERVICE \
            --image gcr.io/$PROJECT_ID/$SERVICE:$GITHUB_SHA \
            --region $REGION \
            --platform managed \
            --allow-unauthenticated \
            --set-env-vars "PROPERTY_ID=${{ secrets.PROPERTY_ID }},BEDS24_READ_TOKEN=${{ secrets.BEDS24_READ_TOKEN }}"
```

### Manual Cloud Run Deployment

```bash
# Build and push
gcloud builds submit --tag gcr.io/PROJECT_ID/SERVICE_NAME

# Deploy
gcloud run deploy SERVICE_NAME \
  --image gcr.io/PROJECT_ID/SERVICE_NAME \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "KEY=VALUE"
```

---

## Troubleshooting

### API Issues

**Problem**: "Unexpected token < in JSON"
```
Cause: API returning HTML error page instead of JSON
Fix: Check token is valid, check endpoint URL
```

**Problem**: Bookings not creating
```
Cause: Using READ token for POST request
Fix: Implement dual-token system, use WRITE token for POST
```

**Problem**: Invoice items missing
```
Cause: Using wrong field name
Fix: Use 'amount' not 'price' for invoice items
```

### Frontend Issues

**Problem**: App freezes on render
```
Cause: useState inside conditional or callback
Fix: Move all useState calls to component top level
```

**Problem**: Dates showing wrong day
```
Cause: Timezone mismatch
Fix: Use explicit timezone in all date formatting
```

### Debugging Tips

1. **Check browser console** for JavaScript errors
2. **Check Network tab** for failed API calls
3. **Check Cloud Run logs** for backend errors:
   ```bash
   gcloud logging read "resource.type=cloud_run_revision"
   ```
4. **Test API directly** with curl:
   ```bash
   curl -H "token: YOUR_TOKEN" https://api.beds24.com/v2/bookings?propertyId=XXXXX
   ```

---

## Quick Start Checklist

### New Project Setup

- [ ] Get Beds24 property ID
- [ ] Generate READ token (permanent)
- [ ] Generate WRITE refresh token
- [ ] Create GitHub repository
- [ ] Set up Cloud Run project
- [ ] Configure secrets in GitHub
- [ ] Create dashboard HTML file
- [ ] Create API Express server
- [ ] Deploy and test

### Environment Variables Needed

```bash
# Backend
PROPERTY_ID=your_property_id
BEDS24_READ_TOKEN=permanent_read_token
BEDS24_WRITE_REFRESH_TOKEN=refresh_token_for_write

# Optional
TIMEZONE=Asia/Dhaka
PORT=8080
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | 2026-01-09 | Initial guide based on Miami Beach Resort project |

---

## Support Resources

- **Beds24 API Docs**: https://beds24.com/api/v2/apiV2.yaml
- **Beds24 Support**: https://beds24.com/support
- **Google Cloud Run**: https://cloud.google.com/run/docs
- **Firebase/Firestore**: https://firebase.google.com/docs

---

*This guide was created based on real-world implementation experience with the Miami Beach Resort project. Follow these patterns and avoid the documented pitfalls for a successful Beds24 integration.*
