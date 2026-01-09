# Miami Beach Resort - Hotel Management System

## IMPORTANT: Room Inventory Rules

### TOTAL ROOMS = 45 (Fixed Constant)
The property has exactly **45 room units**. This is defined as `TOTAL_ROOMS = 45` in dashboard/index.html.

**NEVER** use `allRooms.length` or `stayingGuests.length` for occupancy calculations.
**ALWAYS** use `TOTAL_ROOMS` constant for:
- Occupancy rate calculations
- Available rooms calculations
- Any total room count display

### Correct Occupancy Calculation
```javascript
// Use TOTAL_ROOMS constant
const totalUnits = TOTAL_ROOMS;  // Always 45
// Count unique occupied room/unit combinations (not booking count!)
const occupiedSet = new Set(stayingGuests.map(b => `${b.roomId}-${b.unitId}`));
const occupiedUnits = occupiedSet.size;
const availableUnits = TOTAL_ROOMS - occupiedUnits;
const occupancyRate = Math.round((occupiedUnits / TOTAL_ROOMS) * 100);
```

---

## Project Overview
Hotel management system for Miami Beach Resort, Cox's Bazar, Bangladesh.
Front desk dashboard with booking management, housekeeping, accounting.

## Tech Stack
- Frontend: Single-file React app (dashboard/index.html) with Tailwind CSS
- Backend: Node.js/Express on Google Cloud Run (hk-api/)
- Database: Firestore (database ID: hk-miami)
- Hosting: GitHub Pages (dashboard), Cloud Run (APIs)
- Property API: Beds24 via proxy

## Repository Structure
```
dashboard/           # Web dashboard
  └── index.html    # Main app - FIX THE BUG HERE
hk-api/             # Backend API  
  └── server.js     # Express server with webhooks
```

## CRITICAL RULES
1. ⚠️ NEVER use useState inside conditionals, IIFEs, or callbacks - FREEZES APP
2. NEVER display 'Beds24' in UI - use 'Miami Beach Resort'
3. Use `deposit` field for payment tracking (not `paid`)
4. Revenue = checkout date based

## API Endpoints
- Beds24 Proxy: https://beds24-proxy-1006186358018.us-central1.run.app
- HK API: https://hk-api-1006186358018.us-central1.run.app
- Property ID: 279646

## Git Info
- Repo: monjur-hbl/calender-miami-test
- After fix: git add . && git commit -m 'Fix: Remove duplicate room entries in stats' && git push

