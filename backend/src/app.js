require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const { PinataSDK } = require('pinata-web3');
const { debug, error } = require('./utils/logger');
const { convertBigIntToString } = require('./utils/converters');
const { fetchAllGroupsAndFiles } = require('./services/dashboard.service');
const { connectDB } = require('./config/database');
const { initializeBlockchain } = require('./config/blockchain');

// Initialize express app
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize Pinata
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: 'lavender-tropical-harrier-912.mypinata.cloud',
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Global dashboard data cache
let dashboardData = [];

async function initializeDashboard() {
  try {
    debug('[DEBUG] Initializing dashboard data');
    dashboardData = await fetchAllGroupsAndFiles();
    debug('[DEBUG] Dashboard data initialized');
    return dashboardData;
  } catch (error) {
    error('[DEBUG] Error initializing dashboard data:', error);
    return [];
  }
}

// WebSocket setup
const setupWebSocket = () => {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', handleWebSocketConnection);

  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        debug('Terminating inactive WebSocket connection');
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => clearInterval(interval));

  return wss;
};

const handleWebSocketConnection = async (ws) => {
  debug('New WebSocket connection established');
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('error', (err) => error('WebSocket error:', err));
  await sendInitialData(ws);
};

async function sendInitialData(ws) {
  try {
    const rawData = await fetchAllGroupsAndFiles();
    const convertedData = convertBigIntToString(rawData);
    const message = {
      type: 'initialData',
      data: convertedData
    };
    ws.send(JSON.stringify(message));
  } catch (err) {
    error('[DEBUG] Error sending initial data:', err);
  }
}

async function broadcastUpdate() {
  try {
    const rawData = await fetchAllGroupsAndFiles();
    const convertedData = convertBigIntToString(rawData);
    const message = {
      type: 'update',
      data: convertedData
    };
    
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  } catch (err) {
    error('[DEBUG] Error broadcasting update:', err);
  }
}

// Import and mount routes
const uploadRoutes = require('./routes/upload.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const metadataRoutes = require('./routes/metadata.routes');

app.use('/api', uploadRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/metadata', metadataRoutes);

// Server initialization
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    debug('Starting server initialization...');
    
    // Initialize blockchain first
    await initializeBlockchain();
    debug('Blockchain initialized successfully');

    // Then connect to MongoDB
    await connectDB();
    debug('MongoDB connected successfully');

    // Setup WebSocket
    const wss = setupWebSocket();
    debug('WebSocket server initialized');

    // Start HTTP server
    server.listen(PORT, () => {
      debug(`Server running on port ${PORT}`);
    });

    // Initialize dashboard last
    await initializeDashboard();
    debug('Dashboard data initialized');

  } catch (err) {
    error('Server startup error:', err);
    process.exit(1);
  }
}

// Start server
startServer();

module.exports = {
  app,
  server,
  pinata,
  broadcastUpdate,
  dashboardData
};