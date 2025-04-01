const { PinataSDK } = require('pinata-web3');
const logger = require('../utils/logger');

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: 'lavender-tropical-harrier-912.mypinata.cloud',
});

module.exports = { pinata };