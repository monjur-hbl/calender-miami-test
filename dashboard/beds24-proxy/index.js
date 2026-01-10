/**
 * Beds24 API Proxy for Miami Beach Resort
 * Properly passes ALL query parameters to Beds24 API V2
 * TIMEZONE: Asia/Dhaka (GMT+6)
 *
 * TOKEN STRATEGY:
 * - READ_TOKEN: Permanent access token for read operations (no refresh needed)
 * - WRITE_REFRESH_TOKEN: Refresh token for write/delete operations (needs refresh)
 */

const express = require('express');
const cors = require('cors');

const app = express();

// Configuration
const BEDS24_API = 'https://api.beds24.com/v2';
const PROPERTY_ID = 279646;
const TIMEZONE = 'Asia/Dhaka';

// Permanent READ token (lifelong access token for read operations)
const READ_TOKEN = process.env.BEDS24_READ_TOKEN || 'Bl4DR+RRtX2+7K5z4yKsxn+lXqAiBf6OAOpX7vKI6D+B+oVGDZqhCgJzITjbwG1GiLWQaYxPSDUPpTFT0kJj2D69S1IneOpdmoDkq0T3vYvKzBJdA0MVyN4DSdbPSii8E35dgUy6tvY+Lpg5Z71MHIuZAz836qMOFgAywZ9lkD8=';

// WRITE refresh token (for write/delete operations)
const WRITE_REFRESH_TOKEN = process.env.BEDS24_WRITE_REFRESH_TOKEN || 'dhkoMR8hcpV1XIu0fsoIEey5X3zlazcbA0TPJv6FjAEf+tP0K4te1XTjnazpIbCJ09rqe1xPFAQqbFEwKZh5AZspvoqQoddlAkyMbvTHMqER7v4SON+M2cM3ha/daNcqdGpa6gEAszF3Xt0z2bu0Thb53lRtEJUvoB8Ghfzjdvs=';

// Get current datetime in Bangladesh timezone
const getNowBD = () => new Date().toLocaleString('en-US', { timeZone: TIMEZONE });
const getTodayBD = () => new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });

// Write token cache
let writeTokenCache = { token: null, expiresAt: 0 };

app.use(cors({ origin: '*' }));
app.use(express.json());

// Get READ token (permanent, no refresh needed)
function getReadToken() {
    return READ_TOKEN;
}

// Get WRITE token (refresh if needed)
async function getWriteToken() {
    const now = Date.now();

    // Return cached token if still valid (with 5 min buffer)
    if (writeTokenCache.token && writeTokenCache.expiresAt > now + 300000) {
        return writeTokenCache.token;
    }

    console.log('🔑 Refreshing Beds24 WRITE token...');

    const res = await fetch(`${BEDS24_API}/authentication/token`, {
        headers: { 'refreshToken': WRITE_REFRESH_TOKEN }
    });

    const data = await res.json();

    if (!data.token) {
        throw new Error('Failed to get write token: ' + JSON.stringify(data));
    }

    // Cache write token
    writeTokenCache = {
        token: data.token,
        expiresAt: now + (data.expiresIn * 1000) - 60000 // Subtract 1 min buffer
    };

    console.log('✅ WRITE token refreshed successfully');
    return writeTokenCache.token;
}

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'beds24-proxy',
        propertyId: PROPERTY_ID,
        timezone: TIMEZONE,
        todayBD: getTodayBD(),
        timestampBD: getNowBD(),
        timestampUTC: new Date().toISOString()
    });
});

// Legacy endpoint for backward compatibility
app.get('/getBookings', async (req, res) => {
    try {
        const token = getReadToken();

        // Build query string from all passed parameters
        const params = new URLSearchParams();
        params.set('propertyId', PROPERTY_ID);

        // Pass through all query parameters
        for (const [key, value] of Object.entries(req.query)) {
            if (key !== 'propertyId') { // Don't override our property ID
                params.set(key, value);
            }
        }

        const url = `${BEDS24_API}/bookings?${params.toString()}`;
        console.log(`📡 GET ${url}`);

        const response = await fetch(url, {
            headers: { 'token': token }
        });

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Legacy endpoint for rooms
app.get('/getRooms', async (req, res) => {
    try {
        const token = getReadToken();

        const url = `${BEDS24_API}/properties/${PROPERTY_ID}/rooms`;
        console.log(`📡 GET ${url}`);

        const response = await fetch(url, {
            headers: { 'token': token }
        });

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Generic proxy endpoint - passes any endpoint and parameters to Beds24
app.get('/', async (req, res) => {
    try {
        const { endpoint, ...params } = req.query;

        if (!endpoint) {
            return res.json({
                service: 'beds24-proxy',
                version: 'v3.0-dual-token',
                endpoints: ['/getBookings', '/getRooms', '/?endpoint=bookings&...'],
                propertyId: PROPERTY_ID,
                timezone: TIMEZONE,
                todayBD: getTodayBD()
            });
        }

        const token = getReadToken();

        // Build query string
        const queryParams = new URLSearchParams();

        // Add property ID if not specified and endpoint is bookings
        if (endpoint === 'bookings' && !params.propertyId) {
            queryParams.set('propertyId', PROPERTY_ID);
        }

        // Pass through ALL other parameters
        for (const [key, value] of Object.entries(params)) {
            queryParams.set(key, value);
        }

        const queryString = queryParams.toString();
        const url = `${BEDS24_API}/${endpoint}${queryString ? '?' + queryString : ''}`;

        console.log(`📡 GET ${url}`);

        const response = await fetch(url, {
            headers: { 'token': token }
        });

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST proxy for creating/updating bookings (uses WRITE token)
app.post('/', async (req, res) => {
    try {
        const { endpoint } = req.query;

        if (!endpoint) {
            return res.status(400).json({ error: 'Missing endpoint parameter' });
        }

        const token = await getWriteToken();

        const url = `${BEDS24_API}/${endpoint}`;
        console.log(`📡 POST ${url}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'token': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`🚀 Beds24 Proxy v3.0 (dual-token) listening on port ${PORT}`);
    console.log(`   Property ID: ${PROPERTY_ID}`);
    console.log(`   Timezone: ${TIMEZONE}`);
    console.log(`   READ Token: ✅ Permanent`);
    console.log(`   WRITE Token: ✅ Auto-refresh`);
});
