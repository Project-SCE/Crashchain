const PDFService = require('../services/pdf.service');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { pinata } = require('../config/pinata');
const { getCrashContract, getDefaultAccount } = require('../config/blockchain');

class UploadController {
  constructor() {
    // Bind methods to ensure correct 'this' context
    this.processUpload = this.processUpload.bind(this);
  }

  // Main upload processing method
  async processUpload(req, res) {
    try {
      // Validate request
      if (!this.validateRequest(req)) {
        logger.error('[DEBUG] Missing required fields');
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Create a Pinata group for this upload
      logger.info('[DEBUG] Creating Pinata group');
      const group = await this.createPinataGroup();
      
      const groupCids = [];

      // Handle uploaded file if present
      if (req.file) {
        const fileCid = await this.uploadFileToPinata(req.file);
        groupCids.push(fileCid);
      }

      // Generate and upload PDF
      const pdfCid = await this.generateAndUploadPDF(req.body);
      groupCids.push(pdfCid);

      // Add CIDs to the Pinata group
      await this.addCidsToGroup(group.id, groupCids);

      // Store metadata in blockchain
      const blockchainResult = await this.storeInBlockchain(req.body, groupCids);

      // Prepare and send response
      res.json({
        message: 'Upload successful',
        groupId: group.id,
        files: groupCids.map(cid => ({
          cid,
          url: `https://${process.env.GATEWAY_URL}/ipfs/${cid}`
        })),
        blockchainTransaction: blockchainResult?.transactionHash
      });
    } catch (error) {
      logger.error('[DEBUG] Upload error:', error);
      res.status(500).json({ 
        error: 'Error processing upload', 
        details: error.message 
      });
    }
  }

  // Validate request fields
  validateRequest(req) {
    const required = ['vinNumber', 'location', 'impactSeverity', 'throttlePosition', 'brakePosition'];
    
    // Added null check for req.body
    if (!req.body) {
      logger.error('[DEBUG] req.body is undefined');
      return false;
    }

    return required.every(field => 
      req.body[field] !== undefined && 
      req.body[field] !== null && 
      req.body[field] !== ''
    );
  }

  // Create Pinata group
  async createPinataGroup() {
    return await axios.post(
      'https://api.pinata.cloud/groups',
      { name: `Crash-Report-${Date.now()}` },
      {
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
          'Content-Type': 'application/json'
        }
      }
    ).then(response => response.data);
  }

  // Upload file to Pinata
  async uploadFileToPinata(file) {
    logger.info('[DEBUG] Processing uploaded file');
    
    const formData = new FormData();
    formData.append('file', file.buffer, file.originalname);

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
          ...formData.getHeaders()
        },
        maxBodyLength: Infinity
      }
    );

    return response.data.IpfsHash;
  }

  // Generate and upload PDF
  async generateAndUploadPDF(data) {
    const pdfPath = await PDFService.generatePDF(data);
    const formData = new FormData();
    formData.append('file', fs.createReadStream(pdfPath));

    try {
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            Authorization: `Bearer ${process.env.PINATA_JWT}`,
            ...formData.getHeaders()
          },
          maxBodyLength: Infinity
        }
      );

      return response.data.IpfsHash;
    } finally {
      // Clean up the PDF file
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }
    }
  }

  // Add CIDs to Pinata group
  async addCidsToGroup(groupId, cids) {
    return await axios.post(
      `https://api.pinata.cloud/groups/${groupId}/cids`,
      { cids },
      {
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  // Store metadata in blockchain
  async storeInBlockchain(data, groupCids) {
    try {
      const crashContract = getCrashContract();
      const dataId = new mongoose.Types.ObjectId().toString();
      
      const transaction = await crashContract.methods.storeMetadata(
        dataId,
        data.vinNumber,
        data.location,
        groupCids
      ).send({
        from: getDefaultAccount(),
        gas: 500000
      });
      
      logger.info('[DEBUG] Blockchain transaction successful:', transaction.transactionHash);
      return transaction;
    } catch (error) {
      logger.error('[DEBUG] Error storing metadata in blockchain:', error);
      // Consider whether you want to throw or just log the error
      return null;
    }
  }
}

// Alternative approach: Use class method directly
module.exports = new UploadController();