const express = require('express');
const { body, validationResult } = require('express-validator');
const Teacher = require('../models/Teacher');
const Leave = require('../models/Leave');
const { protect, isAdmin } = require('../middleware/auth');
const { recommendSubstitutes, assignSubstitutes } = require('../utils/recommendSubstitutes');

const router = express.Router();

// Apply middleware to all routes
router.use(protect);
router.use(isAdmin);

// @desc    Get all teachers
// @route   GET /api/admin/teachers
// @access  Private (Admin only)
router.get('/teachers', async (req, res) => {
  try {
    const { page = 1, limit = 10, subject, status } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (subject) {
      query.subject = { $regex: subject, $options: 'i' };
    }
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const teachers = await Teacher.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Teacher.countDocuments(query);

    res.json({
      success: true,
      data: teachers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching teachers',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Get teacher by ID
// @route   GET /api/admin/teachers/:id
// @access  Private (Admin only)
router.get('/teachers/:id', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).select('-password');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    res.json({
      success: true,
      data: teacher
    });
  } catch (error) {
    console.error('Get teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching teacher',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Create new teacher
// @route   POST /api/admin/teachers
// @access  Private (Admin only)
router.post('/teachers', [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('role').optional().isIn(['teacher', 'admin']).withMessage('Role must be teacher or admin'),
  body('phone').optional().trim(),
  body('department').optional().trim(),
  body('workload').optional().isInt({ min: 0 }).withMessage('Workload must be a non-negative integer')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { name, email, password, subject, role = 'teacher', phone, department, workload = 0 } = req.body;

    // Check if user already exists
    const existingUser = await Teacher.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create teacher
    const teacher = await Teacher.create({
      name,
      email,
      password,
      subject,
      role,
      phone,
      department,
      workload
    });

    res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      data: {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        subject: teacher.subject,
        role: teacher.role,
        phone: teacher.phone,
        department: teacher.department,
        workload: teacher.workload
      }
    });
  } catch (error) {
    console.error('Create teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating teacher',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Update teacher
// @route   PUT /api/admin/teachers/:id
// @access  Private (Admin only)
router.put('/teachers/:id', [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('subject').optional().trim().notEmpty().withMessage('Subject cannot be empty'),
  body('phone').optional().trim(),
  body('department').optional().trim(),
  body('workload').optional().isInt({ min: 0 }).withMessage('Workload must be a non-negative integer'),
  body('available').optional().isBoolean().withMessage('Available must be a boolean value'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean value')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { name, subject, phone, department, workload, available, isActive } = req.body;
    const updateFields = {};

    if (name !== undefined) updateFields.name = name;
    if (subject !== undefined) updateFields.subject = subject;
    if (phone !== undefined) updateFields.phone = phone;
    if (department !== undefined) updateFields.department = department;
    if (workload !== undefined) updateFields.workload = workload;
    if (available !== undefined) updateFields.available = available;
    if (isActive !== undefined) updateFields.isActive = isActive;

    const updatedTeacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedTeacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    res.json({
      success: true,
      message: 'Teacher updated successfully',
      data: updatedTeacher
    });
  } catch (error) {
    console.error('Update teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating teacher',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Delete teacher
// @route   DELETE /api/admin/teachers/:id
// @access  Private (Admin only)
router.delete('/teachers/:id', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Check if teacher has any active leaves
    const activeLeaves = await Leave.findOne({
      teacherId: req.params.id,
      status: { $in: ['pending', 'approved'] }
    });

    if (activeLeaves) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete teacher with active leave requests'
      });
    }

    // Soft delete - set isActive to false
    await Teacher.findByIdAndUpdate(req.params.id, { isActive: false });

    res.json({
      success: true,
      message: 'Teacher deactivated successfully'
    });
  } catch (error) {
    console.error('Delete teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting teacher',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Get all leave requests
// @route   GET /api/admin/leaves
// @access  Private (Admin only)
router.get('/leaves', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, subject, date } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) {
      query.status = status;
    }
    if (subject) {
      query['teacherId.subject'] = { $regex: subject, $options: 'i' };
    }
    if (date) {
      const searchDate = new Date(date);
      query.date = {
        $gte: searchDate,
        $lt: new Date(searchDate.getTime() + 24 * 60 * 60 * 1000)
      };
    }

    const leaves = await Leave.find(query)
      .populate('teacherId', 'name email subject department')
      .populate('substitutes.teacherId', 'name email subject')
      .populate('finalSubstitute', 'name email subject')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Leave.countDocuments(query);

    res.json({
      success: true,
      data: leaves,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching leaves',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Approve leave request
// @route   POST /api/admin/approve-leave/:id
// @access  Private (Admin only)
router.post('/approve-leave/:id', [
  body('adminNotes').optional().trim().isLength({ max: 1000 }).withMessage('Admin notes cannot exceed 1000 characters')
], async (req, res) => {
  try {
    const { adminNotes } = req.body;
    const { id } = req.params;

    const leave = await Leave.findById(id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Leave request is not pending'
      });
    }

    // Update leave status
    leave.status = 'approved';
    leave.approvedBy = req.user._id;
    leave.approvedAt = new Date();
    if (adminNotes) {
      leave.adminNotes = adminNotes;
    }

    await leave.save();

    // Emit real-time notification to the teacher
    const io = req.app.get('io');
    io.to(`teacher_${leave.teacherId}`).emit('leave_approved', {
      leaveId: leave._id,
      adminName: req.user.name
    });

    res.json({
      success: true,
      message: 'Leave request approved successfully',
      data: leave
    });
  } catch (error) {
    console.error('Approve leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while approving leave',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Reject leave request
// @route   POST /api/admin/reject-leave/:id
// @access  Private (Admin only)
router.post('/reject-leave/:id', [
  body('adminNotes').trim().isLength({ min: 10, max: 1000 }).withMessage('Admin notes must be between 10 and 1000 characters')
], async (req, res) => {
  try {
    const { adminNotes } = req.body;
    const { id } = req.params;

    const leave = await Leave.findById(id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Leave request is not pending'
      });
    }

    // Update leave status
    leave.status = 'rejected';
    leave.approvedBy = req.user._id;
    leave.approvedAt = new Date();
    leave.adminNotes = adminNotes;

    await leave.save();

    // Emit real-time notification to the teacher
    const io = req.app.get('io');
    io.to(`teacher_${leave.teacherId}`).emit('leave_rejected', {
      leaveId: leave._id,
      adminName: req.user.name,
      reason: adminNotes
    });

    res.json({
      success: true,
      message: 'Leave request rejected successfully',
      data: leave
    });
  } catch (error) {
    console.error('Reject leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting leave',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Assign substitute manually
// @route   POST /api/admin/assign-substitute/:leaveId
// @access  Private (Admin only)
router.post('/assign-substitute/:leaveId', [
  body('teacherId').isMongoId().withMessage('Valid teacher ID is required')
], async (req, res) => {
  try {
    const { teacherId } = req.body;
    const { leaveId } = req.params;

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const leave = await Leave.findById(leaveId);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Check if teacher exists and is available
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    if (!teacher.available || !teacher.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Teacher is not available for substitution'
      });
    }

    // Check if teacher is already assigned
    const existingAssignment = leave.substitutes.find(
      sub => sub.teacherId.toString() === teacherId
    );

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: 'Teacher is already assigned to this leave request'
      });
    }

    // Add teacher to substitutes
    leave.substitutes.push({
      teacherId: teacherId,
      status: 'pending',
      responseDate: null
    });

    await leave.save();

    // Emit real-time notification to the assigned teacher
    const io = req.app.get('io');
    io.to(`teacher_${teacherId}`).emit('substitution_request', {
      leaveId: leave._id,
      teacherName: leave.teacherId.name,
      subject: leave.teacherId.subject,
      date: leave.date,
      reason: leave.reason
    });

    res.json({
      success: true,
      message: 'Substitute assigned successfully',
      data: leave
    });
  } catch (error) {
    console.error('Assign substitute error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while assigning substitute',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard-stats
// @access  Private (Admin only)
router.get('/dashboard-stats', async (req, res) => {
  try {
    const totalTeachers = await Teacher.countDocuments({ role: 'teacher' });
    const activeTeachers = await Teacher.countDocuments({ role: 'teacher', isActive: true });
    const availableTeachers = await Teacher.countDocuments({ role: 'teacher', isActive: true, available: true });

    const totalLeaves = await Leave.countDocuments();
    const pendingLeaves = await Leave.countDocuments({ status: 'pending' });
    const approvedLeaves = await Leave.countDocuments({ status: 'approved' });
    const rejectedLeaves = await Leave.countDocuments({ status: 'rejected' });

    // Get leaves by subject
    const leavesBySubject = await Leave.aggregate([
      { $lookup: { from: 'teachers', localField: 'teacherId', foreignField: '_id', as: 'teacher' } },
      { $unwind: '$teacher' },
      { $group: { _id: '$teacher.subject', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get recent leaves
    const recentLeaves = await Leave.find()
      .populate('teacherId', 'name subject')
      .populate('finalSubstitute', 'name subject')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        teachers: {
          total: totalTeachers,
          active: activeTeachers,
          available: availableTeachers
        },
        leaves: {
          total: totalLeaves,
          pending: pendingLeaves,
          approved: approvedLeaves,
          rejected: rejectedLeaves
        },
        leavesBySubject,
        recentLeaves
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

module.exports = router;
