# 🏥 Smart Hospital Portal - Teacher Leave Management System

## 🎯 Overview

A comprehensive, production-ready hospital management system designed specifically for managing teacher leaves, substitutions, and timetables. Built with modern technologies and enterprise-grade security.

## ✨ Features

### 🔐 **Authentication & Security**
- **JWT-based authentication** with secure token management
- **Role-based access control** (Admin/Teacher)
- **Password encryption** using bcrypt
- **Rate limiting** and CORS protection
- **Helmet security headers**

### 👨‍🏫 **Teacher Management**
- **Complete teacher profiles** with department assignments
- **Subject specialization** tracking
- **Availability status** management
- **Performance metrics** and statistics

### 📅 **Leave Management**
- **Leave request system** with approval workflow
- **Multiple leave types** (sick, personal, emergency)
- **Duration tracking** (single day to extended periods)
- **Reason documentation** and approval history

### 🔄 **Substitution System**
- **Automatic substitution recommendations** based on availability
- **Real-time substitution requests** and responses
- **Conflict detection** and resolution
- **Substitution history** and tracking

### ⏰ **Timetable Management**
- **Class scheduling** with period management
- **Subject allocation** and room assignments
- **Conflict detection** for overlapping schedules
- **Flexible timetable** modifications

### 🏢 **Department Management**
- **Department creation** and organization
- **Teacher assignments** to departments
- **Department-specific** statistics and reports

### 📊 **Admin Dashboard**
- **Comprehensive overview** of all system activities
- **Real-time statistics** and metrics
- **Bulk operations** for efficient management
- **System health** monitoring

### 🔔 **Real-time Features**
- **WebSocket integration** for live updates
- **Instant notifications** for leave approvals
- **Live substitution** status updates
- **Real-time dashboard** refreshes

## 🛠️ Technology Stack

### **Backend**
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### **Frontend**
- **React** - UI framework
- **React Router** - Navigation
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time updates
- **Tailwind CSS** - Styling
- **React Icons** - Icon library

### **Security & Performance**
- **Helmet** - Security headers
- **Rate Limiting** - API protection
- **Compression** - Response optimization
- **CORS** - Cross-origin handling

## 🚀 Quick Start

### **Prerequisites**
- Node.js 16+ installed
- MongoDB database (local or cloud)
- Git for version control

### **1. Clone Repository**
```bash
git clone https://github.com/your-username/smart-hospital-portal.git
cd smart-hospital-portal
```

### **2. Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm start
```

### **3. Frontend Setup**
```bash
cd frontend
npm install
npm start
```

### **4. Access Application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## 📁 Project Structure

```
smart-hospital-portal/
├── backend/                 # Backend API server
│   ├── config/             # Database and app configuration
│   ├── middleware/         # Authentication and validation
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API endpoints
│   ├── utils/              # Helper functions
│   └── server.js           # Main server file
├── frontend/               # React frontend application
│   ├── public/             # Static assets
│   ├── src/                # Source code
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   └── App.js          # Main app component
│   └── package.json        # Frontend dependencies
├── production/             # Production build (generated)
├── build.sh                # Production build script
└── README.md               # This file
```

## 🔧 Configuration

### **Environment Variables**

Create a `.env` file in the backend directory:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart_hospital_portal
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

### **Database Setup**

1. **Local MongoDB:**
   ```bash
   mongod
   ```

2. **MongoDB Atlas (Cloud):**
   - Create cluster at [MongoDB Atlas](https://cloud.mongodb.com)
   - Get connection string
   - Update `MONGODB_URI` in `.env`

## 📊 API Endpoints

### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### **Teachers**
- `GET /api/teachers` - Get all teachers
- `POST /api/teachers` - Create teacher
- `PUT /api/teachers/:id` - Update teacher
- `DELETE /api/teachers/:id` - Delete teacher

### **Leaves**
- `GET /api/leaves` - Get all leaves
- `POST /api/leaves` - Create leave request
- `PUT /api/leaves/:id` - Update leave
- `GET /api/leaves/pending` - Get pending leaves
- `GET /api/leaves/approved` - Get approved leaves

### **Substitutions**
- `GET /api/timetable/substitutions` - Get all substitutions
- `POST /api/timetable/assign-substitution` - Assign substitution
- `GET /api/timetable/substitutions/teacher/:id` - Get teacher substitutions
- `PATCH /api/timetable/substitutions/:id` - Update substitution status

### **Timetables**
- `GET /api/timetable` - Get timetables
- `POST /api/timetable` - Create timetable
- `PUT /api/timetable/:id` - Update timetable

## 🎨 User Interface

### **Admin Dashboard**
- **Teacher Management** - Add, edit, delete teachers
- **Leave Management** - Approve/reject leave requests
- **Substitution Management** - Assign and track substitutions
- **Department Management** - Organize departments
- **Statistics** - System overview and metrics

### **Teacher Dashboard**
- **Profile Management** - Update personal information
- **Leave Requests** - Submit and track leave requests
- **Substitution Requests** - View and respond to substitutions
- **Timetable** - View assigned classes and schedules

## 🚀 Production Deployment

### **Option 1: Automated Build**
```bash
chmod +x build.sh
./build.sh
cd production
npm run install-deps
npm start
```

### **Option 2: Manual Deployment**
```bash
# Backend
cd backend
npm ci --only=production

# Frontend
cd ../frontend
npm ci
npm run build:prod

# Copy frontend to backend
cp -r build ../backend/public
```

### **Deployment Options**
- **Traditional VPS** - Nginx + PM2
- **Docker** - Docker Compose
- **Cloud Platforms** - Heroku, Railway, DigitalOcean
- **Serverless** - Vercel, Netlify (frontend only)

## 🔍 Monitoring & Health

### **Health Check**
```bash
curl http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "message": "Server is running",
  "database": "Connected",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600
}
```

### **Logs**
- **Console logs** for development
- **PM2 logs** for production
- **Structured logging** with timestamps

## 🧪 Testing

### **Run Tests**
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### **Test Coverage**
- **API endpoints** testing
- **Component testing** for React
- **Integration testing** for workflows
- **Security testing** for vulnerabilities

## 🔒 Security Features

- **JWT Authentication** with secure token management
- **Password Hashing** using bcrypt with configurable rounds
- **Rate Limiting** to prevent abuse
- **CORS Protection** for cross-origin requests
- **Input Validation** on all endpoints
- **SQL Injection Protection** (MongoDB is safe)
- **XSS Protection** headers
- **Content Security Policy** headers

## 📈 Performance Optimization

- **Database Indexing** for faster queries
- **Connection Pooling** for MongoDB
- **Response Compression** for smaller payloads
- **Caching Strategy** for frequently accessed data
- **Load Balancing** support for horizontal scaling

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

### **Development Guidelines**
- Follow existing code style
- Add tests for new features
- Update documentation
- Ensure security best practices

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### **Documentation**
- Check this README first
- Review API documentation
- Check deployment guide

### **Issues**
- Search existing issues
- Create new issue with details
- Include error logs and steps to reproduce

### **Community**
- GitHub discussions
- Stack Overflow questions
- Developer forums

## 🎉 Acknowledgments

- **MongoDB** for the excellent database
- **Express.js** team for the robust framework
- **React** team for the amazing UI library
- **Open source community** for inspiration and tools

---

## 🚀 Ready to Deploy?

Your Smart Hospital Portal is now **production-ready** with:

✅ **Complete Feature Set** - All core functionality implemented  
✅ **Enterprise Security** - Production-grade security measures  
✅ **High Performance** - Optimized for speed and scalability  
✅ **Real-time Updates** - Live notifications and updates  
✅ **Mobile Responsive** - Works on all devices  
✅ **Comprehensive Documentation** - Easy to deploy and maintain  
✅ **Multiple Deployment Options** - Traditional, Docker, Cloud  

**Deploy with confidence and enjoy your professional-grade hospital management system!** 🏥✨

---

*Built with ❤️ for better hospital management*
#   s m a r t _ t e a c h e r _ p o r t a l  
 