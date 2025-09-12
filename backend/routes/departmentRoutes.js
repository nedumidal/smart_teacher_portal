const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Department = require('../models/Department');
const Teacher = require('../models/Teacher');
const Attendance = require('../models/Attendance');
const Class = require('../models/Class');

// Get all departments
router.get('/', protect, async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true })
      .populate('headOfDepartment', 'name email subject')
      .populate('faculty', 'name email subject department')
      .sort({ name: 1 });

    console.log('Departments found:', departments.length);

    res.json({
      success: true,
      data: departments
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching departments'
    });
  }
});

// Get department by ID with faculty details
router.get('/:id', protect, async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('headOfDepartment', 'name email subject phone')
      .populate('faculty', 'name email subject phone joiningDate leaveBalances attendancePercentage');

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Get today's attendance for all faculty
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendanceRecords = await Attendance.find({
      teacherId: { $in: department.faculty.map(f => f._id) },
      date: today,
      isActive: true
    });

    // Map attendance to faculty
    const facultyWithAttendance = department.faculty.map(faculty => {
      const attendance = attendanceRecords.find(a => a.teacherId.toString() === faculty._id.toString());
      return {
        ...faculty.toObject(),
        todayStatus: attendance ? attendance.status : 'not-marked',
        checkIn: attendance ? attendance.checkIn : null,
        checkOut: attendance ? attendance.checkOut : null
      };
    });

    res.json({
      success: true,
      data: {
        ...department.toObject(),
        faculty: facultyWithAttendance
      }
    });
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching department'
    });
  }
});

// Create new department (admin only)
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { name, code, description, headOfDepartment } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Name and code are required'
      });
    }

    // Check if department already exists
    const existingDept = await Department.findOne({
      $or: [{ name }, { code }]
    });

    if (existingDept) {
      return res.status(400).json({
        success: false,
        message: 'Department with this name or code already exists'
      });
    }

    const department = new Department({
      name,
      code,
      description,
      headOfDepartment
    });

    await department.save();

    res.status(201).json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating department'
    });
  }
});

// Update department (admin only)
router.put('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { name, code, description, headOfDepartment } = req.body;

    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { name, code, description, headOfDepartment },
      { new: true, runValidators: true }
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating department'
    });
  }
});

// Add faculty to department (admin only)
router.post('/:id/faculty', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { teacherId } = req.body;

    if (!teacherId) {
      return res.status(400).json({
        success: false,
        message: 'Teacher ID is required'
      });
    }

    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if teacher is already in this department
    if (department.faculty.includes(teacherId)) {
      return res.status(400).json({
        success: false,
        message: 'Teacher is already in this department'
      });
    }

    department.faculty.push(teacherId);
    department.totalFaculty = department.faculty.length;
    await department.save();

    // Update teacher's department
    await Teacher.findByIdAndUpdate(teacherId, { department: department._id });

    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error('Error adding faculty to department:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding faculty to department'
    });
  }
});

// Remove faculty from department (admin only)
router.delete('/:id/faculty/:teacherId', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    department.faculty = department.faculty.filter(
      id => id.toString() !== req.params.teacherId
    );
    department.totalFaculty = department.faculty.length;
    await department.save();

    // Remove department from teacher
    await Teacher.findByIdAndUpdate(req.params.teacherId, { department: null });

    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error('Error removing faculty from department:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing faculty from department'
    });
  }
});

// Get department classes
router.get('/:id/classes', protect, async (req, res) => {
  try {
    const classes = await Class.find({
      department: req.params.id,
      isActive: true
    }).populate('department', 'name code');

    res.json({
      success: true,
      data: classes
    });
  } catch (error) {
    console.error('Error fetching department classes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching department classes'
    });
  }
});

// Get faculty attendance for a specific date
router.get('/:id/attendance/:date', protect, async (req, res) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    const attendanceRecords = await Attendance.find({
      teacherId: { $in: department.faculty },
      date: targetDate,
      isActive: true
    }).populate('teacherId', 'name email subject');

    res.json({
      success: true,
      data: {
        date: targetDate,
        department: department.name,
        attendance: attendanceRecords
      }
    });
  } catch (error) {
    console.error('Error fetching faculty attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching faculty attendance'
    });
  }
});

module.exports = router;
