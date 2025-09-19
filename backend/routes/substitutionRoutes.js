const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Substitution = require('../models/Substitution');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');

// Get all substitutions (admin only)
router.get('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const substitutions = await Substitution.find({ isActive: true })
      .populate('classId', 'name department section')
      .populate('originalTeacherId', 'name subject')
      .populate('substituteTeacherId', 'name subject')
      .populate('assignedBy', 'name')
      .sort({ createdAt: -1 });

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

// Create substitution
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const { 
      classId, 
      day, 
      periodNumber, 
      originalTeacherId, 
      substituteTeacherId, 
      subject, 
      room, 
      notes 
    } = req.body;

    // Validate required fields
    if (!classId || !day || !periodNumber || !originalTeacherId || !substituteTeacherId || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Class ID, day, period number, original teacher, substitute teacher, and subject are required'
      });
    }

    // Get class data
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Create substitution record
    const substitution = new Substitution({
      classId,
      className: classData.name,
      originalTeacherId,
      substituteTeacherId,
      day,
      periodNumber,
      subject,
      assignedBy: req.user._id,
      notes: notes || '',
      status: 'accepted' // Auto-accept for admin
    });

    await substitution.save();

    // Update class timetable with substitution
    await updateClassTimetableWithSubstitution(classId, day, periodNumber, {
      subject,
      teacherId: substituteTeacherId,
      room: room || '',
      isSubstitution: true,
      originalTeacherId,
      substitutionDate: new Date(),
      substitutionId: substitution._id
    });

    // Update teacher assigned periods
    await updateTeacherSubstitutionPeriods(originalTeacherId, substituteTeacherId, {
      classId,
      day,
      periodNumber,
      subject,
      room: room || '',
      substitutionId: substitution._id
    });

    res.status(201).json({
      success: true,
      data: substitution,
      message: 'Substitution created and applied successfully'
    });
  } catch (error) {
    console.error('Error creating substitution:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating substitution'
    });
  }
});

// Get substitution by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const substitution = await Substitution.findById(req.params.id)
      .populate('classId', 'name department section')
      .populate('originalTeacherId', 'name subject')
      .populate('substituteTeacherId', 'name subject')
      .populate('assignedBy', 'name');

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
router.patch('/:id', protect, async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    const updateData = { status };
    if (status === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
      updateData.rejectedAt = new Date();
    } else if (status === 'accepted') {
      updateData.acceptedAt = new Date();
    }

    const substitution = await Substitution.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
    .populate('classId', 'name department section')
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
      data: substitution,
      message: 'Substitution updated successfully'
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
router.delete('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const substitution = await Substitution.findById(req.params.id);

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

// Helper function to update class timetable with substitution
async function updateClassTimetableWithSubstitution(classId, day, periodNumber, substitutionData) {
  try {
    const classData = await Class.findById(classId);
    
    // Find or create day entry
    let dayIndex = classData.timetable.findIndex(d => d.day === day);
    if (dayIndex === -1) {
      classData.timetable.push({ day, periods: [] });
      dayIndex = classData.timetable.length - 1;
    }

    // Find or create period entry
    let periodIndex = classData.timetable[dayIndex].periods.findIndex(p => p.periodNumber === periodNumber);
    if (periodIndex === -1) {
      classData.timetable[dayIndex].periods.push({
        periodNumber,
        ...substitutionData
      });
    } else {
      classData.timetable[dayIndex].periods[periodIndex] = {
        ...classData.timetable[dayIndex].periods[periodIndex],
        ...substitutionData
      };
    }

    await classData.save();
  } catch (error) {
    console.error('Error updating class timetable with substitution:', error);
  }
}

// Helper function to update teacher substitution periods
async function updateTeacherSubstitutionPeriods(originalTeacherId, substituteTeacherId, substitutionData) {
  try {
    // Remove from original teacher's assigned periods
    await Teacher.findByIdAndUpdate(
      originalTeacherId,
      {
        $pull: {
          assignedPeriods: {
            classId: substitutionData.classId,
            day: substitutionData.day,
            periodNumber: substitutionData.periodNumber
          }
        }
      }
    );

    // Add to substitute teacher's assigned periods
    await Teacher.findByIdAndUpdate(
      substituteTeacherId,
      {
        $push: {
          assignedPeriods: {
            ...substitutionData,
            isSubstitution: true,
            originalTeacherId
          }
        }
      }
    );
  } catch (error) {
    console.error('Error updating teacher substitution periods:', error);
  }
}

module.exports = router;
