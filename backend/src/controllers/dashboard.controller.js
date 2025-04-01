const { pinata } = require('../config/pinata');
const { fetchAllGroupsAndFiles } = require('../services/dashboard.service');
const logger = require('../utils/logger');

class DashboardController {
  static async getDashboardData(req, res) {
    try {
      const dashboardData = await fetchAllGroupsAndFiles();
      res.json(dashboardData || []);
    } catch (error) {
      logger.error('[DEBUG] Error serving dashboard data:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  }

  static async getGroupData(req, res) {
    const { groupId } = req.params;

    try {
      logger.info(`[DEBUG] Fetching data for group ID: ${groupId}`);
      const groupDetails = await pinata.groups.get({ groupId });
      const cids = groupDetails?.data?.cids || [];

      const groupData = await this.fetchGroupFiles(cids);

      res.json({
        groupId,
        groupName: groupDetails.data.name,
        files: groupData,
      });
    } catch (error) {
      logger.error('[DEBUG] Error fetching group data:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async fetchGroupFiles(cids) {
    return await Promise.all(cids.map(async (cid) => {
      logger.info(`[DEBUG] Fetching data for CID: ${cid}`);
      const response = await fetch(
        `https://${pinata.pinataGateway}/ipfs/${cid}`,
        { responseType: 'arraybuffer' }
      );

      return {
        cid,
        contentType: response.headers.get('content-type'),
        data: Buffer.from(await response.arrayBuffer()).toString('base64'),
      };
    }));
  }
}

module.exports = DashboardController;