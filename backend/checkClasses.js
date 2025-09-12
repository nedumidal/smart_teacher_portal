const mongoose = require('mongoose');
const Class = require('./models/Class');
const Department = require('./models/Department');
require('dotenv').config();

const checkClasses = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teacher_leave_management');
    console.log('Connected to MongoDB');

    // Get all classes
    const classes = await Class.find({}).populate('department', 'name code');
    
    console.log('\n=== Available Classes ===');
    if (classes.length === 0) {
      console.log('No classes found in the database.');
    } else {
      classes.forEach((cls, index) => {
        console.log(`${index + 1}. ${cls.name}`);
        console.log(`   Department: ${cls.department ? cls.department.name : 'Unknown'}`);
        console.log(`   Academic Year: ${cls.academicYear}`);
        console.log(`   Semester: ${cls.semester}`);
        console.log(`   Section: ${cls.section || 'Not specified'}`);
        console.log(`   Strength: ${cls.strength || 'Not specified'}`);
        console.log(`   Timetable: ${cls.timetable && cls.timetable.length > 0 ? 'Has timetable' : 'No timetable'}`);
        console.log('');
      });
    }

    console.log(`Total Classes: ${classes.length}`);
    process.exit(0);
  } catch (error) {
    console.error('Error checking classes:', error);
    process.exit(1);
  }
};

// Run the function
checkClasses();
