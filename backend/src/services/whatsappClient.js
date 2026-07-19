const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

let qrCodeDataURL = null;
let isReady = false;

// Initialize the client
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './.wwebjs_auth'
    }),
    puppeteer: {
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', 
            '--disable-gpu'
        ]
    }
});

client.on('qr', async (qr) => {
    try {
        console.log('[WhatsApp Local] New QR Code generated. Awaiting scan...');
        qrCodeDataURL = await qrcode.toDataURL(qr);
        isReady = false;
    } catch (err) {
        console.error('[WhatsApp Local] Failed to generate QR data url', err);
    }
});

client.on('ready', () => {
    console.log('[WhatsApp Local] Client is ready and authenticated!');
    qrCodeDataURL = null; // Clear QR code as it's no longer needed
    isReady = true;
});

client.on('authenticated', () => {
    console.log('[WhatsApp Local] Authentication successful.');
});

client.on('auth_failure', (msg) => {
    console.error('[WhatsApp Local] Authentication failure:', msg);
    qrCodeDataURL = null;
    isReady = false;
});

client.on('disconnected', (reason) => {
    console.log('[WhatsApp Local] Client was disconnected:', reason);
    qrCodeDataURL = null;
    isReady = false;
});

// Helper functions for routes/controllers
const getStatus = () => {
    return {
        isReady,
        qrCodeDataURL
    };
};

const logout = async () => {
    try {
        await client.logout();
        isReady = false;
        qrCodeDataURL = null;
        return true;
    } catch (err) {
        console.error('[WhatsApp Local] Logout error:', err);
        return false;
    }
};

const sendMessage = async (mobile, text) => {
    if (!isReady) {
        throw new Error('Local WhatsApp client is not connected.');
    }
    // Format the number: ensure it ends with @c.us
    // Assuming mobile is a string of numbers.
    let formattedNumber = mobile.replace(/\D/g, '');
    if (!formattedNumber.endsWith('@c.us')) {
        formattedNumber = `${formattedNumber}@c.us`;
    }

    try {
        await client.sendMessage(formattedNumber, text);
        console.log(`[WhatsApp Local] Message sent to ${formattedNumber}`);
    } catch (err) {
        console.error(`[WhatsApp Local] Error sending message to ${formattedNumber}:`, err);
        throw err;
    }
};

// Start client asynchronously
client.initialize().catch(err => {
    console.error('[WhatsApp Local] Failed to initialize client:', err);
});

module.exports = {
    client,
    getStatus,
    logout,
    sendMessage
};
