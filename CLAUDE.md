# Miami Beach Resort Dashboard

> **VERSION**: v29.6-top-booking (2026-01-09)
> **FIRST**: Check SYNC_STATUS.md in parent project for full sync status

---

## BEFORE YOU START

1. Pull latest: `git pull`
2. Check cloud APIs are responding
3. Read critical rules below

---

## CRITICAL RULES (MUST FOLLOW)

1. **NEVER** use `allRooms.length` for occupancy - use `totalRooms` state variable
2. **NEVER** use useState inside conditionals, IIFEs, or callbacks - FREEZES APP
3. **NEVER** display 'Beds24' in UI - use 'Miami Beach Resort'
4. **ALWAYS** use Bangladesh timezone (Asia/Dhaka, GMT+6)
5. **ALWAYS** count unique room/unit combinations for occupancy

---

## Room Inventory Rules

### TOTAL ROOMS - Dynamic (NOT a constant!)
Room count is **DYNAMIC** - fetched from API, admin can change for maintenance.

**Fetched from**: `GET /room-config` on miami-api
**Stored in**: `totalRooms` React state (default: 45)
**Firestore**: `room_config` collection, `total_rooms` document

### Correct Occupancy Calculation
```javascript
// totalRooms is a STATE VARIABLE, not a constant!
const totalUnits = totalRooms;  // Fetched from /room-config
const occupiedSet = new Set(stayingGuests.map(b => `${b.roomId}-${b.unitId}`));
const occupiedUnits = occupiedSet.size;
const availableUnits = totalRooms - occupiedUnits;
const occupancyRate = Math.round((occupiedUnits / totalRooms) * 100);
```

---

## API Endpoints

| Endpoint | URL |
|----------|-----|
| Miami API | https://miami-api-1006186358018.us-central1.run.app |
| HK API | https://hk-api-1006186358018.us-central1.run.app |
| Beds24 Proxy | https://beds24-proxy-1006186358018.us-central1.run.app |
| Dashboard | https://monjur-hbl.github.io/calender-miami-test/ |

**Property ID**: 279646

---

## File Structure
```
dashboard/
├── index.html              # Main app (v29.6-top-booking)
├── js/                     # Modular JS (reference only)
│   ├── config.js
│   ├── app.js
│   ├── components/
│   └── utils/
├── css/
│   └── styles.css          # Extracted CSS (reference)
├── .github/workflows/
│   └── pages.yml           # GitHub Pages deployment
└── CLAUDE.md               # This file
```

---

## Deployment
```bash
git add . && git commit -m "message" && git push
# Auto-deploys via GitHub Actions (.github/workflows/pages.yml)
```

---

## Tech Stack
- Frontend: Single-file React with inline Babel compilation
- Hosting: GitHub Pages
- APIs: Cloud Run (Node.js/Express)
- Database: Firestore

---

## Git Info
- **Repo**: https://github.com/monjur-hbl/calender-miami-test
- **Branch**: main
