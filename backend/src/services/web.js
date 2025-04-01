const WebSocket = require('ws');
const logger = require('../utils/logger');
const { convertBigIntToString } = require('../utils/converters');
const { fetchAllGroupsAndFiles } = require('./dashboard.service');

class WebSocketService {
  static wss = null;

  static initialize(server) {
    this.wss = new WebSocket.Server({ server });
    
    this.wss.on('connection', (ws) => {
      logger.info('New WebSocket connection established');
      ws.isAlive = true;
      
      ws.on('pong', () => { ws.isAlive = true; });
      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
      });

      this.sendInitialData(ws);
    });

    // Keep connections alive with ping/pong
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }

  static async sendInitialData(ws) {
    try {
      const rawData = await fetchAllGroupsAndFiles();
      const convertedData = convertBigIntToString(rawData);
      ws.send(JSON.stringify({
        type: 'initialData',
        data: convertedData
      }));
    } catch (error) {
      logger.error('Error sending initial data:', error);
    }
  }

  static async broadcastUpdate() {
    try {
      const rawData = await fetchAllGroupsAndFiles();
      const convertedData = convertBigIntToString(rawData);
      const message = JSON.stringify({
        type: 'update',
        data: convertedData
      });

      this.wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    } catch (error) {
      logger.error('Error broadcasting update:', error);
    }
  }
}

module.exports = WebSocketService;