const express = require('express');
const router = express.Router();

const uploadRoutes = require('./upload.routes');
const dashboardRoutes = require('./dashboard.routes');
const metadataRoutes = require('./metadata.routes');

// Mount routes with their original paths
router.use('/upload-and-process', uploadRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/metadata', metadataRoutes);

module.exports = router;