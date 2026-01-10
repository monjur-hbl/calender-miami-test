# Changelog - Miami Beach Resort Project

All notable changes to this project are documented here.

---

## [2026-01-09] - Booking System Fixes

### Dashboard (v28.0-guest-pricing) - calender-miami-test

#### Feature - Guest Count & Per-Night Pricing (19:00 BST)
- **Adults/Children Selectors**: Dropdown to select 1-10 adults and 0-6 children
- **Price Type Selector**: Choose "Total Stay" or "Per Night"
- **Per-Night Calculation**: Auto-calculates total = price × nights × rooms
- **rateDescription**: Sent to Beds24 with pricing breakdown (e.g., "৳4500 per night × 2 nights = ৳9000")
- **Invoice Template Variables**: Charge description uses `[ROOMNAME1] [FIRSTNIGHT] - [LEAVINGDAY]`
- **Explicit Invoice Items**: Both charge and payment sent in invoiceItems array

#### Fixed - Invoice Generation (18:30 BST)
- **Root Cause Found**: `autoInvoiceItemCharge` only works when NO invoiceItems are sent
- **Solution**: Explicitly send both charge and payment in invoiceItems array
- **Charge Format**: Uses Beds24 template variables for description

#### Previous Attempt - autoInvoiceItemCharge (18:05 BST)
- **autoInvoiceItemCharge Action**: Uses Beds24's recommended approach for invoice generation
- **How It Works**:
  - Added `actions: { autoInvoiceItemCharge: true }` to booking data
  - Beds24 automatically creates charge from `price` field using property defaults
  - Payments still sent via `invoiceItems` array with `{type: "payment", description, qty, amount}`
- **Why This Fix**: Manual invoice item creation wasn't populating correctly; Beds24 API spec recommends this action for automatic charge generation
- **Result**: Both Charges and Payments sections now populate correctly in Beds24

#### Previous Attempt - Invoice Items (17:50 BST)
- **Invoice Item Field Name**: Changed `price` to `amount` for Beds24 API V2 compatibility
- **Status**: Did not fully resolve the issue; replaced by autoInvoiceItemCharge approach

#### Fixed - Double Booking Prevention (17:30 BST)
- **Double Booking Prevention**: Added guard in submit function to prevent multiple submissions when clicking Create Booking button rapidly
- **Button Disabled State**: Submit button now properly disabled with visual feedback (`pointerEvents: none`, `cursor: not-allowed`, muted colors) during booking creation

#### Added - Overbooking Detection (17:30 BST)
- **Overbooking Detection**: New `getAllBookingsForCell()` function that returns ALL bookings for a room/date (not just the first one)
- **Overbooking Visual Indicator**:
  - New `.card-overbooking` CSS class with dark red gradient and pulsing animation
  - Displays "OVERBOOK (N)" where N is the count of conflicting bookings
  - Shows all guest names separated by " / "
  - High-visibility pulsing red glow to alert staff

### Miami API (v7.1-token-fix) - miami-api

#### Fixed (17:35 BST)
- **Token Selection for Write Operations**: `fetchBeds24()` now correctly selects token based on HTTP method:
  - `READ_TOKEN` (permanent) for GET requests
  - `WRITE_TOKEN` (auto-refreshed) for POST/PUT/DELETE requests
- **Proxy Fallback Routing**: Write operations now correctly route through proxy when direct API fails

#### Root Cause
- Booking creation was failing with "Unexpected token < in JSON" error
- API was using READ token for all operations
- Beds24 requires WRITE token for POST requests, returned HTML error page instead of JSON

---

## [2026-01-08] - Calendar & Payment Fixes

### Dashboard

#### Fixed
- **Calendar View**: Changed from `/dashboard/data` (today only) to `/api/calendar?start=&days=45` (full date range)
- **Future Bookings**: All bookings now visible in calendar, not just today's
- **Payment Invoice Items**: Corrected Beds24 API invoice item format:
  - Changed from `qty: -1` to `type: "payment"` for payments
  - Added `type: "charge"` for accommodation charges

#### Added
- **Occupancy Summary Row**: Sticky row under calendar dates showing:
  - Available rooms count per day
  - Occupied rooms count
  - Color coding: Green (normal), Yellow (low <= 5), Red (full)

---

## Architecture Notes

### Token Strategy (Beds24 API V2)

```
READ_TOKEN (Permanent)
├── Used for: GET requests
├── No refresh needed
└── Stored in: BEDS24_READ_TOKEN env var

WRITE_REFRESH_TOKEN
├── Used for: POST, PUT, DELETE requests
├── Auto-refreshes when expired (5 min buffer)
├── Cached in writeTokenCache
└── Stored in: BEDS24_WRITE_REFRESH_TOKEN env var
```

### Booking Data Flow

```
Dashboard (React)
    ↓ POST /api/bookings
Miami API (Cloud Run)
    ↓ fetchBeds24('bookings', {}, 'POST', data)
    ↓ getWriteToken() → refresh if needed
Beds24 API V2
    ↓ Returns booking confirmation
Dashboard ← Shows success/error
```

### Overbooking Handling

```
StatusCard Component
    ↓ getAllBookingsForCell(roomId, unitId, date)
    ↓ If count > 1 → isOverbooked = true
    ↓ Display: "OVERBOOK (N)" with pulsing red style
    ↓ Click → Opens first booking modal
Staff Action
    ↓ Manual correction in Beds24 or contact guests
```

### Beds24 Invoice Items - RECOMMENDED APPROACH

```javascript
// Use autoInvoiceItemCharge action (Beds24 recommended)
const bookingData = {
    propertyId: 279646,
    roomId: 123,
    unitId: 456,
    arrival: "2026-01-10",
    departure: "2026-01-12",
    price: 3000,              // Total price - Beds24 creates charge from this
    deposit: 500,             // Payment received
    actions: {
        autoInvoiceItemCharge: true  // ← KEY: Auto-creates charge from price
    },
    invoiceItems: [{          // Only add payments manually
        type: "payment",
        description: "Cash Received",
        qty: 1,
        amount: 500
    }]
};
```

**Why This Works**:
- `autoInvoiceItemCharge: true` tells Beds24 to create charge from `price` field
- Uses property's default invoice description
- Payments are still added via `invoiceItems` array
- Much more reliable than manually creating charge items

---

## Known Issues

1. **Double Booking on Error**: If API returns error but booking actually succeeds (network timeout, etc.), user might retry creating duplicate. The guard prevents rapid double-clicks but not intentional retries.

2. **Overbooking Modal**: Currently shows only the first booking when clicking an overbooked cell. Future enhancement could show a list of all conflicting bookings.

---

## Deployment Checklist

### Dashboard
```bash
cd dashboard
git add . && git commit -m "message" && git push
# Auto-deploys via GitHub Actions to GitHub Pages
```

### Miami API
```bash
cd miami-api-fix
git add . && git commit -m "message" && git push
# Requires manual Cloud Run deployment:
gcloud builds submit --tag gcr.io/beds24-483408/miami-api:latest
gcloud run deploy miami-api --image gcr.io/beds24-483408/miami-api:latest --region us-central1
```

### HK API
```bash
cd hk-api
git add . && git commit -m "message" && git push
# Requires manual Cloud Run deployment:
gcloud builds submit --tag gcr.io/beds24-483408/hk-api:latest
gcloud run deploy hk-api --image gcr.io/beds24-483408/hk-api:latest --region us-central1
```

---

## File Quick Reference

| Component | Main File | Location |
|-----------|-----------|----------|
| Dashboard | index.html | dashboard/ |
| Miami API | index.js | miami-api-fix/ |
| HK API | server.js | hk-api/ |
| Beds24 Proxy | index.js | beds24-proxy/ |

---

## Contact & Resources

- **Beds24 API Docs**: https://beds24.com/api/v2/apiV2.yaml
- **Property ID**: 279646
- **Timezone**: Asia/Dhaka (GMT+6)
- **GCP Project**: beds24-483408
