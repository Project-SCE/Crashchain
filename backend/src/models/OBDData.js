const mongoose = require('mongoose');

// Define MongoDB schema for OBD data - directly from your original code
const obdDataSchema = new mongoose.Schema({
  vin: String,
  data: String,
  location: String,
  timestamp: { type: Date, default: Date.now },
});

const OBDData = mongoose.model('OBDData', obdDataSchema);

module.exports = OBDData;