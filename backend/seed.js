const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const Teacher = require('./models/Teacher');
const Leave = require('./models/Leave');

// Sample data
const sampleTeachers = [
  {
    name: 'John Smith',
    email: 'teacher@demo.com',
    password: 'password123',
    subject: 'Mathematics',
    workload: 8,
    available: true,
    role: 'teacher',
    phone: '+1234567890',
    department: 'Science & Mathematics',
    isActive: true
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@school.com',
    password: 'password123',
    subject: 'English',
    workload: 10,
    available: true,
    role: 'teacher',
    phone: '+1234567891',
    department: 'Languages',
    isActive: true
  },
  {
    name: 'Michael Brown',
    email: 'michael.brown@school.com',
    password: 'password123',
    subject: 'Physics',
    workload: 6,
    available: true,
    role: 'teacher',
    phone: '+1234567892',
    department: 'Science & Mathematics',
    isActive: true
  },
  {
    name: 'Emily Davis',
    email: 'emily.davis@school.com',
    password: 'password123',
    subject: 'History',
    workload: 12,
    available: true,
    role: 'teacher',
    phone: '+1234567893',
    department: 'Social Studies',
    isActive: true
  },
  {
    name: 'David Wilson',
    email: 'david.wilson@school.com',
    password: 'password123',
    subject: 'Chemistry',
    workload: 9,
    available: true,
    role: 'teacher',
    phone: '+1234567894',
    department: 'Science & Mathematics',
    isActive: true
  },
  {
    name: 'Lisa Anderson',
    email: 'admin@demo.com',
    password: 'password123',
    subject: 'Administration',
    workload: 0,
    available: true,
    role: 'admin',
    phone: '+1234567895',
    department: 'Administration',
    isActive: true
  }
];

const sampleLeaves = [
  {
    teacherId: null, // Will be set after teacher creation
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    reason: 'Medical appointment for annual checkup',
    status: 'pending',
    leaveType: 'medical',
    duration: 'full-day',
    isActive: true
  },
  {
    teacherId: null, // Will be set after teacher creation
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    reason: 'Family vacation - out of town',
    status: 'pending',
    leaveType: 'personal',
    duration: 'multiple-days',
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    isActive: true
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teacher_leave_management');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Teacher.deleteMany({});
    await Leave.deleteMany({});
    console.log('✅ Cleared existing data');

    // Hash passwords and create teachers
    const createdTeachers = [];
    for (const teacherData of sampleTeachers) {
      const hashedPassword = await bcrypt.hash(teacherData.password, 12);
      const teacher = await Teacher.create({
        ...teacherData,
        password: hashedPassword
      });
      createdTeachers.push(teacher);
      console.log(`✅ Created teacher: ${teacher.name} (${teacher.email})`);
    }

    // Create sample leaves
    const mathTeacher = createdTeachers.find(t => t.subject === 'Mathematics');
    const englishTeacher = createdTeachers.find(t => t.subject === 'English');

    if (mathTeacher && englishTeacher) {
      sampleLeaves[0].teacherId = mathTeacher._id;
      sampleLeaves[1].teacherId = englishTeacher._id;

      for (const leaveData of sampleLeaves) {
        const leave = await Leave.create(leaveData);
        console.log(`✅ Created leave request for ${leaveData.reason}`);
      }
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Demo data created:');
    console.log(`   - ${createdTeachers.length} teachers`);
    console.log(`   - ${sampleLeaves.length} leave requests`);
    console.log('\n🔑 Demo credentials:');
    console.log('   Teacher: teacher@demo.com / password123');
    console.log('   Admin: admin@demo.com / password123');
    console.log('\n✨ You can now run the application!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the seed function
seedDatabase();
