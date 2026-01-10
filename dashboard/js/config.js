// Miami Beach Resort - Configuration
// v27.0-dynamic-rooms

// API Endpoints
const PROXY = "https://miami-api-1006186358018.us-central1.run.app";
const PROPERTY = 279646;
const NOTIFICATIONS_API = "https://miami-api-1006186358018.us-central1.run.app/notifications";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCwBP9GdR7ceBLFPmfHoULqGnzFhL5lUto",
    authDomain: "beds24-483408.firebaseapp.com",
    projectId: "beds24-483408",
    storageBucket: "beds24-483408.appspot.com",
    messagingSenderId: "1006186358018",
    appId: "1:1006186358018:web:realtime"
};

// Bangladesh Timezone (GMT+6) - All date/time operations use this
const BD_TIMEZONE = 'Asia/Dhaka';

// Room Configuration - Fixed room inventory
const ROOMS = [
    {id:583459, name:"Royal Sea View Couple", short:"Royal Sea View", max:2, units:[{id:1,n:"601"},{id:2,n:"602"},{id:3,n:"603"},{id:4,n:"604"}]},
    {id:583466, name:"Premium Sea View Couple", short:"Premium Sea View", max:2, units:[{id:1,n:"401"},{id:2,n:"404"},{id:3,n:"501"},{id:4,n:"504"}]},
    {id:583467, name:"Deluxe Bay View Couple", short:"Deluxe Bay View", max:2, units:[{id:1,n:"402"},{id:2,n:"403"},{id:3,n:"502"},{id:4,n:"503"}]},
    {id:583468, name:"Deluxe Hill View Couple", short:"Deluxe Hill View", max:2, units:[{id:1,n:"201"},{id:2,n:"204"},{id:3,n:"207"},{id:4,n:"301"},{id:5,n:"304"},{id:6,n:"307"},{id:7,n:"407"},{id:8,n:"507"}]},
    {id:583469, name:"Deluxe Urban View Couple", short:"Deluxe Urban View", max:2, units:[{id:1,n:"101"},{id:2,n:"102"},{id:3,n:"103"},{id:4,n:"104"},{id:5,n:"107"},{id:6,n:"202"},{id:7,n:"203"},{id:8,n:"302"},{id:9,n:"303"}]},
    {id:583470, name:"Premium Sea View Family", short:"Premium Sea Family", max:4, units:[{id:1,n:"405"},{id:2,n:"406"},{id:3,n:"408"},{id:4,n:"505"},{id:5,n:"506"},{id:6,n:"508"},{id:7,n:"606"}]},
    {id:583471, name:"Deluxe Hill View Family", short:"Deluxe Hill Family", max:4, units:[{id:1,n:"205"},{id:2,n:"206"},{id:3,n:"208"},{id:4,n:"305"},{id:5,n:"306"},{id:6,n:"308"}]},
    {id:583472, name:"Deluxe Urban View Family", short:"Deluxe Urban Family", max:4, units:[{id:1,n:"105"},{id:2,n:"106"},{id:3,n:"108"}]}
];

// Floor Configuration
const FLOORS = [1, 2, 3, 4, 5, 6];

// Room Status Options
const ROOM_STATUS_OPTIONS = [
    {key: "Clean", label: "✨ Clean", color: "#22c55e", bg: "rgba(34,197,94,0.15)", border: "rgba(34,197,94,0.4)"},
    {key: "Dirty", label: "🧹 Dirty", color: "#f97316", bg: "rgba(249,115,22,0.15)", border: "rgba(249,115,22,0.4)"},
    {key: "Ready", label: "🔑 Ready to Check-In", color: "#2D6A6A", bg: "rgba(45,106,106,0.15)", border: "rgba(45,106,106,0.4)"},
    {key: "DND", label: "🚫 Do Not Disturb", color: "#a855f7", bg: "rgba(168,85,247,0.15)", border: "rgba(168,85,247,0.4)"},
    {key: "Inspection", label: "🔍 Inspection Required", color: "#eab308", bg: "rgba(234,179,8,0.15)", border: "rgba(234,179,8,0.4)"},
    {key: "Maintenance", label: "🔧 Maintenance", color: "#ef4444", bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.4)"},
    {key: "Repair", label: "🛠️ Under Repair", color: "#dc2626", bg: "rgba(220,38,38,0.15)", border: "rgba(220,38,38,0.4)"},
    {key: "NoService", label: "⛔ No Service", color: "#6b7280", bg: "rgba(107,114,128,0.15)", border: "rgba(107,114,128,0.4)"}
];

// Request Types
const REQUEST_TYPES = ["Room Service", "Water Bottle", "Room Clean", "Towel Request", "Bedsheet Change", "Toiletries", "Extra Pillow", "AC/Heating Issue", "Maintenance", "Other"];

// Storage Keys
const STORAGE_KEY = "miami_checkin_v2";
const REQUEST_KEY = "miami_requests_v2";
const ROOM_STATUS_KEY = "miami_room_status_v1";

// Password Protection Configuration
const PASSWORD_ENABLED = true;
const PASSWORD = "110248";
const SESSION_DURATION = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
const SESSION_KEY = "miami_dashboard_session";
