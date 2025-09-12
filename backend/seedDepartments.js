const mongoose = require('mongoose');
const Department = require('./models/Department');
const Class = require('./models/Class');
const Teacher = require('./models/Teacher');
require('dotenv').config();

// Sample department data
const sampleDepartments = [
  {
    name: 'Computer Science Engineering',
    code: 'CSE',
    description: 'Department of Computer Science and Engineering focusing on software development, algorithms, and computer systems.',
    headOfDepartment: null // Will be set after teacher creation
  },
  {
    name: 'Electronics & Communication Engineering',
    code: 'ECE',
    description: 'Department of Electronics and Communication Engineering focusing on telecommunications, signal processing, and electronic systems.',
    headOfDepartment: null
  },
  {
    name: 'Mechanical Engineering',
    code: 'MECH',
    description: 'Department of Mechanical Engineering focusing on design, manufacturing, and mechanical systems.',
    headOfDepartment: null
  },
  {
    name: 'Civil Engineering',
    code: 'CIVIL',
    description: 'Department of Civil Engineering focusing on infrastructure, construction, and structural engineering.',
    headOfDepartment: null
  },
  {
    name: 'Information Technology',
    code: 'IT',
    description: 'Department of Information Technology focusing on data management, networking, and IT infrastructure.',
    headOfDepartment: null
  },
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

// Sample class data
const sampleClasses = [
  {
    name: 'CSE 3rd Year',
    department: null, // Will be set after department creation
    academicYear: '2024-25',
    semester: 5,
    strength: 45,
    timetable: []
  },
  {
    name: 'CSE 4th Year',
    department: null,
    academicYear: '2024-25',
    semester: 7,
    strength: 42,
    timetable: []
  },
  {
    name: 'ECE 2nd Year',
    department: null,
    academicYear: '2024-25',
    semester: 3,
    strength: 48,
    timetable: []
  },
  {
    name: 'ECE 3rd Year',
    department: null,
    academicYear: '2024-25',
    semester: 5,
    strength: 46,
    timetable: []
  },
  {
    name: 'MECH 2nd Year',
    department: null,
    academicYear: '2024-25',
    semester: 3,
    strength: 44,
    timetable: []
  },
  {
    name: 'AIML 2nd Year',
    department: null,
    academicYear: '2024-25',
    semester: 3,
    strength: 40,
    timetable: []
  },
  {
    name: 'AIML 3rd Year',
    department: null,
    academicYear: '2024-25',
    semester: 5,
    strength: 38,
    timetable: []
  },
  {
    name: 'AIDS 2nd Year',
    department: null,
    academicYear: '2024-25',
    semester: 3,
    strength: 42,
    timetable: []
  },
  {
    name: 'AIDS 3rd Year',
    department: null,
    academicYear: '2024-25',
    semester: 5,
    strength: 40,
    timetable: []
  }
];

const seedDepartmentsAndClasses = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teacher_leave_management');
    console.log('Connected to MongoDB');

    // Get existing teachers
    const teachers = await Teacher.find({ role: 'teacher' }).limit(10);
    
    if (teachers.length < 5) {
      console.log('Need at least 5 teachers to seed department data');
      return;
    }

    // Clear existing departments and classes
    await Department.deleteMany({});
    await Class.deleteMany({});
    console.log('Cleared existing departments and classes');

    // Create departments
    const departments = [];
    for (let i = 0; i < sampleDepartments.length; i++) {
      const dept = new Department({
        ...sampleDepartments[i],
        headOfDepartment: teachers[i]?._id || null
      });
      departments.push(await dept.save());
    }
    console.log(`Created ${departments.length} departments`);

    // Assign teachers to departments
    for (let i = 0; i < departments.length; i++) {
      const dept = departments[i];
      const deptTeachers = teachers.filter(t => t.subject && 
        (t.subject.toLowerCase().includes('computer') || 
         t.subject.toLowerCase().includes('electronics') || 
         t.subject.toLowerCase().includes('mechanical') || 
         t.subject.toLowerCase().includes('civil') || 
         t.subject.toLowerCase().includes('information')));
      
      // Assign relevant teachers to departments
      if (i < deptTeachers.length) {
        dept.faculty = [deptTeachers[i]._id];
        dept.totalFaculty = 1;
        await dept.save();
        
        // Update teacher's department
        await Teacher.findByIdAndUpdate(deptTeachers[i]._id, { department: dept._id });
      }
    }

    // Create classes
    for (let i = 0; i < sampleClasses.length; i++) {
      const classData = new Class({
        ...sampleClasses[i],
        department: departments[i % departments.length]._id
      });
      await classData.save();
    }
    console.log(`Created ${sampleClasses.length} classes`);

    console.log('Department and class seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding department and class data:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedDepartmentsAndClasses();

