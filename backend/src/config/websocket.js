const WebSocket = require('ws');
const logger = require('../utils/logger');
const { convertBigIntToString } = require('../utils/converters');
const { fetchAllGroupsAndFiles } = require('../services/dashboard');

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', async (ws) => {
    logger.info('[DEBUG] New WebSocket connection established');
    ws.isAlive = true;
    
    ws.on('pong', () => { ws.isAlive = true; });
    ws.on('error', (error) => {
      logger.error('[DEBUG] WebSocket error:', error);
    });

    await sendInitialData(ws);
  });

  setupPingPong(wss);
  return wss;
}

function setupPingPong(wss) {
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        logger.info('[DEBUG] Terminating inactive WebSocket connection');
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });
}

async function sendInitialData(ws) {
  try {
    const rawData = await fetchAllGroupsAndFiles();
    const convertedData = convertBigIntToString(rawData);
    const message = {
      type: 'initialData',
      data: convertedData
    };
    
    logger.info('[DEBUG] Sending initial data');
    ws.send(JSON.stringify(message));
  } catch (error) {
    logger.error('[DEBUG] Error sending initial data:', error);
  }
}

async function broadcastUpdate(wss) {
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
  } catch (error) {
    logger.error('[DEBUG] Error broadcasting update:', error);
  }
}

module.exports = {
  setupWebSocket,
  broadcastUpdate
};