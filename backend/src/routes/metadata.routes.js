const express = require('express');
const router = express.Router();
const { crashContract } = require('../config/blockchain');

// Route from your original /verify-metadata/:index endpoint
router.get('/verify-metadata/:index', async (req, res) => {
  const { index } = req.params;

  try {
    console.log(`[DEBUG] Verifying metadata for index: ${index}`);
    const metadata = await crashContract.methods.getMetadata(index).call();
    console.log(`[DEBUG] Metadata retrieved: ${JSON.stringify(metadata)}`);
    res.json(metadata);
  } catch (error) {
    console.error('[DEBUG] Error verifying metadata:', error);
    res.status(500).json({ error: 'Error verifying metadata' });
  }
});

module.exports = router;
