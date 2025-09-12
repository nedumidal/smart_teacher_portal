const mongoose = require('mongoose');
const Department = require('./models/Department');
require('dotenv').config();

const checkDepartments = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teacher_leave_management');
    console.log('Connected to MongoDB');

    // Get all departments
    const departments = await Department.find({ isActive: true }).sort({ name: 1 });
    
    console.log('\n=== Available Departments ===');
    departments.forEach((dept, index) => {
      console.log(`${index + 1}. ${dept.name} (${dept.code})`);
      console.log(`   Description: ${dept.description}`);
      console.log('');
    });

    console.log(`Total Departments: ${departments.length}`);
    process.exit(0);
  } catch (error) {
    console.error('Error checking departments:', error);
    process.exit(1);
  }
};

// Run the function
checkDepartments();
