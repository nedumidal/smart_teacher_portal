const mongoose = require('mongoose');
const Department = require('./models/Department');
const Teacher = require('./models/Teacher');
require('dotenv').config();

// New departments to add
const newDepartments = [
  {
    name: 'Artificial Intelligence & Machine Learning',
    code: 'AIML',
    description: 'Department of Artificial Intelligence and Machine Learning focusing on AI algorithms, deep learning, and intelligent systems.',
    headOfDepartment: null
  },
  {
    name: 'Artificial Intelligence & Data Science',
    code: 'AIDS',
    description: 'Department of Artificial Intelligence and Data Science focusing on data analytics, machine learning, and AI applications.',
    headOfDepartment: null
  }
];

const addNewDepartments = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teacher_leave_management');
    console.log('Connected to MongoDB');

    // Check if departments already exist
    for (const deptData of newDepartments) {
      const existingDept = await Department.findOne({ code: deptData.code });
      if (existingDept) {
        console.log(`Department ${deptData.code} already exists, skipping...`);
        continue;
      }

      // Create new department
      const dept = new Department(deptData);
      await dept.save();
      console.log(`Created department: ${deptData.name} (${deptData.code})`);
    }

    console.log('New departments added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding new departments:', error);
    process.exit(1);
  }
};

// Run the function
addNewDepartments();
