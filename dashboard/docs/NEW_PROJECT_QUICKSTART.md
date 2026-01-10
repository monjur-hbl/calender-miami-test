# New Beds24 Hotel Project - Quick Start

> **Use this file** when starting a new hotel project in a fresh Claude chat
> **Full reference**: See BEDS24_PROJECT_GUIDE.md for detailed explanations

---

## Step 1: Provide This Context to Claude

Copy and paste the following to start your new project:

```
I'm building a hotel management dashboard connected to Beds24 PMS.

## My Hotel Details
- Hotel Name: [YOUR HOTEL NAME]
- Property ID: [YOUR BEDS24 PROPERTY_ID]
- Location/Timezone: [e.g., Asia/Dhaka GMT+6]
- Total Rooms: [NUMBER]

## Beds24 Tokens (keep secret, set as env vars)
- READ_TOKEN: [permanent token for GET requests]
- WRITE_REFRESH_TOKEN: [refresh token for POST/PUT/DELETE]

## Key Requirements
1. Dashboard hosted on GitHub Pages (free, auto-deploy)
2. API backend on Google Cloud Run
3. Single-file React frontend (no build step)
4. Features needed: [list your features]

## CRITICAL RULES (from proven implementation):

### Beds24 API
- POST /bookings body must be ARRAY: `[{booking}]` not `{booking}`
- Use `amount` not `price` for invoice items
- Use `autoInvoiceItemCharge: true` in actions for auto charge creation
- Use READ token for GET, WRITE token for POST/PUT/DELETE

### Invoice Items Pattern
```javascript
const bookingData = {
    price: totalAmount,  // Beds24 uses this for charge
    deposit: paymentReceived,
    actions: { autoInvoiceItemCharge: true },
    invoiceItems: [{ type: "payment", description: "Cash", qty: 1, amount: paymentReceived }]
};
```

### React Rules
- NEVER use useState inside conditionals/callbacks - freezes app
- Room count must be DYNAMIC (from API), never hardcoded

### Occupancy Calculation
```javascript
// Count UNIQUE room/unit combos, not booking count
const occupiedSet = new Set(bookings.map(b => `${b.roomId}-${b.unitId}`));
const occupiedRooms = occupiedSet.size;
```

Please help me build this step by step.
```

---

## Step 2: Project Structure to Create

```
my-hotel-project/
├── dashboard/
│   ├── index.html          # Single-file React app
│   ├── CLAUDE.md           # AI instructions
│   └── .github/workflows/
│       └── pages.yml       # Auto-deploy to GitHub Pages
├── api/
│   ├── index.js            # Express server
│   ├── Dockerfile
│   ├── package.json
│   └── .github/workflows/
│       └── deploy.yml      # Auto-deploy to Cloud Run
├── CLAUDE.md               # Project-level instructions
└── SYNC_STATUS.md          # Version tracking
```

---

## Step 3: Essential Code Patterns

### API Token Selection
```javascript
const token = (method === 'POST' || method === 'PUT' || method === 'DELETE')
    ? await getWriteToken()
    : READ_TOKEN;
```

### Booking Creation
```javascript
const booking = {
    propertyId: PROPERTY_ID,
    roomId: room.id,
    unitId: unit.id,
    arrival: "2026-01-15",
    departure: "2026-01-17",
    firstName: "Guest",
    lastName: "Name",
    price: 5000,
    deposit: 2000,
    numAdult: 2,
    numChild: 0,
    actions: { autoInvoiceItemCharge: true },
    invoiceItems: [{
        type: "payment",
        description: "Cash Received",
        qty: 1,
        amount: 2000
    }]
};

// POST as array!
await fetch(API + '/bookings', {
    method: 'POST',
    body: JSON.stringify([booking])
});
```

### Add Payment to Existing Booking
```javascript
const update = {
    id: existingBookingId,
    deposit: currentDeposit + newAmount,
    invoiceItems: [{
        type: "payment",
        description: "Bkash TXN123",
        qty: 1,
        amount: newAmount
    }]
};

await fetch(API + '/bookings', {
    method: 'POST',
    body: JSON.stringify([update])
});
```

### Today's Date in Timezone
```javascript
const today = new Date().toLocaleDateString('en-CA', {
    timeZone: 'Asia/Dhaka'  // Change to your timezone
});
```

---

## Step 4: Common Mistakes to Avoid

| Mistake | Correct Approach |
|---------|-----------------|
| `body: JSON.stringify(booking)` | `body: JSON.stringify([booking])` |
| `{ price: 500 }` in invoiceItems | `{ amount: 500 }` in invoiceItems |
| `useState()` inside if/callback | `useState()` at component top only |
| `allRooms.length` for occupancy | Count unique `roomId-unitId` combos |
| Hardcoded room count | Fetch from API/database |
| Using READ token for POST | Use WRITE token for POST/PUT/DELETE |

---

## Step 5: Deployment Commands

### GitHub Pages (Dashboard)
```bash
git add . && git commit -m "Deploy" && git push
# Auto-deploys via GitHub Actions
```

### Cloud Run (API)
```bash
# Build
gcloud builds submit --tag gcr.io/PROJECT_ID/api-name

# Deploy
gcloud run deploy api-name \
  --image gcr.io/PROJECT_ID/api-name \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "PROPERTY_ID=XXX,BEDS24_READ_TOKEN=XXX"
```

---

## Step 6: Testing Checklist

- [ ] API health check returns 200
- [ ] Can fetch bookings from Beds24
- [ ] Can create new booking
- [ ] Invoice items show in Beds24
- [ ] Payments recorded correctly
- [ ] Occupancy calculation accurate
- [ ] Dates display in correct timezone
- [ ] Double-click prevention works
- [ ] Mobile responsive

---

## Files to Share with New Claude Chat

1. **This file** (NEW_PROJECT_QUICKSTART.md)
2. **BEDS24_PROJECT_GUIDE.md** (full reference)
3. Your **hotel requirements** document

---

*Based on Miami Beach Resort implementation - January 2026*
