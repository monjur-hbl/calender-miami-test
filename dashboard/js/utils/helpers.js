// Miami Beach Resort - Utility Functions
// v27.0-dynamic-rooms

// ============================================================
// DATE/TIME UTILITIES (Bangladesh Timezone)
// ============================================================

const getBDDate = (offset = 0) => {
    const now = new Date();
    const bdNow = new Date(now.toLocaleString('en-US', { timeZone: BD_TIMEZONE }));
    bdNow.setDate(bdNow.getDate() + offset);
    return bdNow.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD format
};

const getBDTime = () => {
    return new Date().toLocaleTimeString("en-US", {timeZone: BD_TIMEZONE, hour: "2-digit", minute: "2-digit", hour12: true});
};

const getBDTimestamp = () => {
    return new Date().toLocaleString('en-US', { timeZone: BD_TIMEZONE });
};

const formatDate = (d) => new Date(d+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
const shortDay = (d) => new Date(d+"T12:00:00").toLocaleDateString("en-US",{weekday:"short"});
const dayNum = (d) => new Date(d+"T12:00:00").getDate();

// ============================================================
// ROOM UTILITIES
// ============================================================

const getFloor = (n) => Math.floor(parseInt(n) / 100);
const floorName = (f) => f === 1 ? "1st" : f === 2 ? "2nd" : f === 3 ? "3rd" : f + "th";

const getRoomInfo = (roomId, unitId) => {
    const r = ROOMS.find(x => x.id === roomId);
    const u = r?.units.find(x => x.id === unitId);
    return {room: r, unit: u, num: u?.n || "?"};
};

// ============================================================
// LOCAL STORAGE UTILITIES
// ============================================================

const loadStatus = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
    catch { return {}; }
};

const saveStatus = (d) => localStorage.setItem(STORAGE_KEY, JSON.stringify(d));

const loadRequests = () => {
    try { return JSON.parse(localStorage.getItem(REQUEST_KEY) || "[]"); }
    catch { return []; }
};

const saveRequests = (d) => localStorage.setItem(REQUEST_KEY, JSON.stringify(d));

const loadRoomStatuses = () => {
    try { return JSON.parse(localStorage.getItem(ROOM_STATUS_KEY) || "{}"); }
    catch { return {}; }
};

const saveRoomStatuses = (d) => localStorage.setItem(ROOM_STATUS_KEY, JSON.stringify(d));

const saveFloorStaffAssign = (d) => localStorage.setItem("miami_floor_staff_v1", JSON.stringify(d));

// Auth token management
const loadAuthToken = () => localStorage.getItem('miami_auth_token') || '';
const saveAuthToken = (token) => localStorage.setItem('miami_auth_token', token);
const loadCurrentUser = () => {
    try { return JSON.parse(localStorage.getItem('miami_current_user')); }
    catch { return null; }
};
const saveCurrentUser = (user) => localStorage.setItem('miami_current_user', JSON.stringify(user));

// ============================================================
// SESSION MANAGEMENT
// ============================================================

function isSessionValid() {
    if (!PASSWORD_ENABLED) return true;
    const session = localStorage.getItem(SESSION_KEY);
    if (!session) return false;
    const sessionTime = parseInt(session);
    const now = Date.now();
    return (now - sessionTime) < SESSION_DURATION;
}

function createSession() {
    localStorage.setItem(SESSION_KEY, Date.now().toString());
}

// ============================================================
// STAR DUST TRAIL ANIMATION
// ============================================================

let lastStardustTime = 0;
const stardustThrottle = 50; // ms between particles

function createStardust(e) {
    const now = Date.now();
    if (now - lastStardustTime < stardustThrottle) return;
    lastStardustTime = now;

    const star = document.createElement('div');
    star.className = 'stardust';
    star.style.left = (e.clientX - 4) + 'px';
    star.style.top = (e.clientY - 4) + 'px';
    document.body.appendChild(star);

    setTimeout(() => star.remove(), 1000);
}
