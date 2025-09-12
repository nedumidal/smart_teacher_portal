#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Teacher Leave Management System...\n');

// Check if .env files exist and create them if they don't
const backendEnvPath = path.join(__dirname, 'backend', '.env');
const frontendEnvPath = path.join(__dirname, 'frontend', '.env');

if (!fs.existsSync(backendEnvPath)) {
  console.log('📝 Creating backend .env file...');
  const backendEnvContent = `# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/teacher_leave_management

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
JWT_EXPIRE=7d

# Email Configuration (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
`;
  
  fs.writeFileSync(backendEnvPath, backendEnvContent);
  console.log('✅ Backend .env file created');
} else {
  console.log('✅ Backend .env file already exists');
}

if (!fs.existsSync(frontendEnvPath)) {
  console.log('📝 Creating frontend .env file...');
  const frontendEnvContent = `REACT_APP_BACKEND_URL=http://localhost:5000
`;
  
  fs.writeFileSync(frontendEnvPath, frontendEnvContent);
  console.log('✅ Frontend .env file created');
} else {
  console.log('✅ Frontend .env file already exists');
}

console.log('\n📋 Next steps:');
console.log('1. Install dependencies: npm run install-all');
console.log('2. Start MongoDB service');
console.log('3. Update .env files with your configuration');
console.log('4. Run the application: npm run dev');
console.log('\n🎯 Demo credentials will be available after first run:');
console.log('   Teacher: teacher@demo.com / password123');
console.log('   Admin: admin@demo.com / password123');

console.log('\n✨ Setup complete! Happy coding! 🎉');
