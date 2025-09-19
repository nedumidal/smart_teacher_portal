const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const Teacher = require('./models/Teacher');

// College-specific teachers
const collegeTeachers = [
  {
    name: 'Dr. Rajesh Kumar',
    email: 'rajesh.kumar@college.com',
    password: 'password123',
    subject: 'Computer Science',
    workload: 8,
    available: true,
    role: 'teacher',
    phone: '+91-9876543210',
    department: 'CSE',
    isActive: true
  },
  {
    name: 'Prof. Priya Sharma',
    email: 'priya.sharma@college.com',
    password: 'password123',
    subject: 'Data Structures',
    workload: 10,
    available: true,
    role: 'teacher',
    phone: '+91-9876543211',
    department: 'CSE',
    isActive: true
  },
  {
    name: 'Dr. Amit Patel',
    email: 'amit.patel@college.com',
    password: 'password123',
    subject: 'Machine Learning',
    workload: 6,
    available: true,
    role: 'teacher',
    phone: '+91-9876543212',
    department: 'AIML',
    isActive: true
  },
  {
    name: 'Prof. Sneha Reddy',
    email: 'sneha.reddy@college.com',
    password: 'password123',
    subject: 'Artificial Intelligence',
    workload: 8,
    available: true,
    role: 'teacher',
    phone: '+91-9876543213',
    department: 'AIML',
    isActive: true
  },
  {
    name: 'Dr. Vikram Singh',
    email: 'vikram.singh@college.com',
    password: 'password123',
    subject: 'Database Systems',
    workload: 7,
    available: true,
    role: 'teacher',
    phone: '+91-9876543214',
    department: 'IT',
    isActive: true
  },
  {
    name: 'Prof. Anjali Gupta',
    email: 'anjali.gupta@college.com',
    password: 'password123',
    subject: 'Web Development',
    workload: 9,
    available: true,
    role: 'teacher',
    phone: '+91-9876543215',
    department: 'IT',
    isActive: true
  },
  {
    name: 'Dr. Ravi Verma',
    email: 'ravi.verma@college.com',
    password: 'password123',
    subject: 'Digital Electronics',
    workload: 8,
    available: true,
    role: 'teacher',
    phone: '+91-9876543216',
    department: 'ECE',
    isActive: true
  },
  {
    name: 'Prof. Meera Joshi',
    email: 'meera.joshi@college.com',
    password: 'password123',
    subject: 'Communication Systems',
    workload: 7,
    available: true,
    role: 'teacher',
    phone: '+91-9876543217',
    department: 'ECE',
    isActive: true
  },
  {
    name: 'Dr. Suresh Kumar',
    email: 'suresh.kumar@college.com',
    password: 'password123',
    subject: 'Thermodynamics',
    workload: 6,
    available: true,
    role: 'teacher',
    phone: '+91-9876543218',
    department: 'MECH',
    isActive: true
  },
  {
    name: 'Prof. Kavita Singh',
    email: 'kavita.singh@college.com',
    password: 'password123',
    subject: 'Fluid Mechanics',
    workload: 8,
    available: true,
    role: 'teacher',
    phone: '+91-9876543219',
    department: 'MECH',
    isActive: true
  }
];

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teacher-portal', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    return false;
  }
};

const seedCollegeTeachers = async () => {
  try {
    const connected = await connectDB();
    if (!connected) {
      process.exit(1);
    }

    // Check if teachers already exist
    const existingTeachers = await Teacher.find({});
    if (existingTeachers.length > 0) {
      console.log('📚 Teachers already exist. Adding college teachers...');
    }

    // Create college teachers
    for (const teacherData of collegeTeachers) {
      try {
        // Check if teacher already exists
        const existingTeacher = await Teacher.findOne({ email: teacherData.email });
        if (existingTeacher) {
          console.log(`⚠️  Teacher ${teacherData.name} already exists, skipping...`);
          continue;
        }

        const teacher = new Teacher(teacherData);
        await teacher.save();
        console.log(`✅ Created teacher: ${teacher.name} (${teacher.email})`);
      } catch (error) {
        console.error(`❌ Error creating teacher ${teacherData.name}:`, error.message);
      }
    }

    console.log('\n🎉 College teachers seeding completed successfully!');
    console.log('\n📊 College teachers created:');
    console.log('   - Computer Science & Engineering (CSE)');
    console.log('   - Artificial Intelligence & Machine Learning (AIML)');
    console.log('   - Information Technology (IT)');
    console.log('   - Electronics & Communication Engineering (ECE)');
    console.log('   - Mechanical Engineering (MECH)');

  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Disconnected from MongoDB');
  }
};

// Run seeding
seedCollegeTeachers();
