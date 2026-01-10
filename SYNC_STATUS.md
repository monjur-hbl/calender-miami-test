# Miami Beach Resort - Sync Status

> **Last Updated**: 2026-01-11 03:00 BST
> **Purpose**: Master reference for all component versions and deployment status

---

## Current Versions

| Component | Version | Location | Status |
|-----------|---------|----------|--------|
| Dashboard | v30.5-sticky-header | GitHub Pages | ✅ Live |
| Miami API | v7.1-token-fix | Cloud Run | ✅ Live |
| HK API | v2.0-dynamic-rooms | Cloud Run | ✅ Live |
| Beds24 Proxy | v3.0-dual-token | Cloud Run | ✅ Live |
| WhatsApp Service | v1.4.0 | Cloud Run | ✅ Live |

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
curl https://whatsapp-service-1006186358018.us-central1.run.app/

# Room Config (Dynamic)
curl https://miami-api-1006186358018.us-central1.run.app/room-config

# WhatsApp Service
curl https://whatsapp-service-1006186358018.us-central1.run.app/status
```

---

## Key Features by Version

### Dashboard v30.5-sticky-header (2026-01-11)
- **DESKTOP**: Date header now inside tabs-wrapper (sticky together with everything)
- Selection bar + tabs + calendar controls + date header all sticky at top
- **MOBILE**: Date header fixed at top, book button fixed at bottom
- Clean layout with proper sticky behavior

### Dashboard v30.4-fixed-dates (2026-01-11)
- **FIX**: Changed date header from sticky to fixed positioning
- Fixed positioning more reliable than sticky (no overflow:hidden conflicts)
- Added spacer div to prevent content overlap
- Dynamic top calculation based on selection bar state

### Dashboard v30.3-sticky-dates (2026-01-11)
- **FIX**: Corrected sticky date header positioning for all scenarios
- Works with and without room selection on both desktop and mobile
- Desktop: 170px (no selection), 225px (with selection)
- Mobile: 110px (no selection), 160px (with selection)

### Dashboard v30.2-blue-selection (2026-01-11)
- **FIX**: Selected rooms now BLUE instead of red (better visibility vs booked rooms)
- **FIX**: Tabs stay visible when rooms are selected (no more jumping)
- **FIX**: Selection bar appears ABOVE tabs instead of replacing them
- **FIX**: Date header stays sticky with dynamic top position adjustment

### Dashboard v30.1-fixed (2026-01-11)
- **FIX**: Fixed floating selection bar crash (was incorrectly placed in WhatsAppTab)
- Sticky floating selection bar on desktop (top) and mobile (bottom) when scrolling with units selected
- Occupancy row no longer sticky - scrolls with content
- WhatsApp chat UI improvements from v30.0

### Dashboard v30.0-whatsapp-ui (2026-01-10)
- WhatsApp integration tab with real-time messaging
- Full chat interface with message history
- Media sending support (images, videos, documents)
- Read receipts and delivery status
- Group messaging support

### Dashboard v29.5-mobile-ui (2026-01-09)
- **NEW**: Golden light rocket trail animation around screen border (mobile only)
- **NEW**: Mobile top bar: LIVE, Refresh, Search buttons in consistent pill style
- **NEW**: Logout/Login button on top right corner (styled like LIVE)
- **NEW**: Fixed mobile booking button appearing after selecting units
- Fixed mobile horizontal scrolling - screen now fits perfectly
- Hidden occupancy row on mobile for cleaner view
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

### WhatsApp Service v1.4.0 (2026-01-10) - ✅ FULL FEATURES
- **Baileys library** for WhatsApp Web multi-device connection
- QR code generation for WhatsApp login
- Session persistence via Firestore backup
- **Send/receive text messages** (both sent & received visible)
- **Send/receive media** (images, videos, audio, documents)
- **Location sharing** (send locations with coordinates)
- **Group messaging** (send to groups, list groups)
- **Read receipts** (delivery status tracking)
- **Status/stories viewing** (view contact statuses)
- Endpoints: `/status`, `/restart`, `/logout`, `/send`, `/send-media`, `/send-location`, `/read`, `/messages`, `/chats`, `/groups`, `/statuses`
- Cloud Run: min-instances=1 for WebSocket persistence

---

## Firestore Collections

| Collection | Document | Purpose |
|------------|----------|---------|
| room_config | total_rooms | Dynamic room count |
| booking_notifications | * | Guest notifications |
| users | * | Staff accounts |
| hk_tasks | * | Housekeeping tasks |
| whatsapp_auth | main_session_* | WhatsApp session credentials |
| whatsapp_messages | * | Incoming WhatsApp messages |

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

### WhatsApp Service
```bash
/opt/homebrew/share/google-cloud-sdk/bin/gcloud builds submit \
  --tag gcr.io/beds24-483408/whatsapp-service:VERSION \
  whatsapp-service --project beds24-483408

/opt/homebrew/share/google-cloud-sdk/bin/gcloud run deploy whatsapp-service \
  --image gcr.io/beds24-483408/whatsapp-service:VERSION \
  --platform managed --region us-central1 \
  --allow-unauthenticated --memory 512Mi --cpu 1 \
  --min-instances 1 --max-instances 1 \
  --project beds24-483408
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
| 01:30 | Dashboard | v30.0 - WhatsApp UI: proper alignment, media upload, read receipts | ✅ Deployed |
| 01:10 | WhatsApp Service | v1.4.0 - Full features (media, groups, location, read receipts) | ✅ Deployed |
| 00:55 | WhatsApp Service | v1.3.0 - In-memory message storage fix | ✅ Deployed |
| 00:15 | WhatsApp Service | v1.2.0 - Baileys + Firestore auth, QR code working | ✅ Deployed |
| 00:00 | Dashboard | Fireworks on unit selection, renamed "Floor Calendar" (v29.7) | ✅ Deployed |
| 23:50 | Dashboard | Mobile booking bar at top (like desktop) (v29.6) | ✅ Deployed |
| 23:45 | Dashboard | Mobile UI: rocket trail animation, pill buttons, logout, booking bar fix (v29.5) | ✅ Deployed |
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
