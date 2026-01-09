# API Reference

## Beds24 Proxy
Base URL: `https://beds24-proxy-1006186358018.us-central1.run.app`

### Get Bookings
```bash
GET /getBookings
```
Returns paginated bookings (100 per page).
```json
{
  "success": true,
  "data": [...],
  "count": 100,
  "pages": {
    "nextPageExists": true,
    "nextPageLink": "https://api.beds24.com/v2/bookings?page=2"
  }
}
```

### Get Rooms
```bash
GET /getRooms
```
Returns all rooms and units for the property.

---

## HK API (Housekeeping)
Base URL: `https://hk-api-1006186358018.us-central1.run.app`

### Health Check
```bash
GET /
```

### Webhook (Booking Notifications)
```bash
POST /webhook/booking
Content-Type: application/json

{
  "action": "NEW_BOOKING",
  "bookingId": 12345,
  "propId": "279646"
}
```

### Get Notifications
```bash
GET /notifications
```
Returns recent booking notifications from Firestore.

### Delete Notification
```bash
DELETE /notifications/:id
```

### Housekeeping Data
```bash
GET /housekeeping/:date
POST /housekeeping/:date
```

### Users (OTP Auth)
```bash
POST /users/send-otp
POST /users/verify-otp
GET /users/list
```

---

## Testing Commands

### Check API Health
```bash
curl https://beds24-proxy-1006186358018.us-central1.run.app/
curl https://hk-api-1006186358018.us-central1.run.app/
```

### Get Today's Stats
```bash
# Check-ins
curl -s 'https://beds24-proxy-1006186358018.us-central1.run.app/getBookings' | \
  jq '[.data[] | select(.arrival == "2026-01-09")] | length'

# Occupied
curl -s 'https://beds24-proxy-1006186358018.us-central1.run.app/getBookings' | \
  jq '[.data[] | select(.arrival <= "2026-01-09" and .departure > "2026-01-09")] | length'
```

### Test Webhook
```bash
curl -X POST https://hk-api-1006186358018.us-central1.run.app/webhook/booking \
  -H 'Content-Type: application/json' \
  -d '{"action":"TEST","bookingId":99999}'
```

### View Logs (requires gcloud)
```bash
gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=hk-api' \
  --project=beds24-483408 --limit=20 --format='table(timestamp,textPayload)'
```

