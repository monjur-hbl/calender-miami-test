# System Architecture

## Overview
```
┌─────────────────────────────────────────────────────────────┐
│                    Miami Beach Resort System                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐     ┌──────────────┐    ┌──────────────┐  │
│  │   Dashboard  │     │  Mobile App  │    │  Beds24 PMS  │  │
│  │   (GitHub    │     │  (Expo/RN)   │    │  (External)  │  │
│  │    Pages)    │     │              │    │              │  │
│  └──────┬───────┘     └──────┬───────┘    └──────┬───────┘  │
│         │                    │                   │          │
│         ▼                    ▼                   ▼          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Google Cloud Run Services                  │ │
│  │  ┌─────────────────┐     ┌─────────────────┐           │ │
│  │  │  beds24-proxy   │     │     hk-api      │           │ │
│  │  │  (API Gateway)  │     │  (Webhooks +    │           │ │
│  │  │                 │     │   Firestore)    │           │ │
│  │  └─────────────────┘     └─────────────────┘           │ │
│  └────────────────────────────────────────────────────────┘ │
│                              │                              │
│                              ▼                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                  Firestore Database                     │ │
│  │  - hk_users (staff accounts)                           │ │
│  │  - housekeeping_data (tasks/assignments)               │ │
│  │  - booking_notifications (webhook events)              │ │
│  │  - otp_codes (authentication)                          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Booking Data
1. Guest makes booking on Beds24/OTA
2. Beds24 stores booking
3. Dashboard polls beds24-proxy every 30 seconds
4. beds24-proxy fetches from Beds24 API v2
5. Dashboard renders booking calendar

### Housekeeping
1. Front desk assigns tasks via dashboard
2. Tasks stored in Firestore (housekeeping_data)
3. Mobile app syncs via hk-api
4. Staff updates task status
5. Real-time sync to dashboard

### Webhooks (Partial - needs config fix)
1. Beds24 sends webhook to hk-api/webhook/booking
2. Currently only receives SYNC_ROOM events
3. Notifications stored in Firestore
4. Dashboard polls /notifications endpoint

## Tech Stack
- **Frontend**: React (single HTML file), Tailwind CSS
- **Mobile**: React Native, Expo SDK 50
- **Backend**: Node.js, Express
- **Database**: Firestore (hk-miami)
- **Hosting**: GitHub Pages (dashboard), Cloud Run (APIs)
- **External**: Beds24 API v2

## Key Integrations
1. **Beds24 API** - Property management, bookings, rooms
2. **WhatsApp** - Guest communication (via QR code)
3. **Firebase Auth** - OTP-based staff login
4. **Gmail SMTP** - OTP email delivery

