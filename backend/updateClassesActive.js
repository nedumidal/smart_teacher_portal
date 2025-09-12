const mongoose = require('mongoose');
const Class = require('./models/Class');
require('dotenv').config();

const updateClassesActive = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teacher_leave_management');
    console.log('Connected to MongoDB');

    // Update all classes to have isActive: true
    const result = await Class.updateMany(
      { isActive: { $ne: false } }, // Update classes that don't explicitly have isActive: false
      { $set: { isActive: true } }
    );

    console.log(`Updated ${result.modifiedCount} classes to have isActive: true`);

    // Verify the update
    const classes = await Class.find({ isActive: true });
    console.log(`\nTotal active classes: ${classes.length}`);
    
    classes.forEach((cls, index) => {
      console.log(`${index + 1}. ${cls.name} - ${cls.department} - isActive: ${cls.isActive}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error updating classes:', error);
    process.exit(1);
  }
};

// Run the function
updateClassesActive();
