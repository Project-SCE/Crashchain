const logger = require('../utils/logger');

const validateUploadData = (req, res, next) => {
  try {
    const required = ['vinNumber', 'location', 'impactSeverity', 'throttlePosition', 'brakePosition'];
    const missingFields = required.filter(
      field => !req.body[field] || req.body[field].toString().trim() === ''
    );

    if (missingFields.length > 0) {
      logger.warn('[DEBUG] Missing required fields:', missingFields);
      return res.status(400).json({
        error: 'Missing required fields',
        missingFields
      });
    }

    // Validate numeric fields
    const numericFields = {
      throttlePosition: { min: 0, max: 100 },
      brakePosition: { min: 0, max: 100 }
    };

    for (const [field, range] of Object.entries(numericFields)) {
      const value = Number(req.body[field]);
      if (isNaN(value) || value < range.min || value > range.max) {
        return res.status(400).json({
          error: `Invalid ${field}. Must be a number between ${range.min} and ${range.max}`
        });
      }
    }

    // Validate VIN number (basic check)
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/i;
    if (!vinRegex.test(req.body.vinNumber)) {
      return res.status(400).json({
        error: 'Invalid VIN number format'
      });
    }

    // Validate severity levels
    const validSeverityLevels = ['low', 'medium', 'high', 'critical'];
    if (!validSeverityLevels.includes(req.body.impactSeverity.toLowerCase())) {
      return res.status(400).json({
        error: 'Invalid impact severity level'
      });
    }

    // Validate telemetry data if present
    if (req.body.telemetryData) {
      try {
        const telemetry = JSON.parse(req.body.telemetryData);
        if (!Array.isArray(telemetry)) {
          throw new Error('Telemetry data must be an array');
        }
        // Validate each telemetry entry
        for (const entry of telemetry) {
          if (!entry.speed || !entry.engineRpm) {
            throw new Error('Invalid telemetry entry format');
          }
        }
      } catch (error) {
        return res.status(400).json({
          error: 'Invalid telemetry data format'
        });
      }
    }

    next();
  } catch (error) {
    logger.error('[DEBUG] Validation error:', error);
    res.status(500).json({ error: 'Validation error occurred' });
  }
};

// Debug middleware
const debugLogger = (req, res, next) => {
  logger.info(`[DEBUG] Incoming request: ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    logger.info('[DEBUG] Request body:', req.body);
  }
  next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  logger.error('[DEBUG] Error:', err);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File is too large. Maximum size is 10MB'
      });
    }
    return res.status(400).json({
      error: 'File upload error'
    });
  }
  res.status(500).json({
    error: 'Internal server error'
  });
};

module.exports = {
  validateUploadData,
  debugLogger,
  errorHandler
};