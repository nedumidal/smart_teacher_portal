const mongoose = require('mongoose');
const Teacher = require('./models/Teacher');
const Timetable = require('./models/Timetable');
const Substitution = require('./models/Substitution');
const Attendance = require('./models/Attendance');
require('dotenv').config();

// Sample timetable data
const sampleTimetables = [
  // Teacher 1 - Mathematics
  {
    teacherId: null, // Will be set after teacher creation
    day: 'monday',
    periods: [
      { periodNumber: 1, subject: 'Mathematics', className: 'Class 10A' },
      { periodNumber: 3, subject: 'Mathematics', className: 'Class 9B' },
      { periodNumber: 5, subject: 'Mathematics', className: 'Class 11A' }
    ]
  },
  {
    teacherId: null,
    day: 'tuesday',
    periods: [
      { periodNumber: 2, subject: 'Mathematics', className: 'Class 10B' },
      { periodNumber: 4, subject: 'Mathematics', className: 'Class 9A' },
      { periodNumber: 6, subject: 'Mathematics', className: 'Class 12A' }
    ]
  },
  {
    teacherId: null,
    day: 'wednesday',
    periods: [
      { periodNumber: 1, subject: 'Mathematics', className: 'Class 10A' },
      { periodNumber: 3, subject: 'Mathematics', className: 'Class 9B' },
      { periodNumber: 7, subject: 'Mathematics', className: 'Class 11B' }
    ]
  },
  {
    teacherId: null,
    day: 'thursday',
    periods: [
      { periodNumber: 2, subject: 'Mathematics', className: 'Class 10B' },
      { periodNumber: 4, subject: 'Mathematics', className: 'Class 9A' },
      { periodNumber: 6, subject: 'Mathematics', className: 'Class 12A' }
    ]
  },
  {
    teacherId: null,
    day: 'friday',
    periods: [
      { periodNumber: 1, subject: 'Mathematics', className: 'Class 10A' },
      { periodNumber: 3, subject: 'Mathematics', className: 'Class 9B' },
      { periodNumber: 5, subject: 'Mathematics', className: 'Class 11A' }
    ]
  },
  {
    teacherId: null,
    day: 'saturday',
    periods: [
      { periodNumber: 2, subject: 'Mathematics', className: 'Class 10B' },
      { periodNumber: 4, subject: 'Mathematics', className: 'Class 9A' }
    ]
  },

  // Teacher 2 - Science
  {
    teacherId: null,
    day: 'monday',
    periods: [
      { periodNumber: 2, subject: 'Science', className: 'Class 8A' },
      { periodNumber: 4, subject: 'Science', className: 'Class 7B' },
      { periodNumber: 6, subject: 'Science', className: 'Class 9A' }
    ]
  },
  {
    teacherId: null,
    day: 'tuesday',
    periods: [
      { periodNumber: 1, subject: 'Science', className: 'Class 8B' },
      { periodNumber: 3, subject: 'Science', className: 'Class 7A' },
      { periodNumber: 5, subject: 'Science', className: 'Class 9B' }
    ]
  },
  {
    teacherId: null,
    day: 'wednesday',
    periods: [
      { periodNumber: 2, subject: 'Science', className: 'Class 8A' },
      { periodNumber: 4, subject: 'Science', className: 'Class 7B' },
      { periodNumber: 6, subject: 'Science', className: 'Class 9A' }
    ]
  },
  {
    teacherId: null,
    day: 'thursday',
    periods: [
      { periodNumber: 1, subject: 'Science', className: 'Class 8B' },
      { periodNumber: 3, subject: 'Science', className: 'Class 7A' },
      { periodNumber: 5, subject: 'Science', className: 'Class 9B' }
    ]
  },
  {
    teacherId: null,
    day: 'friday',
    periods: [
      { periodNumber: 2, subject: 'Science', className: 'Class 8A' },
      { periodNumber: 4, subject: 'Science', className: 'Class 7B' },
      { periodNumber: 6, subject: 'Science', className: 'Class 9A' }
    ]
  },
  {
    teacherId: null,
    day: 'saturday',
    periods: [
      { periodNumber: 1, subject: 'Science', className: 'Class 8B' },
      { periodNumber: 3, subject: 'Science', className: 'Class 7A' }
    ]
  },

  // Teacher 3 - English (more free periods for substitution)
  {
    teacherId: null,
    day: 'monday',
    periods: [
      { periodNumber: 1, subject: 'English', className: 'Class 10A' },
      { periodNumber: 5, subject: 'English', className: 'Class 11A' }
    ]
  },
  {
    teacherId: null,
    day: 'tuesday',
    periods: [
      { periodNumber: 2, subject: 'English', className: 'Class 10B' },
      { periodNumber: 6, subject: 'English', className: 'Class 12A' }
    ]
  },
  {
    teacherId: null,
    day: 'wednesday',
    periods: [
      { periodNumber: 3, subject: 'English', className: 'Class 9A' },
      { periodNumber: 7, subject: 'English', className: 'Class 11B' }
    ]
  },
  {
    teacherId: null,
    day: 'thursday',
    periods: [
      { periodNumber: 4, subject: 'English', className: 'Class 9B' },
      { periodNumber: 6, subject: 'English', className: 'Class 12A' }
    ]
  },
  {
    teacherId: null,
    day: 'friday',
    periods: [
      { periodNumber: 1, subject: 'English', className: 'Class 10A' },
      { periodNumber: 5, subject: 'English', className: 'Class 11A' }
    ]
  },
  {
    teacherId: null,
    day: 'saturday',
    periods: [
      { periodNumber: 2, subject: 'English', className: 'Class 10B' }
    ]
  }
];

const seedTimetableData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teacher_leave_management');
    console.log('Connected to MongoDB');

    // Get existing teachers
    const teachers = await Teacher.find({ role: 'teacher' }).limit(3);
    
    if (teachers.length < 3) {
      console.log('Need at least 3 teachers to seed timetable data');
      return;
    }

    // Clear existing timetables
    await Timetable.deleteMany({});
    console.log('Cleared existing timetables');

    // Assign teachers to timetables
    let teacherIndex = 0;
    for (let i = 0; i < sampleTimetables.length; i++) {
      if (i % 6 === 0 && i > 0) {
        teacherIndex++;
      }
      sampleTimetables[i].teacherId = teachers[teacherIndex]._id;
    }

    // Create timetables
    const timetables = await Timetable.insertMany(sampleTimetables);
    console.log(`Created ${timetables.length} timetable entries`);

    // Update teacher leave balances and attendance
    for (const teacher of teachers) {
             await Teacher.findByIdAndUpdate(teacher._id, {
         leaveBalances: {
           casualLeave: 8,
           medicalLeave: 10,
           earnedLeave: 2.5
         },
         attendancePercentage: 95 + Math.floor(Math.random() * 5) // 95-99%
       });
    }

    console.log('Updated teacher leave balances and attendance');

    // Create some sample attendance records
    const attendanceRecords = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      for (const teacher of teachers) {
        const status = Math.random() > 0.1 ? 'present' : 'absent';
        attendanceRecords.push({
          teacherId: teacher._id,
          date,
          status,
          checkIn: status === 'present' ? new Date(date.getTime() + 8 * 60 * 60 * 1000) : null,
          checkOut: status === 'present' ? new Date(date.getTime() + 16 * 60 * 60 * 1000) : null
        });
      }
    }

    await Attendance.insertMany(attendanceRecords);
    console.log(`Created ${attendanceRecords.length} attendance records`);

    console.log('Timetable seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding timetable data:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedTimetableData();
