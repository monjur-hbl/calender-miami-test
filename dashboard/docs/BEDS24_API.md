# Beds24 API V2 Reference

## Base URL
```
https://api.beds24.com/v2
```

## Authentication
All requests require a `token` header with a valid authentication token.

### Get Token
```
GET /authentication/token
Header: refreshToken: <your-refresh-token>
```

## Bookings Endpoint

### GET /bookings
Get bookings matching specified criteria. By default only upcoming bookings will be returned.

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| **filter** | string | Special filters (see below) |
| **propertyId** | integer[] | Filter by property ID(s) |
| **roomId** | integer[] | Filter by room ID(s) |
| **id** | integer[] | Filter by booking ID(s) |
| **masterId** | integer[] | Filter by master ID(s) |
| **apiReference** | string[] | Filter by API reference(s) |
| **channel** | string | Filter by booking channel |
| **arrival** | date | Exact arrival date (YYYY-MM-DD) |
| **arrivalFrom** | date | Arrivals after this date |
| **arrivalTo** | date | Arrivals before this date |
| **departure** | date | Exact departure date (YYYY-MM-DD) |
| **departureFrom** | date | Departures after this date |
| **departureTo** | date | Departures before this date |
| **bookingTimeFrom** | datetime | Bookings created after (YYYY-MM-DDTHH:MM:SS UTC) |
| **bookingTimeTo** | datetime | Bookings created before |
| **modifiedFrom** | datetime | Modified after |
| **modifiedTo** | datetime | Modified before |
| **searchString** | string | Search guest name, email, apiref, or bookingId |
| **includeInvoiceItems** | boolean | Include invoice items in response |
| **includeInfoItems** | boolean | Include info items in response |
| **includeGuests** | boolean | Include guest data (requires bookings-personal scope) |
| **includeBookingGroup** | boolean | Include booking group IDs |
| **status** | string[] | Filter by status (default: confirmed, request, new, black, inquiry) |
| **page** | integer | Page number for pagination |

#### Filter Values

| Filter | Description |
|--------|-------------|
| `arrivals` | Bookings arriving today |
| `departures` | Confirmed, new, request bookings departing today |
| `new` | Bookings created in the past 24 hours |
| `current` | Bookings with check-in <= today AND check-out >= today (CURRENTLY OCCUPIED) |

**Note:** All dates are in the property's time zone.

#### Status Values
- `confirmed` - Confirmed booking
- `request` - Booking request
- `new` - New booking
- `cancelled` - Cancelled booking
- `black` - Blocked/unavailable
- `inquiry` - Inquiry only

#### Response
```json
{
  "success": true,
  "type": "booking",
  "count": 100,
  "pages": {
    "nextPageExists": true,
    "nextPageLink": "https://api.beds24.com/v2/bookings?page=2"
  },
  "data": [
    {
      "id": 12345678,
      "propertyId": 279646,
      "roomId": 583459,
      "unitId": 1,
      "status": "confirmed",
      "arrival": "2026-01-09",
      "departure": "2026-01-12",
      "numAdult": 2,
      "numChild": 0,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "",
      "mobile": "01234567890",
      "price": 15000,
      "deposit": 5000,
      "bookingTime": "2026-01-01T10:00:00Z",
      "modifiedTime": "2026-01-05T14:30:00Z"
    }
  ]
}
```

### POST /bookings
Create or update bookings.

#### Request Body
```json
[
  {
    "roomId": 583459,
    "unitId": 1,
    "status": "confirmed",
    "arrival": "2026-01-15",
    "departure": "2026-01-18",
    "numAdult": 2,
    "numChild": 0,
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "mobile": "01234567890",
    "price": 12000,
    "deposit": 3000
  }
]
```

To update existing booking, include the `id` field.

## Pagination

- API returns max 100 results per page
- Check `pages.nextPageExists` to see if more pages available
- Use `page=2`, `page=3`, etc. to get subsequent pages

## Important Notes for Miami Beach Resort

### Property Details
- **Property ID:** 279646
- **Total Rooms:** 45 units across 8 room types

### Room Types & IDs
| Room ID | Name | Units |
|---------|------|-------|
| 583459 | Royal Sea View Couple | 601, 602, 603, 604 |
| 583466 | Premium Sea View Couple | 401, 404, 501, 504 |
| 583467 | Deluxe Bay View Couple | 402, 403, 502, 503 |
| 583468 | Deluxe Hill View Couple | 201, 204, 207, 301, 304, 307, 407, 507 |
| 583469 | Deluxe Urban View Couple | 101, 102, 103, 104, 107, 202, 203, 302, 303 |
| 583470 | Premium Sea View Family | 405, 406, 408, 505, 506, 508, 606 |
| 583471 | Deluxe Hill View Family | 205, 206, 208, 305, 306, 308 |
| 583472 | Deluxe Urban View Family | 105, 106, 108 |

### Common Queries

**Get currently occupied rooms:**
```
GET /bookings?propertyId=279646&filter=current
```

**Get today's arrivals:**
```
GET /bookings?propertyId=279646&filter=arrivals
```

**Get today's departures:**
```
GET /bookings?propertyId=279646&filter=departures
```

**Get bookings for date range:**
```
GET /bookings?propertyId=279646&arrivalFrom=2026-01-09&arrivalTo=2026-01-31
```

**Get bookings departing from today onwards:**
```
GET /bookings?propertyId=279646&departureFrom=2026-01-09
```

## Webhooks

### Webhook URL
```
https://hk-api-1006186358018.us-central1.run.app/webhook/booking
```

### Webhook Events
- New booking created
- Booking modified (affects availability)
- Booking cancelled
- Guest message from OTA

### Webhook Version
Use **Version 2 - with personal data** to receive full booking JSON in API V2 format.
