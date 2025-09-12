const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Timetable = require('../models/Timetable');
const Substitution = require('../models/Substitution');
const Teacher = require('../models/Teacher');
const substitutionRecommender = require('../utils/substitutionRecommender');

// Get teacher's timetable
router.get('/teacher/:teacherId', protect, async (req, res) => {
  try {
    const { teacherId } = req.params;
    const timetables = await Timetable.find({ 
      teacherId, 
      isActive: true 
    }).sort({ day: 1, 'periods.periodNumber': 1 });

    res.json({
      success: true,
      data: timetables
    });
  } catch (error) {
    console.error('Error fetching timetable:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching timetable'
    });
  }
});

// Create or update teacher's timetable
router.post('/teacher/:teacherId', protect, async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { day, periods } = req.body;

    // Validate day
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    if (!validDays.includes(day)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid day'
      });
    }

    // Validate periods
    if (!Array.isArray(periods) || periods.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Periods array is required'
      });
    }

    // Check for duplicate period numbers
    const periodNumbers = periods.map(p => p.periodNumber);
    if (new Set(periodNumbers).size !== periodNumbers.length) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate period numbers are not allowed'
      });
    }

    // Upsert timetable
    const timetable = await Timetable.findOneAndUpdate(
      { teacherId, day },
      { periods },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      data: timetable
    });
  } catch (error) {
    console.error('Error creating/updating timetable:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating/updating timetable'
    });
  }
});

// Get all timetables (admin only)
router.get('/all', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const timetables = await Timetable.find({ isActive: true })
      .populate('teacherId', 'name subject department')
      .sort({ 'teacherId.name': 1, day: 1 });

    res.json({
      success: true,
      data: timetables
    });
  } catch (error) {
    console.error('Error fetching all timetables:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching timetables'
    });
  }
});

// Get teacher availability for substitution
router.get('/availability/:day/:periodNumber', protect, async (req, res) => {
  try {
    const { day, periodNumber } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    // Get all teachers who are free at this time
    const busyTeachers = await Timetable.aggregate([
      {
        $match: {
          day,
          'periods.periodNumber': parseInt(periodNumber),
          isActive: true
        }
      },
      {
        $group: {
          _id: '$teacherId'
        }
      }
    ]);

    const busyTeacherIds = busyTeachers.map(t => t._id);

    // Get available teachers
    const availableTeachers = await Teacher.find({
      _id: { $nin: busyTeacherIds },
      role: 'teacher',
      isActive: true
    }).select('name subject department leaveBalances attendancePercentage');

    res.json({
      success: true,
      data: availableTeachers
    });
  } catch (error) {
    console.error('Error fetching teacher availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching teacher availability'
    });
  }
});

// Get substitution recommendations
router.get('/substitution-recommendations', protect, async (req, res) => {
  try {
    const { subject, day, periodNumber, date, excludeTeacherId } = req.query;

    if (!subject || !day || !periodNumber || !date) {
      return res.status(400).json({
        success: false,
        message: 'Subject, day, period number, and date are required'
      });
    }

    const recommendations = await substitutionRecommender.getRecommendedSubstitutes(
      subject,
      day,
      parseInt(periodNumber),
      new Date(date),
      excludeTeacherId
    );

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting substitution recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting substitution recommendations'
    });
  }
});

// Assign substitution (request)
router.post('/assign-substitution', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const {
      leaveId,
      originalTeacherId,
      substituteTeacherId,
      day,
      periodNumber,
      subject,
      className,
      date,
      notes
    } = req.body;

    console.log('Assigning substitution with data:', {
      leaveId,
      originalTeacherId,
      substituteTeacherId,
      day,
      periodNumber,
      subject,
      className,
      date,
      notes
    });

    // Validate required fields
    if (!leaveId || !originalTeacherId || !substituteTeacherId || !day || !periodNumber || !subject || !className || !date) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if substitute teacher is available
    const availability = await substitutionRecommender.calculateAvailabilityScore(
      substituteTeacherId,
      day,
      periodNumber,
      new Date(date)
    );

    if (availability === 0) {
      return res.status(400).json({
        success: false,
        message: 'Substitute teacher is not available at this time'
      });
    }

    // Check if substitution already exists for this leave
    const existingSubstitution = await Substitution.findOne({
      leaveId,
      isActive: true
    });

    if (existingSubstitution) {
      return res.status(400).json({
        success: false,
        message: 'A substitution has already been assigned for this leave request'
      });
    }

    // Create substitution record with 'requested' status
    const substitution = new Substitution({
      leaveId,
      originalTeacherId,
      substituteTeacherId,
      day,
      periodNumber,
      subject,
      className,
      assignedBy: req.user._id,
      status: 'requested',
      notes: notes || ''
    });

    console.log('Created substitution object:', substitution);

    await substitution.save();

    console.log('Substitution saved successfully:', substitution._id);

    // Update the leave with the substitution reference
    const Leave = require('../models/Leave');
    await Leave.findByIdAndUpdate(leaveId, {
      finalSubstitute: substituteTeacherId
    });

    console.log('Leave updated with final substitute');

    res.json({
      success: true,
      data: substitution,
      message: 'Substitution request sent to teacher'
    });
  } catch (error) {
    console.error('Error assigning substitution:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning substitution'
    });
  }
});

// Accept substitution request
router.patch('/substitutions/:substitutionId/accept', protect, async (req, res) => {
  try {
    const { substitutionId } = req.params;
    const teacherId = req.user._id;

    const substitution = await Substitution.findById(substitutionId);
    if (!substitution) {
      return res.status(404).json({
        success: false,
        message: 'Substitution not found'
      });
    }

    // Check if the teacher is the one assigned to this substitution
    if (substitution.substituteTeacherId.toString() !== teacherId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only accept substitutions assigned to you'
      });
    }

    if (substitution.status !== 'requested') {
      return res.status(400).json({
        success: false,
        message: 'This substitution request has already been processed'
      });
    }

    // Update substitution status to accepted
    substitution.status = 'accepted';
    substitution.acceptedAt = new Date();
    await substitution.save();

    // Update teacher's timetable to show substitution
    const teacherTimetable = await Timetable.findOne({
      teacherId: substitution.substituteTeacherId,
      day: substitution.day
    });

    if (teacherTimetable) {
      // Check if period already exists
      const existingPeriodIndex = teacherTimetable.periods.findIndex(
        p => p.periodNumber === substitution.periodNumber
      );

      if (existingPeriodIndex !== -1) {
        // Update existing period to mark it as substitution
        teacherTimetable.periods[existingPeriodIndex] = {
          ...teacherTimetable.periods[existingPeriodIndex],
          isSubstitution: true,
          originalTeacherId: substitution.originalTeacherId,
          substitutionDate: new Date(),
          leaveId: substitution.leaveId
        };
      } else {
        // Add new substitution period
        teacherTimetable.periods.push({
          periodNumber: substitution.periodNumber,
          subject: substitution.subject,
          className: substitution.className,
          isSubstitution: true,
          originalTeacherId: substitution.originalTeacherId,
          substitutionDate: new Date(),
          leaveId: substitution.leaveId
        });
      }

      await teacherTimetable.save();
    } else {
      // Create new timetable entry for this day
      const newTimetable = new Timetable({
        teacherId: substitution.substituteTeacherId,
        day: substitution.day,
        periods: [{
          periodNumber: substitution.periodNumber,
          subject: substitution.subject,
          className: substitution.className,
          isSubstitution: true,
          originalTeacherId: substitution.originalTeacherId,
          substitutionDate: new Date(),
          leaveId: substitution.leaveId
        }]
      });

      await newTimetable.save();
    }

    res.json({
      success: true,
      data: substitution,
      message: 'Substitution accepted successfully'
    });
  } catch (error) {
    console.error('Error accepting substitution:', error);
    res.status(500).json({
      success: false,
      message: 'Error accepting substitution'
    });
  }
});

// Reject substitution request
router.patch('/substitutions/:substitutionId/reject', protect, async (req, res) => {
  try {
    const { substitutionId } = req.params;
    const { rejectionReason } = req.body;
    const teacherId = req.user._id;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const substitution = await Substitution.findById(substitutionId);
    if (!substitution) {
      return res.status(404).json({
        success: false,
        message: 'Substitution not found'
      });
    }

    // Check if the teacher is the one assigned to this substitution
    if (substitution.substituteTeacherId.toString() !== teacherId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only reject substitutions assigned to you'
      });
    }

    if (substitution.status !== 'requested') {
      return res.status(400).json({
        success: false,
        message: 'This substitution request has already been processed'
      });
    }

    // Update substitution status to rejected
    substitution.status = 'rejected';
    substitution.rejectedAt = new Date();
    substitution.rejectionReason = rejectionReason;
    await substitution.save();

    res.json({
      success: true,
      data: substitution,
      message: 'Substitution rejected successfully'
    });
  } catch (error) {
    console.error('Error rejecting substitution:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting substitution'
    });
  }
});

// Get all substitutions (admin only)
router.get('/substitutions/all', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const substitutions = await Substitution.find({ isActive: true })
      .populate('leaveId', 'date reason leaveType')
      .populate('originalTeacherId', 'name subject')
      .populate('substituteTeacherId', 'name subject')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: substitutions
    });
  } catch (error) {
    console.error('Error fetching all substitutions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching substitutions'
    });
  }
});

// Get substitution assignments for a teacher
router.get('/substitutions/teacher/:teacherId', protect, async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    console.log('Fetching substitutions for teacher ID:', teacherId);
    
    const substitutions = await Substitution.find({
      $or: [
        { substituteTeacherId: teacherId },
        { originalTeacherId: teacherId }
      ],
      isActive: true
    })
    .populate('leaveId', 'date reason leaveType')
    .populate('originalTeacherId', 'name subject')
    .populate('substituteTeacherId', 'name subject')
    .populate('assignedBy', 'name')
    .sort({ createdAt: -1 });

    console.log('Found substitutions:', substitutions);

    // Add additional logging to debug the data structure
    substitutions.forEach(sub => {
      console.log('Substitution:', {
        id: sub._id,
        substituteTeacherId: sub.substituteTeacherId,
        substituteTeacherIdType: typeof sub.substituteTeacherId,
        originalTeacherId: sub.originalTeacherId,
        originalTeacherIdType: typeof sub.originalTeacherId,
        status: sub.status
      });
    });

    res.json({
      success: true,
      data: substitutions
    });
  } catch (error) {
    console.error('Error fetching substitutions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching substitutions'
    });
  }
});

// Get substitution by ID
router.get('/substitutions/:substitutionId', protect, async (req, res) => {
  try {
    const { substitutionId } = req.params;
    
    const substitution = await Substitution.findById(substitutionId)
      .populate('leaveId', 'date reason leaveType')
      .populate('originalTeacherId', 'name subject')
      .populate('substituteTeacherId', 'name subject');

    if (!substitution) {
      return res.status(404).json({
        success: false,
        message: 'Substitution not found'
      });
    }

    res.json({
      success: true,
      data: substitution
    });
  } catch (error) {
    console.error('Error fetching substitution:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching substitution'
    });
  }
});

// Update substitution status
router.patch('/substitutions/:substitutionId', protect, async (req, res) => {
  try {
    const { substitutionId } = req.params;
    const { status, rejectionReason } = req.body;

    const updateData = { status };
    if (status === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
      updateData.rejectedAt = new Date();
    } else if (status === 'accepted') {
      updateData.acceptedAt = new Date();
    }

    const substitution = await Substitution.findByIdAndUpdate(
      substitutionId,
      updateData,
      { new: true }
    );

    res.json({
      success: true,
      data: substitution
    });
  } catch (error) {
    console.error('Error updating substitution:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating substitution'
    });
  }
});

// Delete substitution (admin only)
router.delete('/substitutions/:substitutionId', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { substitutionId } = req.params;
    const substitution = await Substitution.findById(substitutionId);

    if (!substitution) {
      return res.status(404).json({
        success: false,
        message: 'Substitution not found'
      });
    }

    // Soft delete by setting isActive to false
    substitution.isActive = false;
    await substitution.save();

    res.json({
      success: true,
      message: 'Substitution deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting substitution:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting substitution'
    });
  }
});

// Get substitution statistics (admin only)
router.get('/substitutions/stats', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const stats = await Substitution.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalSubstitutions = await Substitution.countDocuments({ isActive: true });
    const pendingSubstitutions = await Substitution.countDocuments({ 
      isActive: true, 
      status: 'requested' 
    });
    const acceptedSubstitutions = await Substitution.countDocuments({ 
      isActive: true, 
      status: 'accepted' 
    });
    const rejectedSubstitutions = await Substitution.countDocuments({ 
      isActive: true, 
      status: 'rejected' 
    });

    res.json({
      success: true,
      data: {
        total: totalSubstitutions,
        pending: pendingSubstitutions,
        accepted: acceptedSubstitutions,
        rejected: rejectedSubstitutions,
        breakdown: stats
      }
    });
  } catch (error) {
    console.error('Error fetching substitution stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching substitution statistics'
    });
  }
});

// Bulk update substitution statuses (admin only)
router.patch('/substitutions/bulk/status', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { substitutionIds, status, rejectionReason } = req.body;

    if (!substitutionIds || !Array.isArray(substitutionIds) || substitutionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Substitution IDs array is required'
      });
    }

    const updateData = { status };
    if (status === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
      updateData.rejectedAt = new Date();
    } else if (status === 'accepted') {
      updateData.acceptedAt = new Date();
    }

    const result = await Substitution.updateMany(
      { _id: { $in: substitutionIds } },
      updateData
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} substitutions`,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error('Error bulk updating substitutions:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating substitutions'
    });
  }
});

module.exports = router;
