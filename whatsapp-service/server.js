/**
 * WhatsApp Service v1.4.0 - Full Features
 * - Send/receive text and media messages
 * - Group messaging
 * - Read receipts
 * - Location sharing
 * - Status/stories viewing
 */

const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const { Firestore } = require('@google-cloud/firestore');
const makeWASocket = require('@whiskeysockets/baileys').default;
const {
    DisconnectReason,
    useMultiFileAuthState,
    makeCacheableSignalKeyStore,
    fetchLatestBaileysVersion,
    Browsers,
    downloadMediaMessage,
    getContentType
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 8080;
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'beds24-483408';

// Initialize Firestore
const firestore = new Firestore({ projectId: PROJECT_ID });
const AUTH_COLLECTION = 'whatsapp_auth';
const SESSION_ID = 'main_session';

// Logger
const logger = pino({ level: 'warn' });

// Global state
let sock = null;
let qrCode = null;
let connectionStatus = 'disconnected';
let connectedAs = null;
let lastError = null;
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

// In-memory stores
let inMemoryMessages = [];  // All messages (sent + received)
let inMemoryChats = {};     // Chat metadata by JID
let inMemoryGroups = [];    // Group list
let inMemoryStatuses = [];  // Status updates

// Auth directory
const AUTH_DIR = '/tmp/whatsapp_auth';
const MEDIA_DIR = '/tmp/whatsapp_media';

// Ensure directories exist
if (!fs.existsSync(MEDIA_DIR)) {
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

/**
 * Custom auth state that backs up to Firestore
 */
async function useFirestoreBackedAuthState() {
    if (!fs.existsSync(AUTH_DIR)) {
        fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    try {
        const snapshot = await firestore.collection(AUTH_COLLECTION).get();
        for (const doc of snapshot.docs) {
            if (doc.id.startsWith(SESSION_ID + '_file_')) {
                const filename = doc.id.replace(SESSION_ID + '_file_', '');
                const data = doc.data();
                if (data.content) {
                    fs.writeFileSync(path.join(AUTH_DIR, filename), data.content);
                    console.log(`Restored auth file: ${filename}`);
                }
            }
        }
    } catch (err) {
        console.log('No existing auth to restore:', err.message);
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    const saveCredsWithBackup = async () => {
        await saveCreds();
        try {
            const files = fs.readdirSync(AUTH_DIR);
            for (const file of files) {
                const content = fs.readFileSync(path.join(AUTH_DIR, file), 'utf-8');
                await firestore.collection(AUTH_COLLECTION).doc(`${SESSION_ID}_file_${file}`).set({
                    content,
                    updatedAt: new Date().toISOString()
                });
            }
            console.log('Auth backed up to Firestore');
        } catch (err) {
            console.error('Firestore backup error:', err.message);
        }
    };

    return { state, saveCreds: saveCredsWithBackup };
}

/**
 * Clear all auth data
 */
async function clearAuthData() {
    try {
        console.log('Clearing auth data...');
        if (fs.existsSync(AUTH_DIR)) {
            const files = fs.readdirSync(AUTH_DIR);
            for (const file of files) {
                fs.unlinkSync(path.join(AUTH_DIR, file));
            }
            console.log(`Cleared ${files.length} local auth files`);
        }

        const snapshot = await firestore.collection(AUTH_COLLECTION).get();
        const batch = firestore.batch();
        let count = 0;
        for (const doc of snapshot.docs) {
            if (doc.id.startsWith(SESSION_ID)) {
                batch.delete(doc.ref);
                count++;
            }
        }
        if (count > 0) {
            await batch.commit();
            console.log(`Cleared ${count} Firestore auth documents`);
        }
    } catch (err) {
        console.error('Error clearing auth:', err.message);
    }
}

/**
 * Extract message content from WhatsApp message
 */
function extractMessageContent(msg) {
    const message = msg.message;
    if (!message) return { type: 'unknown', text: '' };

    const contentType = getContentType(message);

    switch (contentType) {
        case 'conversation':
            return { type: 'text', text: message.conversation };
        case 'extendedTextMessage':
            return { type: 'text', text: message.extendedTextMessage?.text || '' };
        case 'imageMessage':
            return {
                type: 'image',
                text: message.imageMessage?.caption || '[Image]',
                mimetype: message.imageMessage?.mimetype,
                hasMedia: true
            };
        case 'videoMessage':
            return {
                type: 'video',
                text: message.videoMessage?.caption || '[Video]',
                mimetype: message.videoMessage?.mimetype,
                hasMedia: true
            };
        case 'audioMessage':
            return {
                type: 'audio',
                text: '[Audio]',
                mimetype: message.audioMessage?.mimetype,
                seconds: message.audioMessage?.seconds,
                hasMedia: true
            };
        case 'documentMessage':
            return {
                type: 'document',
                text: message.documentMessage?.fileName || '[Document]',
                mimetype: message.documentMessage?.mimetype,
                hasMedia: true
            };
        case 'locationMessage':
            return {
                type: 'location',
                text: `[Location: ${message.locationMessage?.degreesLatitude}, ${message.locationMessage?.degreesLongitude}]`,
                latitude: message.locationMessage?.degreesLatitude,
                longitude: message.locationMessage?.degreesLongitude,
                name: message.locationMessage?.name,
                address: message.locationMessage?.address
            };
        case 'contactMessage':
            return { type: 'contact', text: `[Contact: ${message.contactMessage?.displayName}]` };
        case 'stickerMessage':
            return { type: 'sticker', text: '[Sticker]', hasMedia: true };
        default:
            return { type: contentType || 'unknown', text: `[${contentType || 'Unknown'}]` };
    }
}

/**
 * Store message in memory
 */
function storeMessage(msgData) {
    inMemoryMessages.unshift(msgData);
    if (inMemoryMessages.length > 500) {
        inMemoryMessages = inMemoryMessages.slice(0, 500);
    }

    // Update chat metadata
    const chatJid = msgData.chatJid || msgData.from;
    if (!inMemoryChats[chatJid]) {
        inMemoryChats[chatJid] = {
            jid: chatJid,
            name: msgData.chatName || msgData.from,
            isGroup: msgData.isGroup || false,
            lastMessage: msgData.text,
            lastMessageTime: msgData.timestamp,
            unreadCount: msgData.fromMe ? 0 : 1
        };
    } else {
        inMemoryChats[chatJid].lastMessage = msgData.text;
        inMemoryChats[chatJid].lastMessageTime = msgData.timestamp;
        if (!msgData.fromMe) {
            inMemoryChats[chatJid].unreadCount = (inMemoryChats[chatJid].unreadCount || 0) + 1;
        }
    }

    console.log(`✅ Message stored (total: ${inMemoryMessages.length})`);
}

/**
 * Initialize WhatsApp connection
 */
async function initWhatsApp() {
    if (isConnecting) {
        console.log('Already connecting, skipping...');
        return;
    }

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.log('Max reconnect attempts reached.');
        connectionStatus = 'error';
        lastError = 'Connection failed. Click Restart to try again.';
        return;
    }

    isConnecting = true;
    connectionStatus = 'initializing';
    qrCode = null;
    lastError = null;

    try {
        console.log(`Initializing WhatsApp... (attempt ${reconnectAttempts + 1})`);

        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(`Using Baileys version: ${version.join('.')}, isLatest: ${isLatest}`);

        const { state, saveCreds } = await useFirestoreBackedAuthState();

        sock = makeWASocket({
            version,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger)
            },
            logger,
            browser: Browsers.ubuntu('Chrome'),
            connectTimeoutMs: 120000,
            defaultQueryTimeoutMs: 60000,
            keepAliveIntervalMs: 30000,
            retryRequestDelayMs: 500,
            emitOwnEvents: true,
            syncFullHistory: false,
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
        });

        // Handle connection updates
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            console.log('Connection update:', JSON.stringify({
                connection,
                hasQR: !!qr,
                lastDisconnect: lastDisconnect?.error?.message
            }));

            if (qr) {
                try {
                    qrCode = await QRCode.toDataURL(qr, {
                        width: 256,
                        margin: 2,
                        color: { dark: '#000000', light: '#ffffff' }
                    });
                    connectionStatus = 'qr_ready';
                    reconnectAttempts = 0;
                    isConnecting = false;
                    console.log('✅ QR code generated!');
                } catch (err) {
                    console.error('QR generation error:', err.message);
                }
            }

            if (connection === 'connecting') {
                connectionStatus = 'connecting';
                console.log('Connecting to WhatsApp...');
            }

            if (connection === 'open') {
                connectionStatus = 'connected';
                qrCode = null;
                isConnecting = false;
                reconnectAttempts = 0;

                if (sock.user) {
                    connectedAs = {
                        phone: sock.user.id.split(':')[0].split('@')[0],
                        name: sock.user.name || sock.user.verifiedName || 'WhatsApp User',
                        jid: sock.user.id
                    };
                    console.log('✅ Connected as:', connectedAs.name, connectedAs.phone);
                }

                // Fetch groups
                try {
                    const groups = await sock.groupFetchAllParticipating();
                    inMemoryGroups = Object.values(groups).map(g => ({
                        jid: g.id,
                        name: g.subject,
                        participants: g.participants?.length || 0,
                        isAdmin: g.participants?.some(p => p.id === sock.user?.id && (p.admin === 'admin' || p.admin === 'superadmin'))
                    }));
                    console.log(`✅ Loaded ${inMemoryGroups.length} groups`);
                } catch (err) {
                    console.log('Could not fetch groups:', err.message);
                }
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const errorMessage = lastDisconnect?.error?.message;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

                console.log(`Connection closed. Status: ${statusCode}, Error: ${errorMessage}`);
                isConnecting = false;

                if (statusCode === DisconnectReason.loggedOut) {
                    connectionStatus = 'disconnected';
                    connectedAs = null;
                    qrCode = null;
                    sock = null;
                    await clearAuthData();
                    console.log('Logged out - session cleared');
                } else if (statusCode === DisconnectReason.restartRequired) {
                    console.log('Restart required, reconnecting...');
                    sock = null;
                    setTimeout(initWhatsApp, 2000);
                } else if (shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttempts++;
                    connectionStatus = 'reconnecting';
                    lastError = `Reconnecting... (attempt ${reconnectAttempts})`;
                    sock = null;
                    setTimeout(initWhatsApp, reconnectAttempts * 5000);
                } else {
                    connectionStatus = 'error';
                    lastError = errorMessage || `Connection failed (code: ${statusCode})`;
                    sock = null;
                }
            }
        });

        // Save credentials
        sock.ev.on('creds.update', saveCreds);

        // Handle ALL messages (sent and received)
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            for (const msg of messages) {
                if (!msg.message) continue;

                const isGroup = msg.key.remoteJid?.endsWith('@g.us');
                const chatJid = msg.key.remoteJid;
                const from = isGroup
                    ? msg.key.participant?.split('@')[0]
                    : msg.key.remoteJid?.split('@')[0];

                const content = extractMessageContent(msg);

                const msgData = {
                    id: msg.key.id || Date.now().toString(),
                    chatJid,
                    from,
                    fromMe: msg.key.fromMe || false,
                    isGroup,
                    chatName: isGroup ? (inMemoryGroups.find(g => g.jid === chatJid)?.name || chatJid) : from,
                    senderName: msg.pushName || from,
                    type: content.type,
                    text: content.text,
                    hasMedia: content.hasMedia || false,
                    mediaData: content.hasMedia ? {
                        mimetype: content.mimetype,
                        seconds: content.seconds
                    } : null,
                    location: content.type === 'location' ? {
                        latitude: content.latitude,
                        longitude: content.longitude,
                        name: content.name,
                        address: content.address
                    } : null,
                    timestamp: new Date(msg.messageTimestamp * 1000 || Date.now()).toISOString(),
                    read: msg.key.fromMe
                };

                if (msg.key.fromMe) {
                    console.log(`📤 Sent to ${from}: ${content.text.substring(0, 50)}`);
                } else {
                    console.log(`📩 From ${from}: ${content.text.substring(0, 50)}`);
                }

                storeMessage(msgData);
            }
        });

        // Handle message read receipts
        sock.ev.on('messages.update', async (updates) => {
            for (const update of updates) {
                if (update.update?.status) {
                    const status = update.update.status;
                    // 2 = delivered, 3 = read, 4 = played (for audio)
                    const msg = inMemoryMessages.find(m => m.id === update.key.id);
                    if (msg) {
                        msg.deliveryStatus = status;
                        if (status >= 3) msg.read = true;
                        console.log(`📬 Message ${update.key.id} status: ${status}`);
                    }
                }
            }
        });

        // Handle status/stories updates
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            for (const msg of messages) {
                if (msg.key.remoteJid === 'status@broadcast') {
                    const from = msg.key.participant?.split('@')[0] || 'unknown';
                    const content = extractMessageContent(msg);

                    inMemoryStatuses.unshift({
                        id: msg.key.id,
                        from,
                        fromName: msg.pushName || from,
                        type: content.type,
                        text: content.text,
                        timestamp: new Date().toISOString()
                    });

                    if (inMemoryStatuses.length > 100) {
                        inMemoryStatuses = inMemoryStatuses.slice(0, 100);
                    }

                    console.log(`📊 Status from ${from}: ${content.type}`);
                }
            }
        });

        // Handle group updates
        sock.ev.on('groups.update', async (updates) => {
            for (const update of updates) {
                const idx = inMemoryGroups.findIndex(g => g.jid === update.id);
                if (idx >= 0 && update.subject) {
                    inMemoryGroups[idx].name = update.subject;
                }
            }
        });

    } catch (err) {
        console.error('Init error:', err);
        lastError = err.message;
        connectionStatus = 'error';
        isConnecting = false;
        sock = null;

        reconnectAttempts++;
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            setTimeout(initWhatsApp, 5000);
        }
    }
}

// ============== API ENDPOINTS ==============

// Health check
app.get('/', (req, res) => {
    res.json({
        service: 'whatsapp-service',
        version: '1.4.0',
        status: connectionStatus,
        features: ['text', 'media', 'groups', 'location', 'read-receipts', 'status']
    });
});

// Get connection status
app.get('/status', (req, res) => {
    res.json({
        status: connectionStatus,
        qrCode: qrCode,
        connectedAs: connectedAs,
        lastError: lastError,
        stats: {
            messages: inMemoryMessages.length,
            chats: Object.keys(inMemoryChats).length,
            groups: inMemoryGroups.length
        }
    });
});

// Restart connection
app.post('/restart', async (req, res) => {
    try {
        console.log('Restart requested');
        if (sock) {
            try { sock.end(); } catch (e) {}
            sock = null;
        }

        connectionStatus = 'initializing';
        qrCode = null;
        connectedAs = null;
        isConnecting = false;
        reconnectAttempts = 0;
        lastError = null;

        setImmediate(initWhatsApp);
        res.json({ success: true, message: 'Restarting connection...' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Logout
app.post('/logout', async (req, res) => {
    try {
        console.log('Logout requested');
        if (sock) {
            try { await sock.logout(); } catch (e) {}
            sock = null;
        }

        await clearAuthData();
        connectionStatus = 'disconnected';
        qrCode = null;
        connectedAs = null;
        isConnecting = false;
        reconnectAttempts = 0;
        inMemoryMessages = [];
        inMemoryChats = {};
        inMemoryGroups = [];

        res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Send text message
app.post('/send', async (req, res) => {
    const { phone, message, groupJid } = req.body;

    if ((!phone && !groupJid) || !message) {
        return res.status(400).json({ success: false, error: 'Phone/groupJid and message required' });
    }

    if (connectionStatus !== 'connected' || !sock) {
        return res.status(400).json({ success: false, error: 'WhatsApp not connected' });
    }

    try {
        let jid;
        if (groupJid) {
            jid = groupJid;
        } else {
            const cleanPhone = phone.replace(/[^0-9]/g, '');
            jid = cleanPhone + '@s.whatsapp.net';
        }

        const result = await sock.sendMessage(jid, { text: message });
        console.log(`📤 Message sent to ${jid}`);

        // Store sent message
        const msgData = {
            id: result.key.id,
            chatJid: jid,
            from: connectedAs?.phone,
            fromMe: true,
            isGroup: jid.endsWith('@g.us'),
            text: message,
            type: 'text',
            timestamp: new Date().toISOString(),
            read: true
        };
        storeMessage(msgData);

        res.json({ success: true, messageId: result.key.id });
    } catch (err) {
        console.error('Send error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Send media (image, document, audio, video)
app.post('/send-media', async (req, res) => {
    const { phone, groupJid, mediaUrl, mediaBase64, mimetype, caption, filename, type } = req.body;

    if ((!phone && !groupJid) || (!mediaUrl && !mediaBase64)) {
        return res.status(400).json({ success: false, error: 'Phone/groupJid and media required' });
    }

    if (connectionStatus !== 'connected' || !sock) {
        return res.status(400).json({ success: false, error: 'WhatsApp not connected' });
    }

    try {
        let jid = groupJid || (phone.replace(/[^0-9]/g, '') + '@s.whatsapp.net');

        let messageContent;
        const mediaSource = mediaBase64 ? Buffer.from(mediaBase64, 'base64') : { url: mediaUrl };

        switch (type || 'image') {
            case 'image':
                messageContent = { image: mediaSource, caption: caption || '' };
                break;
            case 'video':
                messageContent = { video: mediaSource, caption: caption || '' };
                break;
            case 'audio':
                messageContent = { audio: mediaSource, mimetype: mimetype || 'audio/mp4' };
                break;
            case 'document':
                messageContent = {
                    document: mediaSource,
                    mimetype: mimetype || 'application/octet-stream',
                    fileName: filename || 'document'
                };
                break;
            default:
                messageContent = { image: mediaSource, caption: caption || '' };
        }

        const result = await sock.sendMessage(jid, messageContent);
        console.log(`📤 Media sent to ${jid}: ${type}`);

        res.json({ success: true, messageId: result.key.id });
    } catch (err) {
        console.error('Send media error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Send location
app.post('/send-location', async (req, res) => {
    const { phone, groupJid, latitude, longitude, name, address } = req.body;

    if ((!phone && !groupJid) || !latitude || !longitude) {
        return res.status(400).json({ success: false, error: 'Phone/groupJid and coordinates required' });
    }

    if (connectionStatus !== 'connected' || !sock) {
        return res.status(400).json({ success: false, error: 'WhatsApp not connected' });
    }

    try {
        let jid = groupJid || (phone.replace(/[^0-9]/g, '') + '@s.whatsapp.net');

        const result = await sock.sendMessage(jid, {
            location: {
                degreesLatitude: parseFloat(latitude),
                degreesLongitude: parseFloat(longitude),
                name: name || '',
                address: address || ''
            }
        });

        console.log(`📍 Location sent to ${jid}`);
        res.json({ success: true, messageId: result.key.id });
    } catch (err) {
        console.error('Send location error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Mark messages as read (send read receipt)
app.post('/read', async (req, res) => {
    const { chatJid, messageIds } = req.body;

    if (!chatJid || !messageIds?.length) {
        return res.status(400).json({ success: false, error: 'chatJid and messageIds required' });
    }

    if (connectionStatus !== 'connected' || !sock) {
        return res.status(400).json({ success: false, error: 'WhatsApp not connected' });
    }

    try {
        const keys = messageIds.map(id => ({
            remoteJid: chatJid,
            id: id,
            participant: chatJid.endsWith('@g.us') ? undefined : undefined
        }));

        await sock.readMessages(keys);

        // Update local state
        for (const id of messageIds) {
            const msg = inMemoryMessages.find(m => m.id === id);
            if (msg) msg.read = true;
        }

        if (inMemoryChats[chatJid]) {
            inMemoryChats[chatJid].unreadCount = 0;
        }

        console.log(`✅ Marked ${messageIds.length} messages as read in ${chatJid}`);
        res.json({ success: true });
    } catch (err) {
        console.error('Read error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get all messages (with optional filters)
app.get('/messages', (req, res) => {
    const { chatJid, limit = 100, includeMedia = false } = req.query;

    let messages = inMemoryMessages;

    if (chatJid) {
        messages = messages.filter(m => m.chatJid === chatJid);
    }

    messages = messages.slice(0, parseInt(limit));

    res.json({ success: true, messages });
});

// Get chat list
app.get('/chats', (req, res) => {
    const chats = Object.values(inMemoryChats)
        .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

    res.json({ success: true, chats });
});

// Get groups
app.get('/groups', (req, res) => {
    res.json({ success: true, groups: inMemoryGroups });
});

// Get status/stories
app.get('/statuses', (req, res) => {
    res.json({ success: true, statuses: inMemoryStatuses });
});

// Get single message by ID
app.get('/messages/:id', (req, res) => {
    const msg = inMemoryMessages.find(m => m.id === req.params.id);
    if (!msg) {
        return res.status(404).json({ success: false, error: 'Message not found' });
    }
    res.json({ success: true, message: msg });
});

// Mark single message as read (in memory)
app.post('/messages/:id/read', (req, res) => {
    const msg = inMemoryMessages.find(m => m.id === req.params.id);
    if (msg) {
        msg.read = true;
    }
    res.json({ success: true });
});

// Check if number is on WhatsApp
app.get('/check/:phone', async (req, res) => {
    if (connectionStatus !== 'connected' || !sock) {
        return res.status(400).json({ success: false, error: 'WhatsApp not connected' });
    }

    try {
        const cleanPhone = req.params.phone.replace(/[^0-9]/g, '');
        const jid = cleanPhone + '@s.whatsapp.net';
        const [result] = await sock.onWhatsApp(jid);

        res.json({
            success: true,
            exists: result?.exists || false,
            jid: result?.jid
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get profile picture
app.get('/profile-pic/:jid', async (req, res) => {
    if (connectionStatus !== 'connected' || !sock) {
        return res.status(400).json({ success: false, error: 'WhatsApp not connected' });
    }

    try {
        const url = await sock.profilePictureUrl(req.params.jid, 'image');
        res.json({ success: true, url });
    } catch (err) {
        res.json({ success: true, url: null }); // No profile pic is not an error
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`WhatsApp service v1.4.0 running on port ${PORT}`);
    console.log(`Project: ${PROJECT_ID}`);
    console.log('Features: text, media, groups, location, read-receipts, status');
    setTimeout(initWhatsApp, 2000);
});
