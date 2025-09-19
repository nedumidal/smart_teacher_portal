const express = require('express');
const { body, validationResult } = require('express-validator');
const Teacher = require('../models/Teacher');
const Leave = require('../models/Leave');
const { protect, isTeacher } = require('../middleware/auth');
const { recommendSubstitutes, assignSubstitutes } = require('../utils/recommendSubstitutes');

const router = express.Router();

// Apply middleware to all routes
router.use(protect);
router.use(isTeacher);

// @desc    Apply for leave
// @route   POST /api/teachers/apply-leave
// @access  Private (Teachers only)
router.post('/apply-leave', [
  body('date').isISO8601().withMessage('Please provide a valid date'),
  body('reason').trim().isLength({ min: 10, max: 500 }).withMessage('Reason must be between 10 and 500 characters'),
  body('leaveType').optional().isIn(['sick', 'personal', 'medical', 'other']).withMessage('Invalid leave type'),
  body('duration').optional().isIn(['half-day', 'full-day', 'multiple-days']).withMessage('Invalid duration'),
  body('endDate').optional().isISO8601().withMessage('Please provide a valid end date')
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

    const { date, reason, leaveType, duration, endDate } = req.body;

    // Check if date is in the future
    const leaveDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (leaveDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Leave date cannot be in the past'
      });
    }

    // Check if teacher already has a leave on this date
    const existingLeave = await Leave.findOne({
      teacherId: req.user._id,
      date: leaveDate,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingLeave) {
      return res.status(400).json({
        success: false,
        message: 'You already have a leave request for this date'
      });
    }

    // Create leave request
    const leave = await Leave.create({
      teacherId: req.user._id,
      date: leaveDate,
      reason,
      leaveType,
      duration,
      endDate: endDate ? new Date(endDate) : undefined
    });

    // Get recommendations for substitutes
    const recommendations = await recommendSubstitutes(
      req.user.subject,
      leaveDate,
      leave._id,
      3
    );

    if (recommendations.length > 0) {
      // Assign substitutes to the leave request
      await assignSubstitutes(leave._id, recommendations);
      
      // Populate the leave with substitute information
      const populatedLeave = await Leave.findById(leave._id)
        .populate('substitutes.teacherId', 'name email subject')
        .populate('teacherId', 'name email subject');

      // Emit real-time notification to recommended teachers
      const io = req.app.get('io');
      recommendations.forEach(rec => {
        io.to(`teacher_${rec.teacherId}`).emit('substitution_request', {
          leaveId: leave._id,
          teacherName: req.user.name,
          subject: req.user.subject,
          date: leaveDate,
          reason
        });
      });

      res.status(201).json({
        success: true,
        message: 'Leave request submitted successfully with substitute recommendations',
        data: populatedLeave
      });
    } else {
      res.status(201).json({
        success: true,
        message: 'Leave request submitted successfully. No substitute teachers available.',
        data: leave
      });
    }
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while applying for leave',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Accept substitution request
// @route   POST /api/teachers/accept-substitution/:leaveId
// @access  Private (Teachers only)
router.post('/accept-substitution/:leaveId', async (req, res) => {
  try {
    const { leaveId } = req.params;

    // Find the leave request
    const leave = await Leave.findById(leaveId)
      .populate('teacherId', 'name email subject')
      .populate('substitutes.teacherId', 'name email subject');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Check if this teacher is in the substitutes list
    const substituteIndex = leave.substitutes.findIndex(
      sub => sub.teacherId._id.toString() === req.user._id.toString()
    );

    if (substituteIndex === -1) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to accept this substitution'
      });
    }

    // Check if substitution is already accepted by someone else
    if (leave.finalSubstitute) {
      return res.status(400).json({
        success: false,
        message: 'This substitution has already been accepted by another teacher'
      });
    }

    // Check if this teacher has already responded
    if (leave.substitutes[substituteIndex].status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'You have already responded to this substitution request'
      });
    }

    // Accept the substitution
    leave.substitutes[substituteIndex].status = 'accepted';
    leave.substitutes[substituteIndex].responseDate = new Date();
    leave.finalSubstitute = req.user._id;

    // Reject all other pending substitutes
    leave.substitutes.forEach((sub, index) => {
      if (index !== substituteIndex && sub.status === 'pending') {
        sub.status = 'rejected';
        sub.responseDate = new Date();
      }
    });

    await leave.save();

    // Emit real-time notification to the original teacher
    const io = req.app.get('io');
    io.to(`teacher_${leave.teacherId._id}`).emit('substitution_accepted', {
      leaveId: leave._id,
      substituteName: req.user.name,
      substituteEmail: req.user.email
    });

    res.json({
      success: true,
      message: 'Substitution accepted successfully',
      data: leave
    });
  } catch (error) {
    console.error('Accept substitution error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while accepting substitution',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Reject substitution request
// @route   POST /api/teachers/reject-substitution/:leaveId
// @access  Private (Teachers only)
router.post('/reject-substitution/:leaveId', async (req, res) => {
  try {
    const { leaveId } = req.params;

    // Find the leave request
    const leave = await Leave.findById(leaveId);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Check if this teacher is in the substitutes list
    const substituteIndex = leave.substitutes.findIndex(
      sub => sub.teacherId.toString() === req.user._id.toString()
    );

    if (substituteIndex === -1) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to reject this substitution'
      });
    }

    // Check if substitution is already accepted by someone else
    if (leave.finalSubstitute) {
      return res.status(400).json({
        success: false,
        message: 'This substitution has already been accepted by another teacher'
      });
    }

    // Check if this teacher has already responded
    if (leave.substitutes[substituteIndex].status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'You have already responded to this substitution request'
      });
    }

    // Reject the substitution
    leave.substitutes[substituteIndex].status = 'rejected';
    leave.substitutes[substituteIndex].responseDate = new Date();

    await leave.save();

    res.json({
      success: true,
      message: 'Substitution rejected successfully',
      data: leave
    });
  } catch (error) {
    console.error('Reject substitution error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting substitution',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Get teacher's leave history
// @route   GET /api/teachers/my-leaves
// @access  Private (Teachers only)
router.get('/my-leaves', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const query = { teacherId: req.user._id };
    if (status) {
      query.status = status;
    }

    const leaves = await Leave.find(query)
      .populate('substitutes.teacherId', 'name email subject')
      .populate('finalSubstitute', 'name email subject')
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
      message: 'Server error while fetching leave history',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Get substitution requests for teacher
// @route   GET /api/teachers/substitution-requests
// @access  Private (Teachers only)
router.get('/substitution-requests', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const query = { 'substitutes.teacherId': req.user._id };
    if (status) {
      query['substitutes.status'] = status;
    }

    const leaves = await Leave.find(query)
      .populate('teacherId', 'name email subject')
      .populate('substitutes.teacherId', 'name email subject')
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
    console.error('Get substitution requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching substitution requests',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Update teacher availability
// @route   PUT /api/teachers/availability
// @access  Private (Teachers only)
router.put('/availability', [
  body('available').isBoolean().withMessage('Available must be a boolean value'),
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

    const { available, workload } = req.body;
    const updateFields = { available };

    if (workload !== undefined) {
      updateFields.workload = workload;
    }

    const updatedTeacher = await Teacher.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Availability updated successfully',
      data: updatedTeacher
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating availability',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Get teacher details
// @route   GET /api/teachers/:id
// @access  Private (Teachers only - can get own details)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Teachers can only get their own details
    if (id !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own details'
      });
    }

    const teacher = await Teacher.findById(id).select('-password');
    
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
    console.error('Get teacher details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching teacher details',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Get teacher statistics
// @route   GET /api/teachers/stats
// @access  Private (Teachers only)
router.get('/stats', async (req, res) => {
  try {
    const teacherId = req.user._id;

    // Get leave statistics
    const totalLeaves = await Leave.countDocuments({ teacherId });
    const approvedLeaves = await Leave.countDocuments({ teacherId, status: 'approved' });
    const pendingLeaves = await Leave.countDocuments({ teacherId, status: 'pending' });
    const rejectedLeaves = await Leave.countDocuments({ teacherId, status: 'rejected' });

    // Get substitution statistics (how many times this teacher has been a substitute)
    const substitutions = await Leave.countDocuments({
      'substitutes.teacherId': teacherId,
      'substitutes.status': 'accepted'
    });

    res.json({
      success: true,
      data: {
        totalLeaves,
        approvedLeaves,
        pendingLeaves,
        rejectedLeaves,
        substitutions
      }
    });
  } catch (error) {
    console.error('Get teacher stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching teacher statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Get teacher timetable
// @route   GET /api/teachers/:id/timetable
// @access  Private (Teachers only - can get own timetable)
router.get('/:id/timetable', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Teachers can only get their own timetable
    if (id !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own timetable'
      });
    }

    const teacher = await Teacher.findById(id).select('assignedPeriods');
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Convert assigned periods to timetable format
    const timetable = [];
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    days.forEach(day => {
      const dayPeriods = teacher.assignedPeriods
        .filter(period => period.day === day)
        .map(period => ({
          periodNumber: period.periodNumber,
          subject: period.subject,
          className: period.classId?.name || 'Unknown Class',
          room: period.room,
          isSubstitution: period.isSubstitution,
          originalTeacherId: period.originalTeacherId
        }))
        .sort((a, b) => a.periodNumber - b.periodNumber);

      if (dayPeriods.length > 0) {
        timetable.push({
          day,
          periods: dayPeriods
        });
      }
    });

    res.json({
      success: true,
      data: timetable
    });
  } catch (error) {
    console.error('Get teacher timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching teacher timetable',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

module.exports = router;
