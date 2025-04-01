const { getCrashContract, getDefaultAccount } = require('../config/blockchain');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

class BlockchainService {
  static async storeMetadata(data, groupCids) {
    try {
      const contract = getCrashContract();
      const dataId = new mongoose.Types.ObjectId().toString();

      const transaction = await contract.methods
        .storeMetadata(dataId, data.vinNumber, data.location, groupCids)
        .send({
          from: getDefaultAccount(),
          gas: 500000
        });

      return transaction;
    } catch (error) {
      logger.error('Blockchain storage error:', error);
      throw error;
    }
  }

  static async getMetadata(index) {
    const contract = getCrashContract();
    try {
      return await contract.methods.getMetadata(index).call();
    } catch (error) {
      logger.error('Error fetching metadata:', error);
      throw error;
    }
  }

  static async getTotalMetadataCount() {
    const contract = getCrashContract();
    try {
      return await contract.methods.getTotalMetadataCount().call();
    } catch (error) {
      logger.error('Error getting metadata count:', error);
      throw error;
    }
  }
}

module.exports = BlockchainService;