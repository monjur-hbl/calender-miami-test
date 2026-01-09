# Miami Beach Resort - Sync Status

> **Last Updated**: 2026-01-09 23:30 BST
> **Purpose**: Master reference for all component versions and deployment status

---

## Current Versions

| Component | Version | Location | Status |
|-----------|---------|----------|--------|
| Dashboard | v29.4-mobile-fix | GitHub Pages | ✅ Live |
| Miami API | v7.1-token-fix | Cloud Run | ✅ Live |
| HK API | v2.0-dynamic-rooms | Cloud Run | ✅ Live |
| Beds24 Proxy | v3.0-dual-token | Cloud Run | ✅ Live |

---

## Pending Actions

✅ **No pending actions** - All components deployed and live.

---

## Live URLs

```bash
# Dashboard
https://monjur-hbl.github.io/calender-miami-test/

# APIs (Health Check)
curl https://miami-api-1006186358018.us-central1.run.app/
curl https://hk-api-1006186358018.us-central1.run.app/
curl https://beds24-proxy-1006186358018.us-central1.run.app/

# Room Config (Dynamic)
curl https://miami-api-1006186358018.us-central1.run.app/room-config
```

---

## Key Features by Version

### Dashboard v29.4-mobile-fix (2026-01-09)
- **NEW**: Fixed mobile horizontal scrolling - screen now fits perfectly
- **NEW**: Golden light border animation traveling around screen edge (mobile only)
- **NEW**: Hidden occupancy row on mobile for cleaner view
- **NEW**: Sticky calendar date header on mobile for easy date tracking while scrolling
- **NEW**: Smaller room labels and cells for mobile screen fit
- **NEW**: All modals fit within mobile viewport without overflow
- Mobile-specific layout redesign
- Mobile top bar: LIVE indicator + "Refresh Grid" text below property name
- Mobile search icon on top right corner
- Mobile tabs: Only Today, By Floor, Search & Book (centered buttons)
- "By Floor" tab automatically uses 7-day calendar view
- Fixed bottom booking bar on mobile when rooms selected
- Tabs hide on mobile when selecting rooms (shows "X rooms selected" indicator)
- Hide tabs when rooms selected - only booking bar visible (desktop)
- Fully responsive calendar grid (3d, 7d, 15d, 30d all fit screen)
- Compact selection bar in sticky header, above tabs
- Small room chips with room number and dates (side by side)
- Red "Book" button at end of selection bar
- Saves screen space on smaller screens
- Landscape two-column layout for New Booking modal on desktop
- Sticky "Create Booking" button - top on desktop, bottom on mobile
- Room number and nights displayed in sticky book button
- Scrollable columns for better UX on laptops
- Add Payment button to record payments after booking creation
- Payment method selector (Cash, Bkash, Nagad, Card, Bank Transfer, Other)
- Payment reference/transaction ID field
- Payment preview before submission
- Edit Adults/Children for existing bookings
- Display Adults/Children count in booking modal
- Adults/Children selectors (1-10 adults, 0-6 children)
- Price Type selector: "Total Stay" or "Per Night"
- Per-night auto-calculation: price × nights × rooms
- rateDescription sent to Beds24 with pricing breakdown
- Invoice charge uses Beds24 template variables `[ROOMNAME1] [FIRSTNIGHT] - [LEAVINGDAY]`
- Explicit invoice items (charge + payment) for reliable Beds24 integration
- Double-click prevention on booking submit
- Overbooking detection with pulsing red indicator
- Dynamic room count from API (not hardcoded 45)
- Bangladesh timezone (Asia/Dhaka, GMT+6)
- GitHub Pages auto-deploy via Actions

### Miami API v7.1-token-fix (2026-01-09) - ✅ DEPLOYED
- **NEW**: Correct token selection (READ for GET, WRITE for POST/PUT/DELETE)
- **NEW**: Fixes booking creation "Unexpected token" error
- `/room-config` GET and POST endpoints
- Firestore collection: `room_config`
- Dashboard data endpoint: `/dashboard/data`

### Miami API v7.0-room-config (Previous)
- Added `/room-config` GET and POST endpoints
- Firestore collection: `room_config`
- Dashboard data endpoint: `/dashboard/data`

### HK API v2.0-dynamic-rooms
- Dynamic room count support
- Housekeeping task management
- Firebase authentication

### Beds24 Proxy v3.0-dual-token
- Dual-token authentication (READ + WRITE)
- Automatic token refresh
- Rate limiting and caching

---

## Firestore Collections

| Collection | Document | Purpose |
|------------|----------|---------|
| room_config | total_rooms | Dynamic room count |
| booking_notifications | * | Guest notifications |
| users | * | Staff accounts |
| hk_tasks | * | Housekeeping tasks |

---

## Deployment Commands

### Dashboard
```bash
cd dashboard
git add . && git commit -m "message" && git push
```

### Miami API
```bash
/opt/homebrew/share/google-cloud-sdk/bin/gcloud builds submit \
  --tag gcr.io/beds24-483408/miami-api:VERSION \
  miami-api-fix --project beds24-483408

/opt/homebrew/share/google-cloud-sdk/bin/gcloud run deploy miami-api \
  --image gcr.io/beds24-483408/miami-api:VERSION \
  --platform managed --region us-central1 \
  --allow-unauthenticated --project beds24-483408
```

### HK API
```bash
/opt/homebrew/share/google-cloud-sdk/bin/gcloud builds submit \
  --tag gcr.io/beds24-483408/hk-api:VERSION \
  hk-api --project beds24-483408

/opt/homebrew/share/google-cloud-sdk/bin/gcloud run deploy hk-api \
  --image gcr.io/beds24-483408/hk-api:VERSION \
  --platform managed --region us-central1 \
  --allow-unauthenticated --project beds24-483408
```

---

## Important Notes

1. **Room count is DYNAMIC** - fetched from `/room-config`, can be changed by admin
2. **Never use allRooms.length** for occupancy calculations
3. **Bangladesh timezone** (GMT+6) for all date operations
4. **Property ID**: 279646

---

## Recent Changes Log

### 2026-01-09

| Time | Component | Change | Status |
|------|-----------|--------|--------|
| 23:30 | Dashboard | Mobile fix: no horizontal scroll, golden border animation, sticky dates (v29.4) | ✅ Deployed |
| 23:00 | Dashboard | Mobile layout redesign: 3 tabs, bottom booking bar, search icon (v29.3) | ✅ Deployed |
| 22:30 | Dashboard | Hide tabs when selecting, responsive grid (v29.2) | ✅ Deployed |
| 21:30 | Dashboard | Responsive calendar grid for all day ranges (v29.0) | ✅ Deployed |
| 20:30 | Dashboard | Compact selection bar in Search & Book (v28.4) | ✅ Deployed |
| 20:00 | Dashboard | Landscape modal + sticky book button (v28.3) | ✅ Deployed |
| 19:30 | Dashboard | Add Payment feature with method selector (v28.2) | ✅ Deployed |
| 19:00 | Dashboard | Edit Adults/Children for existing bookings (v28.1) | ✅ Deployed |
| 18:30 | Dashboard | Adults/Children + Per-Night pricing (v28.0) | ✅ Deployed |
| 18:15 | Dashboard | Template variables for charge description | ✅ Deployed |
| 18:05 | Dashboard | Explicit charge + payment in invoiceItems | ✅ Deployed |
| 17:35 | Miami API | Token selection fix (READ vs WRITE) | ✅ Deployed to Cloud Run |
| 17:30 | Dashboard | Double-click prevention on booking submit | ✅ Deployed |
| 17:30 | Dashboard | Overbooking detection/display | ✅ Deployed |
| 16:00 | Dashboard | Calendar showing all future bookings | ✅ Deployed |
| 15:00 | Dashboard | Occupancy summary row | ✅ Deployed |
| 14:00 | Dashboard | Payment invoice format fix | ✅ Deployed |

---

## Git Commits Today

```bash
# Dashboard (calender-miami-test)
2a3b814 Fix: Use 'amount' instead of 'price' for Beds24 invoice items
8898a5f Fix: Prevent double booking submission + show overbookings

# Miami API (miami-api)
45163a5 Fix: Use WRITE token for POST/PUT/DELETE operations
```
