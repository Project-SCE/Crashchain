const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');

// Route from your original /api/dashboard-data endpoint
router.get('/api/dashboard-data', async (req, res) => {
  try {
    if (!dashboardData || dashboardData.length === 0) {
      dashboardData = await fetchAllGroupsAndFiles();
    }
    res.json(dashboardData || []);
  } catch (error) {
    console.error('[DEBUG] Error serving dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Route from your original /api/fetch-group-data/:groupId endpoint
router.get('/api/fetch-group-data/:groupId', async (req, res) => {
  const { groupId } = req.params;

  try {
    console.log(`[DEBUG] Fetching data for group ID: ${groupId}`);
    const groupDetails = await pinata.groups.get({ groupId });
    const cids = groupDetails?.data?.cids || [];

    const fetchCidData = async (cid) => {
      console.log(`[DEBUG] Fetching data for CID: ${cid}`);
      const response = await axios.get(
        `https://${pinata.pinataGateway}/ipfs/${cid}`,
        { responseType: 'arraybuffer' }
      );
      return {
        cid,
        contentType: response.headers['content-type'],
        data: Buffer.from(response.data).toString('base64'),
      };
    };

    const groupData = await Promise.all(cids.map(fetchCidData));

    res.json({
      groupId,
      groupName: groupDetails.data.name,
      files: groupData,
    });
  } catch (error) {
    console.error('[DEBUG] Error fetching group data:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;