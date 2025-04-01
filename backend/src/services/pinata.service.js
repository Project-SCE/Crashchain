const FormData = require('form-data');
const fs = require('fs');
const logger = require('../utils/logger');
const { pinata } = require('../config/pinata');

class PinataService {
  static async uploadToIPFS(file, pdfPath) {
    try {
      const group = await this.createGroup();
      const groupCids = [];

      if (file) {
        const fileHash = await this.uploadFile(file);
        groupCids.push(fileHash);
      }

      const pdfHash = await this.uploadPDF(pdfPath);
      groupCids.push(pdfHash);

      await this.addToGroup(groupCids, group.id);

      return { groupId: group.id, groupCids };
    } catch (error) {
      logger.error('IPFS upload error:', error);
      throw error;
    } finally {
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }
    }
  }

  static async createGroup() {
    return await pinata.groups.create({
      name: `Crash-Report-${Date.now()}`
    });
  }

  static async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file.buffer, file.originalname);
    const response = await pinata.pinFileToIPFS(formData);
    return response.IpfsHash;
  }

  static async uploadPDF(pdfPath) {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(pdfPath));
    const response = await pinata.pinFileToIPFS(formData);
    return response.IpfsHash;
  }

  static async addToGroup(cids, groupId) {
    return await pinata.groups.addCids({ cids, groupId });
  }
}

module.exports = PinataService;