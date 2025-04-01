// src/routes/upload.routes.js
const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload.middleware');
const uploadController = require('../controllers/upload.controller');

// Route from your original /api/upload-and-process endpoint
router.post('/upload-and-process', 
  upload.single('file'), 
  uploadController.processUpload
);

module.exports = router;