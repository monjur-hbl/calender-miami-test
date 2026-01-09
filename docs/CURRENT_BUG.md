# Current Bug: Dashboard Statistics 10x Inflation

## Problem
Dashboard showing inflated statistics (approximately 10x actual values):
- CHECK-INS: Shows 180, Actual: 17
- CHECK-OUTS: Shows 220, Actual: 0  
- OCCUPIED: Shows 420, Actual: 41
- AVAILABLE: Shows -375 (negative!)

## Root Cause Analysis
The stats calculation code looks correct:
```javascript
const stats = useMemo(() => {
    let occ=0, avail=0, cin=0, cout=0;
    allRooms.forEach(({room, unit}) => getBooking(room.id, unit.id, today) ? occ++ : avail++);
    bookings.forEach(b => { if(b.arrival === today) cin++; if(b.departure === today) cout++; });
    return {total: allRooms.length, occ, avail, cin, cout};
}, [allRooms, bookings, getBooking, today]);
```

**Likely Issue**: `allRooms` array contains duplicate room+unit combinations (~10x)

## API Verification (Jan 9, 2026)
Ran against Beds24 API:
- Check-ins today: 17
- Check-outs today: 0
- Occupied today: 41
- Total bookings (page 1): 100

## Files to Investigate
1. `index.html` - Search for `allRooms` construction
2. Look for where rooms are built from API response
3. Check if room units are being duplicated

## Related Issue
Bookings 80267939 and 80263316 reported as 'missing':
- Both ARE present in API response (page 1)
- Dashboard displaying them correctly
- May have been UI/filtering issue

## Commands to Test
```bash
# Get actual stats from API
curl -s 'https://beds24-proxy-1006186358018.us-central1.run.app/getBookings' | jq '[.data[] | select(.arrival == "2026-01-09")] | length'

# Get rooms data
curl -s 'https://beds24-proxy-1006186358018.us-central1.run.app/getRooms' | jq 'length'
```

