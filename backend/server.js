require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const {Web3} = require('web3');
const mongoose = require('mongoose');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

connectDB();

// Define MongoDB schema for OBD data
const obdDataSchema = new mongoose.Schema({
  vin: String,
  data: String, // OBD data as JSON
  location: String,
  timestamp: { type: Date, default: Date.now }
});

const OBDData = mongoose.model('OBDData', obdDataSchema);

// Express setup
const app = express();
const port = process.env.PORT || 3000;
app.use(bodyParser.json());

// Web3 setup
const web3 = new Web3(process.env.ETH_PROVIDER);
const contractABI = require('./blockchain/build/contracts/CrashMetadataStorage.json').abi;
const contractAddress = process.env.CONTRACT_ADDRESS;
const crashContract = new web3.eth.Contract(contractABI, contractAddress);

// Endpoint to receive ESP32 OBD data
app.post('/store-obd-data', async (req, res) => {
  const { vin, data, location } = req.body;

  if (!vin || !data || !location) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Store full data in MongoDB
    const obdData = new OBDData({ vin, data, location });
    const savedData = await obdData.save();

    // Store metadata in blockchain
    const dataId = savedData._id.toString(); // MongoDB document ID
    const accounts = await web3.eth.getAccounts();
    await crashContract.methods.storeMetadata(dataId, vin, location)
      .send({ from: accounts[0], 
		gas: 3000000  });

    res.json({ message: 'Data stored successfully', dataId });
  } catch (error) {
    console.error('Error storing data:', error);
    res.status(500).json({ error: 'Error storing data' });
  }
});

// Endpoint to verify metadata
app.get('/verify-metadata/:index', async (req, res) => {
  const { index } = req.params;

  try {
    const metadata = await crashContract.methods.getMetadata(index).call();
    res.json(metadata);
  } catch (error) {
    console.error('Error verifying metadata:', error);
    res.status(500).json({ error: 'Error verifying metadata' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
