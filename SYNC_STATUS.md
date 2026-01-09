# Miami Beach Resort - Sync Status

> **Last Updated**: 2026-01-09
> **Purpose**: Master reference for all component versions and deployment status

---

## Current Versions

| Component | Version | Location | Status |
|-----------|---------|----------|--------|
| Dashboard | v27.2-dynamic-rooms | GitHub Pages | ✅ Live |
| Miami API | v7.0-room-config | Cloud Run | ✅ Live |
| HK API | v2.0-dynamic-rooms | Cloud Run | ✅ Live |
| Beds24 Proxy | v3.0-dual-token | Cloud Run | ✅ Live |

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

### Dashboard v27.2-dynamic-rooms
- Dynamic room count from API (not hardcoded 45)
- Bangladesh timezone (Asia/Dhaka, GMT+6)
- Modular structure (js/, css/ for reference)
- GitHub Pages auto-deploy via Actions

### Miami API v7.0-room-config
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
