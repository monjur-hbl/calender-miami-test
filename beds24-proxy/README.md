# Beds24 API Proxy

Proxy server for Beds24 API V2 that properly passes all query parameters.

## Endpoints

### GET /health
Health check endpoint.

### GET /getBookings
Get bookings with optional filters.

**Query Parameters:**
- `filter` - arrivals, departures, new, current
- `page` - Page number for pagination
- `arrivalFrom`, `arrivalTo` - Filter by arrival date
- `departureFrom`, `departureTo` - Filter by departure date
- All other Beds24 booking parameters

**Examples:**
```bash
# Get currently occupied rooms
curl 'https://beds24-proxy-xxx.run.app/getBookings?filter=current'

# Get today's arrivals
curl 'https://beds24-proxy-xxx.run.app/getBookings?filter=arrivals'

# Get today's departures
curl 'https://beds24-proxy-xxx.run.app/getBookings?filter=departures'

# Get page 2
curl 'https://beds24-proxy-xxx.run.app/getBookings?page=2'

# Get bookings for date range
curl 'https://beds24-proxy-xxx.run.app/getBookings?departureFrom=2026-01-09&arrivalTo=2026-02-28'
```

### GET /getRooms
Get all rooms and units for the property.

### GET /?endpoint=bookings&...
Generic proxy - pass any Beds24 endpoint and parameters.

## Deployment

### Prerequisites
1. Get Beds24 refresh token from: https://beds24.com/control3.php?pagetype=apiv2
2. Set up Google Cloud project

### Deploy to Cloud Run
```bash
# Set your refresh token
export BEDS24_REFRESH_TOKEN="your-token-here"

# Deploy using Cloud Build
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_BEDS24_REFRESH_TOKEN=$BEDS24_REFRESH_TOKEN

# Or deploy directly
gcloud run deploy beds24-proxy \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars BEDS24_REFRESH_TOKEN=$BEDS24_REFRESH_TOKEN
```

## Environment Variables
- `BEDS24_REFRESH_TOKEN` - Required. Get from Beds24 API settings.
- `PORT` - Optional. Defaults to 8080.
