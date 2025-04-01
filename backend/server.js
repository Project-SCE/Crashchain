require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Web3 } = require('web3');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const { PinataSDK } = require('pinata-web3');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const WebSocket = require('ws');
const http = require('http');
const crashReportRoutes = require("./routes/crashReport");


const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5175', // Frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/crash-report", crashReportRoutes);

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Pinata SDK initialization
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: 'lavender-tropical-harrier-912.mypinata.cloud',
});

// Multer setup for file upload handling


// Ensure the `uploads` directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Helper functions
function requiredFieldsPresent(body) {
  return ['date', 'time', 'location'].every(
    (field) => body[field] && body[field].trim() !== ''
  );
}

async function generatePDF(data, pdfPath) {
  const doc = new PDFDocument();
  const writeStream = fs.createWriteStream(pdfPath);

  doc.pipe(writeStream);
  doc.text(`Vehicle Details:\nVIN: ${data.vinNumber || 'Not Provided'}\nECU: ${data.ecuIdentifier || 'Not Provided'}\nDistance: ${data.distanceTraveled || 'Not Provided'}`);
  doc.text(`\nCrash Details:\nDate: ${data.date}\nTime: ${data.time}\nLocation: ${data.location}\nSeverity: ${data.impactSeverity || 'Not Provided'}`);
  doc.text(`\nAdditional Data:\nBrake: ${data.brakePosition || 'Not Provided'}\nRPM: ${data.engineRpm || 'Not Provided'}`);
  doc.end();

  return new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
}

// Debugging middleware
app.use((req, res, next) => {
  console.log(`[DEBUG] Incoming request: ${req.method} ${req.url}`);
  console.log(`[DEBUG] Request body:`, req.body);
  next();
});

const fetchAllGroupsAndFiles = async () => {
  try {
    console.log('[DEBUG] Fetching all groups from IPFS');
    const groups = await pinata.groups.list();
    console.log(`[DEBUG] Raw groups response:`, groups);

    if (!Array.isArray(groups)) {
      console.error('[DEBUG] Invalid groups structure received:', groups);
      return [];
    }

    // Fetch total metadata count from blockchain with error handling
    let totalMetadata = 0;
    try {
      totalMetadata = await crashContract.methods.getTotalMetadataCount().call();
      console.log(`[DEBUG] Total metadata count from blockchain: ${totalMetadata}`);
    } catch (error) {
      console.error('[DEBUG] Error fetching total metadata count:', error);
      return groups.map(group => ({ 
        groupId: group.id, 
        groupName: group.name, 
        files: [], 
        blockchainData: [] 
      }));
    }

    // Fetch all metadata from blockchain
    const blockchainMetadata = [];
    for (let i = 0; i < totalMetadata; i++) {
      try {
        const metadata = await crashContract.methods.getMetadata(i).call();
        if (metadata) {
          blockchainMetadata.push({
            index: i,
            dataId: metadata[0], // Access by index since we're getting a tuple
            vin: metadata[1],
            timestamp: metadata[2],
            location: metadata[3],
            cids: metadata[4]
          });
          console.log(`[DEBUG] Successfully fetched metadata at index ${i}:`, metadata);
        }
      } catch (error) {
        console.error(`[DEBUG] Error fetching metadata at index ${i}:`, error);
      }
    }

    const groupData = await Promise.all(
      groups.map(async (group) => {
        try {
          console.log(`[DEBUG] Fetching files for group ID: ${group.id}`);
          const filesResponse = await pinata.listFiles().group(group.id);

          if (!filesResponse || !Array.isArray(filesResponse)) {
            console.error(`[DEBUG] Invalid files structure for group ID ${group.id}:`, filesResponse);
            return { groupId: group.id, groupName: group.name, files: [], blockchainData: [] };
          }
          
          const files = filesResponse.map((file) => ({
            cid: file.ipfs_pin_hash,
            name: file.metadata?.name || 'Unknown',
            mimeType: file.mime_type,
            size: file.size,
          }));

          // Find matching blockchain metadata for this group's files
          const matchingMetadata = blockchainMetadata.filter(metadata => 
            metadata.cids && Array.isArray(metadata.cids) && 
            metadata.cids.some(cid => files.some(file => file.cid === cid))
          );
          
          console.log(`[DEBUG] Valid files processed for group ID ${group.id}:`, files);
          console.log(`[DEBUG] Matching blockchain metadata:`, matchingMetadata);
          
          return { 
            groupId: group.id, 
            groupName: group.name, 
            files,
            blockchainData: matchingMetadata
          };
        } catch (error) {
          console.error(`[DEBUG] Error processing group ${group.id}:`, error);
          return { groupId: group.id, groupName: group.name, files: [], blockchainData: [] };
        }
      })
    );

    console.log('[DEBUG] Group data cache populated successfully');
    return groupData;
  } catch (error) {
    console.error('[DEBUG] Error fetching groups or files:', error.message);
    return [];
  }
};

// Global variable to store dashboard data
let dashboardData = [];

const initializeDashboard = async () => {
  try {
    console.log('[DEBUG] Initializing dashboard data');
    dashboardData = await fetchAllGroupsAndFiles();
    console.log('[DEBUG] Dashboard data initialized');
  } catch (error) {
    console.error('[DEBUG] Error initializing dashboard data:', error);
  }
};


// Function to check required fields
const requiredFieldsPresent = (body) => {
  const required = ['vinNumber', 'location', 'impactSeverity', 'throttlePosition', 'brakePosition'];
  return required.every(field => body[field] !== undefined && body[field] !== '');
};

// Function to generate PDF
async function generatePDF(data) {
  const doc = new PDFDocument();
  const currentTime = new Date();
  const pdfPath = path.join(uploadsDir, `report-${Date.now()}.pdf`);
  const writeStream = fs.createWriteStream(pdfPath);

  doc.pipe(writeStream);

  // Add title
  doc.fontSize(20).text('Crash Report', { align: 'center' });
  doc.moveDown();

  // Add timestamp
  doc.fontSize(12).text(`Generated on: ${currentTime.toLocaleString()}`, { align: 'right' });
  doc.moveDown();

  // Vehicle Details
  doc.fontSize(16).text('Vehicle Details');
  doc.fontSize(12);
  doc.text(`VIN Number: ${data.vinNumber || 'Not Provided'}`);
  doc.text(`ECU Identifier: ${data.ecuIdentifier || 'Not Provided'}`);
  doc.text(`Distance Traveled: ${data.distanceTraveled || 'Not Provided'}`);
  doc.moveDown();

  // Crash Details
  doc.fontSize(16).text('Crash Details');
  doc.fontSize(12);
  doc.text(`Timestamp: ${currentTime.toLocaleString()}`);
  doc.text(`Location: ${data.location}`);
  doc.text(`Impact Severity: ${data.impactSeverity}`);
  doc.moveDown();

  // Vehicle State
  doc.fontSize(16).text('Vehicle State at Time of Incident');
  doc.fontSize(12);
  doc.text(`Throttle Position: ${data.throttlePosition}%`);
  doc.text(`Brake Position: ${data.brakePosition}%`);

  if (data.telemetryData) {
    doc.moveDown();
    doc.fontSize(16).text('Telemetry Data');
    doc.fontSize(12);
    
    const telemetry = JSON.parse(data.telemetryData);
    if (telemetry.length > 0) {
      const lastReading = telemetry[telemetry.length - 1];
      doc.text(`Last Recorded Speed: ${lastReading.speed} km/h`);
      doc.text(`Last Recorded Engine RPM: ${lastReading.engineRpm} RPM`);
    }
  }

  doc.end();

  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => resolve(pdfPath));
    writeStream.on('error', reject);
  });
}

// API endpoint
app.post('/api/upload-and-process', upload.single('file'), async (req, res) => {
  try {
    if (!requiredFieldsPresent(req.body)) {
      console.error('[DEBUG] Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create a Pinata group for this upload
    console.log('[DEBUG] Creating Pinata group');
    const group = await pinata.groups.create({
      name: `Crash-Report-${Date.now()}`,
    });
    
    const groupCids = [];

    // Handle uploaded file if present
    if (req.file) {
      console.log('[DEBUG] Processing uploaded file');
      const formData = new FormData();
      formData.append('file', req.file.buffer, req.file.originalname);

      const imageUploadResponse = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            Authorization: `Bearer ${process.env.PINATA_JWT}`,
            ...formData.getHeaders(),
          },
          maxBodyLength: Infinity,
        }
      );

      groupCids.push(imageUploadResponse.data.IpfsHash);
    }

    // Generate and upload PDF
    const pdfPath = await generatePDF(req.body);
    const pdfFormData = new FormData();
    pdfFormData.append('file', fs.createReadStream(pdfPath));

    const pdfUploadResponse = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      pdfFormData,
      {
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
          ...pdfFormData.getHeaders(),
        },
        maxBodyLength: Infinity,
      }
    );

    groupCids.push(pdfUploadResponse.data.IpfsHash);

    // Clean up the PDF file
    fs.unlinkSync(pdfPath);

    // Add CIDs to the Pinata group
    await pinata.groups.addCids({
      cids: groupCids,
      groupId: group.id,
    });

    // Store metadata in blockchain
    try {
      const dataId = new mongoose.Types.ObjectId().toString();
      const transaction = await crashContract.methods.storeMetadata(
        dataId,
        req.body.vinNumber,
        req.body.location,
        groupCids
      ).send({
        from: defaultAccount,
        gas: 500000
      });
      
      console.log('[DEBUG] Blockchain transaction successful:', transaction.transactionHash);
    } catch (error) {
      console.error('[DEBUG] Error storing metadata in blockchain:', error);
      // Continue with the response even if blockchain storage fails
    }

    res.json({
      message: 'Upload successful',
      groupId: group.id,
      files: groupCids.map(cid => ({
        cid,
        url: `https://${process.env.GATEWAY_URL}/ipfs/${cid}`
      }))
    });
  } catch (error) {
    console.error('[DEBUG] Upload error:', error);
    res.status(500).json({ error: 'Error processing upload' });
  }
});
// Fetch group data from IPFS
app.get('/api/fetch-group-data/:groupId', async (req, res) => {
  const { groupId } = req.params;

  try {
    console.log(`[DEBUG] Fetching data for group ID: ${groupId}`);

    const groupDetails = await pinata.groups.get({ groupId });
    console.log(`[DEBUG] Group Details: ${JSON.stringify(groupDetails)}`);

    const cids = groupDetails?.data?.cids || [];
    console.log(`[DEBUG] CIDs: ${cids}`);

    const fetchCidData = async (cid) => {
      console.log(`[DEBUG] Fetching data for CID: ${cid}`);
      const response = await axios.get(
        `https://${pinata.pinataGateway}/ipfs/${cid}`,
        { responseType: 'arraybuffer' }
      );
      console.log(`[DEBUG] Data fetched for CID: ${cid}`);
      return {
        cid,
        contentType: response.headers['content-type'],
        data: Buffer.from(response.data).toString('base64'),
      };
    };

    const groupData = await Promise.all(cids.map(fetchCidData));
    console.log(`[DEBUG] Group Data: ${JSON.stringify(groupData)}`);

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

// Endpoint to serve dashboard data
app.get('/api/dashboard-data', async (req, res) => {
  try {
    if (!dashboardData || dashboardData.length === 0) {
      // Fetch fresh data if none exists
      dashboardData = await fetchAllGroupsAndFiles();
    }
    res.json(dashboardData || []);
  } catch (error) {
    console.error('[DEBUG] Error serving dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// MongoDB connection
const connectDB = async () => {
  try {
    console.log('[DEBUG] Connecting to MongoDB');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[DEBUG] MongoDB connected successfully.');
  } catch (error) {
    console.error('[DEBUG] Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

connectDB().then(() => {
  initializeDashboard();
});

// Define MongoDB schema for OBD data
const obdDataSchema = new mongoose.Schema({
  vin: String,
  data: String,
  location: String,
  timestamp: { type: Date, default: Date.now },
});

const OBDData = mongoose.model('OBDData', obdDataSchema);

// Express setup
const PORT = process.env.PORT || 3000;

// Web3 setup
const web3 = new Web3(process.env.ETH_PROVIDER || 'http://127.0.0.1:7545');
let contractABI;
try {
  contractABI = require('./blockchain/build/contracts/CrashMetadataStorage.json').abi;
  console.log('[DEBUG] Successfully loaded contract ABI');
} catch (error) {
  console.error('[DEBUG] Error loading contract ABI:', error);
  contractABI = null;
}

const contractAddress = process.env.CONTRACT_ADDRESS;
console.log('[DEBUG] Using contract address:', contractAddress);
console.log('[DEBUG] Using ETH provider:', process.env.ETH_PROVIDER || 'http://127.0.0.1:7545');

// Test Ganache connection but don't fail if it's not available
web3.eth.net.isListening()
  .then(async () => {
    console.log('[DEBUG] Successfully connected to Ethereum network');
    try {
      const networkId = await web3.eth.net.getId();
      console.log('[DEBUG] Connected to network ID:', networkId);
      
      const accounts = await web3.eth.getAccounts();
      console.log('[DEBUG] Available accounts:', accounts);
      
      const balance = await web3.eth.getBalance(accounts[0]);
      console.log('[DEBUG] First account balance:', web3.utils.fromWei(balance, 'ether'), 'ETH');
    } catch (error) {
      console.log('[DEBUG] Error fetching network details:', error.message);
    }
  })
  .catch((error) => {
    console.log('[DEBUG] Could not connect to Ethereum network:', error.message);
    // Continue running the server even if Ethereum connection fails
  });

const crashContract = new web3.eth.Contract(contractABI, contractAddress);

// Get the default account for transactions
let defaultAccount;
web3.eth.getAccounts().then(accounts => {
  defaultAccount = accounts[0];
  console.log('[DEBUG] Default account set:', defaultAccount);
}).catch(error => {
  console.error('[DEBUG] Error getting accounts:', error);
});

// Test blockchain connection
web3.eth.net.isListening()
  .then(() => console.log('[DEBUG] Successfully connected to Ethereum network'))
  .catch(err => console.error('[DEBUG] Error connecting to Ethereum network:', err));

// Verify contract exists
web3.eth.getCode(contractAddress)
  .then(code => {
    if (code === '0x') {
      console.error('[DEBUG] No contract found at address:', contractAddress);
    } else {
      console.log('[DEBUG] Contract verified at address:', contractAddress);
    }
  })
  .catch(err => console.error('[DEBUG] Error verifying contract:', err));


// Endpoint to verify metadata
app.get('/verify-metadata/:index', async (req, res) => {
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

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Helper function to convert BigInt to string in objects
const convertBigIntToString = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (Array.isArray(obj)) return obj.map(convertBigIntToString);
  if (typeof obj === 'object') {
    const converted = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        converted[key] = convertBigIntToString(value);
      }
    }
    return converted;
  }
  return obj;
};

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('[DEBUG] New WebSocket connection established');

  // Send initial data
  sendInitialData(ws);

  // Handle WebSocket errors
  ws.on('error', (error) => {
    console.error('[DEBUG] WebSocket error:', error);
  });
});

const sendInitialData = async (ws) => {
  try {
    const rawData = await fetchAllGroupsAndFiles();
    const convertedData = convertBigIntToString(rawData);
    const message = {
      type: 'initialData',
      data: convertedData
    };
    
    console.log('[DEBUG] Sending initial data:', JSON.stringify(message, null, 2));
    ws.send(JSON.stringify(message));
  } catch (error) {
    console.error('[DEBUG] Error sending initial data:', error);
  }
};

// Broadcast updates to all connected clients
const broadcastUpdate = async () => {
  try {
    const rawData = await fetchAllGroupsAndFiles();
    const convertedData = convertBigIntToString(rawData);
    const message = {
      type: 'update',
      data: convertedData
    };
    
    console.log('[DEBUG] Broadcasting update:', JSON.stringify(message, null, 2));
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  } catch (error) {
    console.error('[DEBUG] Error broadcasting update:', error);
  }
};

// Ping all clients every 30 seconds to keep connections alive
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log('[DEBUG] Terminating inactive WebSocket connection');
      return ws.terminate();
    }
    
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});