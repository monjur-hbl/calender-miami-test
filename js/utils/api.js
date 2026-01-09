// Miami Beach Resort - API Utilities
// v27.0-dynamic-rooms

// ============================================================
// ROOM CONFIG API (Dynamic Total Rooms)
// ============================================================

async function fetchRoomConfig() {
    try {
        const res = await fetch(`${PROXY}/room-config`);
        const data = await res.json();
        if (data.success && data.totalRooms) {
            console.log(`🏨 Room config: ${data.totalRooms} total rooms (source: ${data.source})`);
            return data.totalRooms;
        }
        return 45; // Default
    } catch (error) {
        console.warn('Could not fetch room config, using default:', error);
        return 45;
    }
}

// ============================================================
// BOOKING API
// ============================================================

async function fetchBookings(cache, CACHE_TTL, forceRefresh = false) {
    const now = Date.now();

    // Use cache if valid and not forcing refresh
    if (!forceRefresh && cache.data && (now - cache.timestamp) < CACHE_TTL) {
        console.log('📦 Using cached bookings');
        return { data: cache.data, fromCache: true };
    }

    console.log('🔄 Fetching bookings...');
    const startTime = performance.now();
    const todayDate = getBDDate(0);
    let filtered = [];
    let source = 'api';

    // Try optimized dashboard endpoint first (API v4.0)
    try {
        const res = await fetch(`${PROXY}/dashboard/data`);
        const data = await res.json();

        if (data.success && data.data && data.data.length > 0) {
            filtered = data.data.filter(b => b.status !== "cancelled");
            source = 'dashboard-api';
            if (data.stats) {
                console.log(`📊 API Stats: occupied=${data.stats.occupied}, checkIns=${data.stats.checkInsToday}, checkOuts=${data.stats.checkOutsToday}`);
            }
        } else {
            throw new Error('Dashboard endpoint returned no data');
        }
    } catch (dashErr) {
        // Fallback to basic getBookings endpoint
        console.log('📡 Falling back to /getBookings...');
        const res = await fetch(`${PROXY}/getBookings`);
        const data = await res.json();

        if (!data.data || data.data.length === 0) {
            throw new Error('No bookings received from API');
        }

        filtered = data.data.filter(b => b.status !== "cancelled");
        source = 'getBookings';
    }

    // Count stats for logging
    const occupied = filtered.filter(b => b.arrival <= todayDate && b.departure > todayDate).length;
    const checkIns = filtered.filter(b => b.arrival === todayDate).length;
    const checkOuts = filtered.filter(b => b.departure === todayDate).length;

    const loadTime = Math.round(performance.now() - startTime);
    console.log(`✅ [${source}] Loaded ${filtered.length} bookings in ${loadTime}ms (occupied: ${occupied}, check-ins: ${checkIns}, check-outs: ${checkOuts})`);

    return {
        data: filtered,
        fromCache: false,
        timestamp: now
    };
}

// ============================================================
// AUTHENTICATION API
// ============================================================

async function authenticateUser(username, password) {
    const res = await fetch(`${PROXY}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    return await res.json();
}

async function validateToken(token) {
    const res = await fetch(`${PROXY}/auth/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
    });
    return await res.json();
}

// ============================================================
// BOOKING MODIFICATION API
// ============================================================

async function createBooking(bookingData) {
    const res = await fetch(`${PROXY}/createBooking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
    });
    return await res.json();
}

async function updateBooking(bookingId, updates) {
    const res = await fetch(`${PROXY}/updateBooking/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
    });
    return await res.json();
}

async function deleteBooking(bookingId) {
    const res = await fetch(`${PROXY}/booking/${bookingId}`, {
        method: 'DELETE'
    });
    return await res.json();
}

// ============================================================
// WHATSAPP API
// ============================================================

async function sendWhatsAppMessage(phone, message) {
    const res = await fetch(`${PROXY}/whatsapp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message })
    });
    return await res.json();
}
