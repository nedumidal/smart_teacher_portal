const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Try multiple connection options with fallbacks
    const connectionOptions = [
      process.env.MONGODB_URI,
      process.env.MONGODB_ATLAS_URI,
      'mongodb://localhost:27017/smart_hospital_portal',
      'mongodb://127.0.0.1:27017/smart_hospital_portal'
    ];

    let connected = false;
    let lastError = null;

    for (const uri of connectionOptions) {
      if (!uri) continue;
      
      try {
        console.log(`Attempting to connect to: ${uri.replace(/\/\/.*@/, '//***@')}`);
        
        const conn = await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          maxPoolSize: 10,
          minPoolSize: 2,
          maxIdleTimeMS: 30000,
          retryWrites: true,
          w: 'majority'
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        connected = true;
        break;
      } catch (error) {
        console.log(`❌ Connection failed: ${error.message}`);
        lastError = error;
        continue;
      }
    }

    if (!connected) {
      console.error('❌ All MongoDB connection attempts failed');
      console.error('Last error:', lastError?.message);
      
      // Don't exit process, let it continue with graceful degradation
      console.log('⚠️  Server will start but database operations will fail');
      return false;
    }

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    return true;
  } catch (error) {
    console.error('❌ Database connection setup failed:', error.message);
    return false;
  }
};

module.exports = connectDB;
