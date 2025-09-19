const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Compression middleware
app.use(compression());

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, process.env.ADMIN_URL].filter(Boolean)
    : ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (for production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
}

// Socket.IO with CORS
const io = socketIo(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

// Database connection
const connectDB = require('./config/db');
let dbConnected = false;

const initializeServer = async () => {
  try {
    // Connect to database
    dbConnected = await connectDB();
    
    // Socket.IO connection handling
    io.on('connection', (socket) => {
      console.log('🔌 New client connected:', socket.id);
      
      socket.on('join-room', (room) => {
        socket.join(room);
        console.log(`👥 Client ${socket.id} joined room: ${room}`);
      });
      
      socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
      });
    });

    // Make io accessible to routes
    app.set('io', io);

    // Routes
    app.use('/api/auth', require('./routes/authRoutes'));
    app.use('/api/teachers', require('./routes/teacherRoutes'));
    app.use('/api/admin', require('./routes/adminRoutes'));
    app.use('/api/leaves', require('./routes/leaveRoutes'));
    app.use('/api/timetable', require('./routes/timetableRoutes'));
    app.use('/api/departments', require('./routes/departmentRoutes'));
    app.use('/api/classes', require('./routes/classRoutes'));
    app.use('/api/substitutions', require('./routes/substitutionRoutes'));

    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'OK', 
        message: 'Server is running',
        database: dbConnected ? 'Connected' : 'Disconnected',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // Serve React app in production
    if (process.env.NODE_ENV === 'production') {
      app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
      });
    }

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error('❌ Error:', err.stack);
      
      // Don't leak error details in production
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? err.message 
        : 'Something went wrong!';
      
      res.status(err.status || 500).json({ 
        success: false, 
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });

    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({ 
        success: false, 
        message: 'Route not found' 
      });
    });

    // Start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log('🚀 Server started successfully!');
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Database: ${dbConnected ? 'Connected' : 'Disconnected'}`);
      console.log(`🔌 Socket.IO: Active`);
      
      if (!dbConnected) {
        console.log('⚠️  Warning: Database not connected. Some features may not work.');
      }
    });

  } catch (error) {
    console.error('❌ Server initialization failed:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    mongoose.connection.close(() => {
      console.log('✅ Database connection closed');
      process.exit(0);
    });
  });
});

// Initialize server
initializeServer();
