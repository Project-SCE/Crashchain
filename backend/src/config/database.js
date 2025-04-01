const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    // Ensure logger has info and error methods
    if (typeof logger.info !== 'function') {
      console.warn('Logger.info is not a function. Falling back to console.log');
      logger.info = console.log;
    }
    
    if (typeof logger.error !== 'function') {
      console.warn('Logger.error is not a function. Falling back to console.error');
      logger.error = console.error;
    }

    await mongoose.connect(process.env.MONGO_URI, {
      // Optional: Add connection options
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = { connectDB };