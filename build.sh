#!/bin/bash

echo "🚀 Starting Smart Hospital Portal Production Build..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    print_error "Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

print_status "Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "npm version: $(npm -v)"

# Create production directory
PROD_DIR="production"
if [ -d "$PROD_DIR" ]; then
    print_warning "Production directory already exists. Removing..."
    rm -rf "$PROD_DIR"
fi

mkdir -p "$PROD_DIR"
print_status "Created production directory: $PROD_DIR"

# Backend build
print_status "Building backend..."
cd backend

# Install production dependencies
print_status "Installing backend dependencies..."
npm ci --only=production

if [ $? -ne 0 ]; then
    print_error "Failed to install backend dependencies"
    exit 1
fi

# Copy backend files
cd ..
cp -r backend "$PROD_DIR/"
print_status "Backend files copied to production directory"

# Frontend build
print_status "Building frontend..."
cd frontend

# Install dependencies
print_status "Installing frontend dependencies..."
npm ci

if [ $? -ne 0 ]; then
    print_error "Failed to install frontend dependencies"
    exit 1
fi

# Build frontend
print_status "Building React application..."
npm run build:prod

if [ $? -ne 0 ]; then
    print_error "Frontend build failed"
    exit 1
fi

# Copy frontend build
cd ..
cp -r frontend/build "$PROD_DIR/frontend"
print_status "Frontend build copied to production directory"

# Create production configuration
print_status "Creating production configuration..."

# Create .env file for production
cat > "$PROD_DIR/.env" << EOF
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/smart_hospital_portal?retryWrites=true&w=majority
JWT_SECRET=your-super-secure-jwt-secret-key-here-change-this-in-production
JWT_EXPIRE=7d
FRONTEND_URL=https://your-domain.com
ADMIN_URL=https://admin.your-domain.com
EOF

# Create production start script
cat > "$PROD_DIR/start.sh" << 'EOF'
#!/bin/bash
echo "🚀 Starting Smart Hospital Portal..."
cd backend
npm start
EOF

chmod +x "$PROD_DIR/start.sh"

# Create production package.json
cat > "$PROD_DIR/package.json" << EOF
{
  "name": "smart-hospital-portal-production",
  "version": "2.0.0",
  "description": "Smart Hospital Portal Production Build",
  "main": "backend/server.js",
  "scripts": {
    "start": "cd backend && npm start",
    "dev": "cd backend && npm run dev",
    "install-deps": "cd backend && npm ci --only=production"
  },
  "engines": {
    "node": ">=16.0.0",
    "npm": ">=8.0.0"
  }
}
EOF

# Create deployment instructions
cat > "$PROD_DIR/DEPLOYMENT.md" << 'EOF'
# 🚀 Smart Hospital Portal - Production Deployment

## Prerequisites
- Node.js 16+ installed
- MongoDB database (local or Atlas)
- Domain name (for production)

## Quick Start

1. **Install Dependencies:**
   ```bash
   npm run install-deps
   ```

2. **Configure Environment:**
   - Edit `.env` file with your production values
   - Update MongoDB connection string
   - Set JWT secret
   - Configure frontend URLs

3. **Start the Application:**
   ```bash
   npm start
   ```

## Production Checklist

- [ ] MongoDB connection configured
- [ ] JWT secret updated
- [ ] Frontend URLs configured
- [ ] SSL certificate installed
- [ ] Domain configured
- [ ] Environment variables set
- [ ] Database seeded with initial data

## Monitoring

- Health check: `GET /api/health`
- Server logs: Check console output
- Database status: Check health endpoint

## Troubleshooting

- Check MongoDB connection
- Verify environment variables
- Check server logs
- Ensure ports are open

## Support

For issues, check the logs and verify configuration.
EOF

# Create Docker support
cat > "$PROD_DIR/Dockerfile" << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm ci --only=production
RUN cd backend && npm ci --only=production

# Copy application files
COPY . .

# Build frontend
RUN cd frontend && npm ci && npm run build:prod

# Expose port
EXPOSE 5000

# Start application
CMD ["npm", "start"]
EOF

cat > "$PROD_DIR/docker-compose.yml" << 'EOF'
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
    env_file:
      - .env
    restart: unless-stopped

  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

volumes:
  mongodb_data:
EOF

# Create PM2 configuration for production
cat > "$PROD_DIR/ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [{
    name: 'smart-hospital-portal',
    script: 'backend/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_file: '.env',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

# Create logs directory
mkdir -p "$PROD_DIR/logs"

# Create README
cat > "$PROD_DIR/README.md" << 'EOF'
# 🏥 Smart Hospital Portal - Production

## What's Included

✅ **Backend API** - Complete REST API with authentication
✅ **Frontend App** - React-based user interface
✅ **Database Models** - MongoDB schemas and relationships
✅ **Real-time Features** - Socket.IO for live updates
✅ **Security** - JWT authentication, rate limiting, CORS
✅ **Production Ready** - Optimized for deployment

## Features

- **Teacher Management** - Add, edit, delete teachers
- **Leave Management** - Request, approve, reject leaves
- **Substitution System** - Automatic teacher substitution
- **Timetable Management** - Schedule and manage classes
- **Department Management** - Organize by departments
- **Real-time Notifications** - Live updates via WebSocket
- **Admin Dashboard** - Comprehensive management interface

## Quick Start

1. **Install Dependencies:**
   ```bash
   npm run install-deps
   ```

2. **Configure Environment:**
   - Edit `.env` file
   - Set MongoDB connection
   - Configure JWT secret

3. **Start Application:**
   ```bash
   npm start
   ```

## Deployment Options

- **Traditional Hosting** - Use start.sh script
- **Docker** - Use Dockerfile and docker-compose.yml
- **PM2** - Use ecosystem.config.js for process management
- **Cloud Platforms** - Deploy to Heroku, Railway, etc.

## Support

Check DEPLOYMENT.md for detailed instructions.
EOF

print_status "Production build completed successfully! 🎉"
print_status "Production files are in: $PROD_DIR/"
print_status ""
print_status "Next steps:"
print_status "1. cd $PROD_DIR"
print_status "2. Edit .env file with your configuration"
print_status "3. npm run install-deps"
print_status "4. npm start"
print_status ""
print_status "For Docker deployment:"
print_status "docker-compose up -d"
print_status ""
print_status "For PM2 deployment:"
print_status "npm install -g pm2 && pm2 start ecosystem.config.js"

echo ""
echo "🚀 Your Smart Hospital Portal is ready for production deployment!"
