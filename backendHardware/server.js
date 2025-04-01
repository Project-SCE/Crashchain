const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Middleware to parse JSON
app.use(express.json());

// Create upload directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer setup for CSV file uploads
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage });

// OBD Data Endpoint
app.post('/obd', (req, res) => {
  console.log('Received OBD Data:', req.body);
  res.status(200).send('OBD data received successfully.');
});

// Image Upload Endpoint
// Use body-parser to parse raw image data for requests with Content-Type: image/jpeg
app.use('/image', bodyParser.raw({ type: 'image/jpeg', limit: '10mb' }));

app.post('/image', (req, res) => {
  // Check that image data was received
  if (!req.body || req.body.length === 0) {
    return res.status(400).send('No image data received');
  }

  // Generate a unique filename for the image using uploadDir
  const filename = path.join(uploadDir, `image-${Date.now()}.jpg`);

  // Save the image buffer to a file
  fs.writeFile(filename, req.body, (err) => {
    if (err) {
      console.error('Error saving image:', err);
      return res.status(500).send('Error saving image');
    }
    console.log('Image saved as', filename);
    res.send(`Image uploaded successfully: ${filename}`);
  });
});

// CSV File Upload Endpoint
app.post('/upload-csv', upload.single('csv'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No CSV file uploaded.');
  }
  console.log('CSV file received:', req.file.filename);
  res.status(200).send(`CSV uploaded: ${req.file.filename}`);
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
