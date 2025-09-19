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

// Sample class data with sections
const sampleClasses = [
  // CSE Classes
  {
    name: 'CSE-1A',
    department: null, // Will be set after department creation
    academicYear: '2024-25',
    semester: 1,
    strength: 60,
    section: 'A',
    timetable: []
  },
  {
    name: 'CSE-1B',
    department: null,
    academicYear: '2024-25',
    semester: 1,
    strength: 58,
    section: 'B',
    timetable: []
  },
  {
    name: 'CSE-2A',
    department: null,
    academicYear: '2024-25',
    semester: 3,
    strength: 55,
    section: 'A',
    timetable: []
  },
  {
    name: 'CSE-3A',
    department: null,
    academicYear: '2024-25',
    semester: 5,
    strength: 52,
    section: 'A',
    timetable: []
  },
  {
    name: 'CSE-4A',
    department: null,
    academicYear: '2024-25',
    semester: 7,
    strength: 48,
    section: 'A',
    timetable: []
  },
  // AIML Classes
  {
    name: 'AIML-1A',
    department: null,
    academicYear: '2024-25',
    semester: 1,
    strength: 45,
    section: 'A',
    timetable: []
  },
  {
    name: 'AIML-2A',
    department: null,
    academicYear: '2024-25',
    semester: 3,
    strength: 42,
    section: 'A',
    timetable: []
  },
  {
    name: 'AIML-3A',
    department: null,
    academicYear: '2024-25',
    semester: 5,
    strength: 40,
    section: 'A',
    timetable: []
  },
  // IT Classes
  {
    name: 'IT-1A',
    department: null,
    academicYear: '2024-25',
    semester: 1,
    strength: 50,
    section: 'A',
    timetable: []
  },
  {
    name: 'IT-2A',
    department: null,
    academicYear: '2024-25',
    semester: 3,
    strength: 48,
    section: 'A',
    timetable: []
  },
  {
    name: 'IT-3A',
    department: null,
    academicYear: '2024-25',
    semester: 5,
    strength: 45,
    section: 'A',
    timetable: []
  },
  // ECE Classes
  {
    name: 'ECE-1A',
    department: null,
    academicYear: '2024-25',
    semester: 1,
    strength: 55,
    section: 'A',
    timetable: []
  },
  {
    name: 'ECE-2A',
    department: null,
    academicYear: '2024-25',
    semester: 3,
    strength: 52,
    section: 'A',
    timetable: []
  },
  {
    name: 'ECE-3A',
    department: null,
    academicYear: '2024-25',
    semester: 5,
    strength: 50,
    section: 'A',
    timetable: []
  },
  // MECH Classes
  {
    name: 'MECH-1A',
    department: null,
    academicYear: '2024-25',
    semester: 1,
    strength: 60,
    section: 'A',
    timetable: []
  },
  {
    name: 'MECH-2A',
    department: null,
    academicYear: '2024-25',
    semester: 3,
    strength: 58,
    section: 'A',
    timetable: []
  },
  {
    name: 'MECH-3A',
    department: null,
    academicYear: '2024-25',
    semester: 5,
    strength: 55,
    section: 'A',
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

    // Create classes and assign to appropriate departments
    for (const classData of sampleClasses) {
      let departmentId = null;
      
      // Find the appropriate department based on class name
      if (classData.name.startsWith('CSE')) {
        departmentId = departments.find(d => d.code === 'CSE')?._id;
      } else if (classData.name.startsWith('AIML')) {
        departmentId = departments.find(d => d.code === 'AIML')?._id;
      } else if (classData.name.startsWith('IT')) {
        departmentId = departments.find(d => d.code === 'IT')?._id;
      } else if (classData.name.startsWith('ECE')) {
        departmentId = departments.find(d => d.code === 'ECE')?._id;
      } else if (classData.name.startsWith('MECH')) {
        departmentId = departments.find(d => d.code === 'MECH')?._id;
      } else if (classData.name.startsWith('CIVIL')) {
        departmentId = departments.find(d => d.code === 'CIVIL')?._id;
      } else if (classData.name.startsWith('AIDS')) {
        departmentId = departments.find(d => d.code === 'AIDS')?._id;
      }
      
      if (departmentId) {
        const newClass = new Class({
          ...classData,
          department: departmentId
        });
        await newClass.save();
        console.log(`Created class: ${classData.name} in department: ${departments.find(d => d._id.toString() === departmentId.toString())?.name}`);
      }
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

