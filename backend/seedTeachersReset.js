const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Teacher = require('./models/Teacher');

// Subjects to seed one teacher each for demo
const SUBJECTS = [
  'Mathematics',
  'English',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'History'
];

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teacher_leave_management');
    console.log('✅ Connected to MongoDB');

    // Delete all teachers
    await Teacher.deleteMany({});
    console.log('🗑️  Removed all existing teachers');

    // Create an admin
    const admin = await Teacher.create({
      name: 'ADMIN',
      email: 'admin@demo.com',
      password: await bcrypt.hash('pass123', 12),
      subject: 'Administration',
      role: 'admin',
      department: 'Administration',
      isActive: true
    });
    console.log('👑 Admin created:', admin.email);

    // Create one teacher per subject with password pass123
    for (const subject of SUBJECTS) {
      const teacher = await Teacher.create({
        name: subject.toUpperCase(),
        email: `${subject.replace(/\s+/g, '').toLowerCase()}@demo.com`,
        password: await bcrypt.hash('pass123', 12),
        subject,
        role: 'teacher',
        department: 'General',
        isActive: true
      });
      console.log(`👩‍🏫 Created ${teacher.name} (${teacher.email})`);
    }

    console.log('\n🎉 Teachers reset complete.');
    console.log('🔑 Login password for all users: pass123');
  } catch (err) {
    console.error('❌ Seed error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

run();


