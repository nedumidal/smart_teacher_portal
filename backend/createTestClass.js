const mongoose = require('mongoose');
const Class = require('./models/Class');
const Department = require('./models/Department');
require('dotenv').config();

const createTestClass = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teacher_leave_management');
    console.log('Connected to MongoDB');

    // Get AIML department
    const aimlDept = await Department.findOne({ code: 'AIML' });
    if (!aimlDept) {
      console.log('AIML department not found');
      process.exit(1);
    }

    // Create test class
    const testClass = new Class({
      name: 'AIML 2nd Year',
      department: aimlDept._id,
      academicYear: '2025',
      semester: 1,
      section: 'A',
      strength: 64,
      timetable: []
    });

    await testClass.save();
    console.log('Test class created successfully:', testClass.name);
    process.exit(0);
  } catch (error) {
    console.error('Error creating test class:', error);
    process.exit(1);
  }
};

// Run the function
createTestClass();
