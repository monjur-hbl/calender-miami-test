# Miami Beach Resort - Hotel Management System

## Project Overview
A comprehensive hotel management system for Miami Beach Resort in Cox's Bazar, Bangladesh.
Front desk dashboard integrating booking management, housekeeping coordination, accounting, and guest services.

## Quick Start for Claude Code
```bash
# 1. Open terminal and navigate to this folder
cd ~/Desktop/miami-beach-resort-project

# 2. Clone the repositories
git clone https://github.com/monjur-hbl/calender-miami-test.git dashboard
git clone https://github.com/monjur-hbl/hk-api.git hk-api

# 3. Start working with Claude Code
claude
```

## Current Bug (Priority Fix)
Dashboard statistics showing 10x inflated numbers:
- Displayed: 180 check-ins, 220 check-outs, 420 occupied
- Actual: 17 check-ins, 0 check-outs, 41 occupied
- Root cause: `allRooms` array likely has duplicate room+unit combinations

## Repositories
1. **Dashboard** (Web Frontend)
   - GitHub: https://github.com/monjur-hbl/calender-miami-test
   - Live: https://monjur-hbl.github.io/calender-miami-test/
   - Current Version: v26

2. **HK API** (Backend)
   - GitHub: https://github.com/monjur-hbl/hk-api
   - Live: https://hk-api-1006186358018.us-central1.run.app
   - Deployed on: Google Cloud Run

3. **Mobile App** (React Native)
   - GitHub: https://github.com/monjur-hbl/miami-beach-resort-app
   - Platform: Expo SDK 50

## API Endpoints
- Beds24 Proxy: https://beds24-proxy-1006186358018.us-central1.run.app
- HK API: https://hk-api-1006186358018.us-central1.run.app
- Webhook: POST /webhook/booking
- Notifications: GET /notifications

## Key Files
- Dashboard: index.html (single-file React app)
- HK API: server.js (Express + Firestore)

See /docs folder for detailed documentation.

