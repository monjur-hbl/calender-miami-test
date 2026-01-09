/**
 * WhatsApp Service using Baileys v2
 * Stores auth state in Firestore for Cloud Run persistence
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
    Browsers
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

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

// Auth directory for local file storage (ephemeral but works with Baileys)
const AUTH_DIR = '/tmp/whatsapp_auth';

/**
 * Custom auth state that backs up to Firestore
 */
async function useFirestoreBackedAuthState() {
    // Ensure local auth directory exists
    if (!fs.existsSync(AUTH_DIR)) {
        fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    // Try to restore from Firestore on startup
    try {
        const snapshot = await firestore.collection(AUTH_COLLECTION).get();
        for (const doc of snapshot.docs) {
            if (doc.id.startsWith(SESSION_ID + '_file_')) {
                const filename = doc.id.replace(SESSION_ID + '_file_', '');
                const data = doc.data();
                if (data.content) {
                    fs.writeFileSync(
                        path.join(AUTH_DIR, filename),
                        data.content
                    );
                    console.log(`Restored auth file: ${filename}`);
                }
            }
        }
    } catch (err) {
        console.log('No existing auth to restore:', err.message);
    }

    // Use Baileys built-in multi-file auth
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    // Wrap saveCreds to also backup to Firestore
    const saveCredsWithBackup = async () => {
        await saveCreds();

        // Backup all auth files to Firestore
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

        // Clear local files
        if (fs.existsSync(AUTH_DIR)) {
            const files = fs.readdirSync(AUTH_DIR);
            for (const file of files) {
                fs.unlinkSync(path.join(AUTH_DIR, file));
            }
            console.log(`Cleared ${files.length} local auth files`);
        }

        // Clear Firestore
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

        // Get latest version
        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(`Using Baileys version: ${version.join('.')}, isLatest: ${isLatest}`);

        // Get auth state
        const { state, saveCreds } = await useFirestoreBackedAuthState();

        // Create socket
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
            markOnlineOnConnect: false,
            generateHighQualityLinkPreview: false,
        });

        // Handle connection updates
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            console.log('Connection update:', JSON.stringify({
                connection,
                hasQR: !!qr,
                qrLength: qr?.length,
                lastDisconnect: lastDisconnect?.error?.message
            }));

            // Handle QR code
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
                    console.log('✅ QR code generated successfully!');
                } catch (err) {
                    console.error('QR generation error:', err.message);
                }
            }

            // Handle connection states
            if (connection === 'connecting') {
                connectionStatus = 'connecting';
                console.log('Connecting to WhatsApp...');
            }

            if (connection === 'open') {
                connectionStatus = 'connected';
                qrCode = null;
                isConnecting = false;
                reconnectAttempts = 0;

                // Get user info
                if (sock.user) {
                    connectedAs = {
                        phone: sock.user.id.split(':')[0].split('@')[0],
                        name: sock.user.name || sock.user.verifiedName || 'WhatsApp User'
                    };
                    console.log('✅ Connected as:', connectedAs.name, connectedAs.phone);
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

                    const delay = reconnectAttempts * 5000;
                    console.log(`Reconnecting in ${delay/1000}s...`);
                    setTimeout(initWhatsApp, delay);
                } else {
                    connectionStatus = 'error';
                    lastError = errorMessage || `Connection failed (code: ${statusCode})`;
                    sock = null;
                }
            }
        });

        // Save credentials when updated
        sock.ev.on('creds.update', async () => {
            console.log('Credentials updated, saving...');
            await saveCreds();
        });

        // Handle incoming messages
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return;

            for (const msg of messages) {
                if (!msg.key.fromMe && msg.message) {
                    const from = msg.key.remoteJid?.split('@')[0] || 'unknown';
                    const text = msg.message.conversation ||
                                 msg.message.extendedTextMessage?.text ||
                                 '[Media]';
                    console.log(`📩 Message from ${from}: ${text.substring(0, 50)}`);

                    // Store message in Firestore
                    try {
                        await firestore.collection('whatsapp_messages').add({
                            from,
                            text: text.substring(0, 1000),
                            timestamp: new Date().toISOString(),
                            messageId: msg.key.id,
                            read: false
                        });
                    } catch (err) {
                        console.error('Error storing message:', err.message);
                    }
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
        version: '1.2.0',
        status: connectionStatus
    });
});

// Get connection status
app.get('/status', (req, res) => {
    res.json({
        status: connectionStatus,
        qrCode: qrCode,
        connectedAs: connectedAs,
        lastError: lastError
    });
});

// Initialize/restart connection
app.post('/restart', async (req, res) => {
    try {
        console.log('Restart requested');

        // Disconnect existing socket
        if (sock) {
            try {
                sock.end();
            } catch (e) {}
            sock = null;
        }

        connectionStatus = 'initializing';
        qrCode = null;
        connectedAs = null;
        isConnecting = false;
        reconnectAttempts = 0;
        lastError = null;

        // Start new connection
        setImmediate(initWhatsApp);

        res.json({ success: true, message: 'Restarting connection...' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Logout and clear session
app.post('/logout', async (req, res) => {
    try {
        console.log('Logout requested');

        if (sock) {
            try {
                await sock.logout();
            } catch (e) {
                console.log('Logout error (expected):', e.message);
            }
            sock = null;
        }

        await clearAuthData();

        connectionStatus = 'disconnected';
        qrCode = null;
        connectedAs = null;
        isConnecting = false;
        reconnectAttempts = 0;

        res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Send message
app.post('/send', async (req, res) => {
    const { phone, message } = req.body;

    if (!phone || !message) {
        return res.status(400).json({ success: false, error: 'Phone and message required' });
    }

    if (connectionStatus !== 'connected' || !sock) {
        return res.status(400).json({ success: false, error: 'WhatsApp not connected' });
    }

    try {
        // Format phone number
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const jid = cleanPhone + '@s.whatsapp.net';

        await sock.sendMessage(jid, { text: message });
        console.log(`Message sent to ${cleanPhone}`);

        res.json({ success: true, message: 'Message sent' });
    } catch (err) {
        console.error('Send error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get recent messages
app.get('/messages', async (req, res) => {
    try {
        const snapshot = await firestore
            .collection('whatsapp_messages')
            .orderBy('timestamp', 'desc')
            .limit(50)
            .get();

        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json({ success: true, messages });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Mark message as read
app.post('/messages/:id/read', async (req, res) => {
    try {
        await firestore.collection('whatsapp_messages').doc(req.params.id).update({
            read: true
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`WhatsApp service v1.2.0 running on port ${PORT}`);
    console.log(`Project: ${PROJECT_ID}`);

    // Auto-initialize on startup
    setTimeout(initWhatsApp, 2000);
});
