const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

async function generatePDF(data) {
  // Ensure upload directory exists
  const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  } catch (dirError) {
    console.error('Error creating upload directory:', dirError);
    throw new Error('Failed to create upload directory');
  }

  const doc = new PDFDocument();
  const currentTime = new Date();
  const pdfPath = path.join(uploadDir, `report-${Date.now()}.pdf`);
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
  
  // Optional fields with safe checks
  if (data.ecuIdentifier) {
    doc.text(`ECU Identifier: ${data.ecuIdentifier}`);
  }
  if (data.distanceTraveled) {
    doc.text(`Distance Traveled: ${data.distanceTraveled}`);
  }
  doc.moveDown();

  // Crash Details
  doc.fontSize(16).text('Crash Details');
  doc.fontSize(12);
  doc.text(`Timestamp: ${currentTime.toLocaleString()}`);
  doc.text(`Location: ${data.location || 'Not Provided'}`);
  doc.text(`Impact Severity: ${data.impactSeverity || 'Not Provided'}`);
  doc.moveDown();

  // Vehicle State
  doc.fontSize(16).text('Vehicle State at Time of Incident');
  doc.fontSize(12);
  
  // Safely handle throttle and brake positions
  doc.text(`Throttle Position: ${data.throttlePosition || 'Not Provided'}%`);
  doc.text(`Brake Position: ${data.brakePosition || 'Not Provided'}%`);

  // Safely parse and display telemetry data
  if (data.telemetryData) {
    try {
      const telemetry = typeof data.telemetryData === 'string' 
        ? JSON.parse(data.telemetryData) 
        : data.telemetryData;

      if (Array.isArray(telemetry) && telemetry.length > 0) {
        doc.moveDown();
        doc.fontSize(16).text('Telemetry Data');
        doc.fontSize(12);
        
        const lastReading = telemetry[telemetry.length - 1];
        
        if (lastReading.speed) {
          doc.text(`Last Recorded Speed: ${lastReading.speed} km/h`);
        }
        if (lastReading.engineRpm) {
          doc.text(`Last Recorded Engine RPM: ${lastReading.engineRpm} RPM`);
        }
      }
    } catch (parseError) {
      console.error('Error parsing telemetry data:', parseError);
      doc.moveDown();
      doc.fontSize(12).text('Telemetry Data: Unable to parse');
    }
  }

  doc.end();

  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => resolve(pdfPath));
    writeStream.on('error', (error) => {
      console.error('PDF write stream error:', error);
      reject(error);
    });
  });
}

module.exports = { generatePDF };