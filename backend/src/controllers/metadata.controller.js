const { getCrashContract } = require('../config/blockchain');
const logger = require('../utils/logger');

class MetadataController {
  static async verifyMetadata(req, res) {
    const { index } = req.params;

    try {
      logger.info(`[DEBUG] Verifying metadata for index: ${index}`);
      const crashContract = getCrashContract();
      const metadata = await crashContract.methods.getMetadata(index).call();
      
      logger.info(`[DEBUG] Metadata retrieved: ${JSON.stringify(metadata)}`);
      res.json(metadata);
    } catch (error) {
      logger.error('[DEBUG] Error verifying metadata:', error);
      res.status(500).json({ error: 'Error verifying metadata' });
    }
  }

  static async getMetadataCount(req, res) {
    try {
      const crashContract = getCrashContract();
      const count = await crashContract.methods.getTotalMetadataCount().call();
      res.json({ count: count.toString() });
    } catch (error) {
      logger.error('[DEBUG] Error getting metadata count:', error);
      res.status(500).json({ error: 'Error getting metadata count' });
    }
  }
}

module.exports = MetadataController;