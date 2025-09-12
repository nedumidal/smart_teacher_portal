const express = require('express');
const Leave = require('../models/Leave');
const Teacher = require('../models/Teacher');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply middleware to all routes
router.use(protect);

// @desc    Get all leaves (admin only)
// @route   GET /api/leaves/all
// @access  Private (Admin only)
router.get('/all', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const leaves = await Leave.find({})
      .populate('teacherId', 'name subject department')
      .populate('finalSubstitute', 'name subject')
      .sort({ date: -1 });

    // Format the response to include teacher name
    const formattedLeaves = leaves.map(leave => ({
      _id: leave._id,
      teacherId: leave.teacherId._id,
      teacherName: leave.teacherId.name,
      subject: leave.teacherId.subject,
      date: leave.date,
      reason: leave.reason,
      leaveType: leave.leaveType,
      duration: leave.duration,
      endDate: leave.endDate,
      status: leave.status,
      finalSubstitute: leave.finalSubstitute
    }));

    res.json({
      success: true,
      data: formattedLeaves
    });
  } catch (error) {
    console.error('Get all leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching leaves',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Get pending leaves (admin only)
// @route   GET /api/leaves/pending
// @access  Private (Admin only)
router.get('/pending', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const pendingLeaves = await Leave.find({ status: 'pending' })
      .populate('teacherId', 'name subject department')
      .sort({ date: 1 });

    // Format the response to include teacher name
    const formattedLeaves = pendingLeaves.map(leave => ({
      _id: leave._id,
      teacherId: leave.teacherId._id,
      teacherName: leave.teacherId.name,
      subject: leave.teacherId.subject,
      date: leave.date,
      reason: leave.reason,
      leaveType: leave.leaveType,
      duration: leave.duration,
      endDate: leave.endDate
    }));

    res.json({
      success: true,
      data: formattedLeaves
    });
  } catch (error) {
    console.error('Get pending leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending leaves',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Get approved leaves (admin only)
// @route   GET /api/leaves/approved
// @access  Private (Admin only)
router.get('/approved', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const approvedLeaves = await Leave.find({ 
      status: 'approved',
      $or: [
        { finalSubstitute: { $exists: false } },
        { finalSubstitute: null }
      ]
    })
      .populate('teacherId', 'name subject department')
      .sort({ date: 1 });

    // Format the response to include teacher name
    const formattedLeaves = approvedLeaves.map(leave => ({
      _id: leave._id,
      teacherId: leave.teacherId._id,
      teacherName: leave.teacherId.name,
      subject: leave.teacherId.subject,
      date: leave.date,
      reason: leave.reason,
      leaveType: leave.leaveType,
      duration: leave.duration,
      endDate: leave.endDate
    }));

    res.json({
      success: true,
      data: formattedLeaves
    });
  } catch (error) {
    console.error('Get approved leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching approved leaves',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Get leave by ID
// @route   GET /api/leaves/:id
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate('teacherId', 'name email subject department')
      .populate('substitutes.teacherId', 'name email subject')
      .populate('finalSubstitute', 'name email subject')
      .populate('approvedBy', 'name email');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    res.json({
      success: true,
      data: leave
    });
  } catch (error) {
    console.error('Get leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching leave',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Cancel leave request
// @route   PUT /api/leaves/:id/cancel
// @access  Private (Leave owner only)
router.put('/:id/cancel', async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Check if user owns this leave request
    if (leave.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own leave requests'
      });
    }

    // Check if leave can be cancelled
    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending leave requests can be cancelled'
      });
    }

    // Check if leave date is in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (leave.date <= today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel leave requests for today or past dates'
      });
    }

    // Cancel the leave
    leave.status = 'cancelled';
    await leave.save();

    res.json({
      success: true,
      message: 'Leave request cancelled successfully',
      data: leave
    });
  } catch (error) {
    console.error('Cancel leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling leave',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Get leaves by date range
// @route   GET /api/leaves/date-range
// @access  Private
router.get('/date-range', async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const query = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (status) {
      query.status = status;
    }

    const leaves = await Leave.find(query)
      .populate('teacherId', 'name subject')
      .populate('finalSubstitute', 'name subject')
      .sort({ date: 1 });

    res.json({
      success: true,
      data: leaves
    });
  } catch (error) {
    console.error('Get leaves by date range error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching leaves by date range',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Get leaves by subject
// @route   GET /api/leaves/subject/:subject
// @access  Private
router.get('/subject/:subject', async (req, res) => {
  try {
    const { subject } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    
    // Find teachers with the specified subject
    const teachers = await Teacher.find({ 
      subject: { $regex: subject, $options: 'i' },
      role: 'teacher'
    }).select('_id');
    
    const teacherIds = teachers.map(t => t._id);
    query.teacherId = { $in: teacherIds };

    if (status) {
      query.status = status;
    }

    const leaves = await Leave.find(query)
      .populate('teacherId', 'name email subject')
      .populate('finalSubstitute', 'name email subject')
      .sort({ date: -1 })
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
    console.error('Get leaves by subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching leaves by subject',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @desc    Approve leave request (admin only)
// @route   PUT /api/leaves/:id/approve
// @access  Private (Admin only)
router.put('/:id/approve', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending leave requests can be approved'
      });
    }

    // Approve the leave
    leave.status = 'approved';
    leave.approvedBy = req.user._id;
    leave.approvedAt = new Date();
    await leave.save();

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

// @desc    Reject leave request (admin only)
// @route   PUT /api/leaves/:id/reject
// @access  Private (Admin only)
router.put('/:id/reject', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { adminNotes } = req.body;
    const leave = await Leave.findById(req.params.id);
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending leave requests can be rejected'
      });
    }

    // Reject the leave
    leave.status = 'rejected';
    leave.approvedBy = req.user._id;
    leave.approvedAt = new Date();
    if (adminNotes) {
      leave.adminNotes = adminNotes;
    }
    await leave.save();

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

// @desc    Get leave statistics
// @route   GET /api/leaves/stats
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: weekAgo } };
    } else if (period === 'month') {
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      dateFilter = { createdAt: { $gte: monthAgo } };
    } else if (period === 'year') {
      const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      dateFilter = { createdAt: { $gte: yearAgo } };
    }

    const totalLeaves = await Leave.countDocuments(dateFilter);
    const pendingLeaves = await Leave.countDocuments({ ...dateFilter, status: 'pending' });
    const approvedLeaves = await Leave.countDocuments({ ...dateFilter, status: 'approved' });
    const rejectedLeaves = await Leave.countDocuments({ ...dateFilter, status: 'rejected' });
    const cancelledLeaves = await Leave.countDocuments({ ...dateFilter, status: 'cancelled' });

    // Get leaves by type
    const leavesByType = await Leave.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$leaveType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get leaves by duration
    const leavesByDuration = await Leave.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$duration', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get average response time for substitutions
    const substitutionStats = await Leave.aggregate([
      { $match: { ...dateFilter, 'substitutes.status': { $in: ['accepted', 'rejected'] } } },
      { $unwind: '$substitutes' },
      { $match: { 'substitutes.status': { $in: ['accepted', 'rejected'] } } },
      {
        $group: {
          _id: null,
          avgResponseTime: {
            $avg: {
              $subtract: ['$substitutes.responseDate', '$createdAt']
            }
          },
          totalResponses: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        period,
        totalLeaves,
        pendingLeaves,
        approvedLeaves,
        rejectedLeaves,
        cancelledLeaves,
        leavesByType,
        leavesByDuration,
        substitutionStats: substitutionStats[0] || { avgResponseTime: 0, totalResponses: 0 }
      }
    });
  } catch (error) {
    console.error('Get leave stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching leave statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

module.exports = router;
