const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const Substitution = require('../models/Substitution');

// Create a new class
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const { department, section, semester, graduationYear, strength } = req.body;

    // Validate required fields
    if (!department || !section || !semester || !graduationYear) {
      return res.status(400).json({
        success: false,
        message: 'Department, section, semester, and graduation year are required'
      });
    }

    // Generate class name
    const className = `${department}-${semester}${section}`;

    // Check if class already exists
    const existingClass = await Class.findOne({ 
      department, 
      section, 
      semester, 
      graduationYear 
    });

    if (existingClass) {
      return res.status(400).json({
        success: false,
        message: 'Class with this combination already exists'
      });
    }

    // Create new class with empty timetable
    const newClass = new Class({
      name: className,
      department,
      section,
      semester,
      graduationYear,
      strength: strength || 0,
      timetable: [] // Empty timetable initially
    });

    await newClass.save();

    res.status(201).json({
      success: true,
      data: newClass,
      message: 'Class created successfully'
    });
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating class'
    });
  }
});

// Get all classes
router.get('/', protect, async (req, res) => {
  try {
    const classes = await Class.find({ isActive: true })
      .sort({ department: 1, semester: 1, section: 1 });

    res.json({
      success: true,
      data: classes
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching classes'
    });
  }
});

// Get class by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    res.json({
      success: true,
      data: classData
    });
  } catch (error) {
    console.error('Error fetching class:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching class'
    });
  }
});

// Get class timetable
router.get('/:id/timetable', protect, async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    res.json({
      success: true,
      data: classData.timetable
    });
  } catch (error) {
    console.error('Error fetching timetable:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching timetable'
    });
  }
});

// Update class timetable
router.put('/:id/timetable', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const { timetable } = req.body;
    const classId = req.params.id;

    if (!timetable || !Array.isArray(timetable)) {
      return res.status(400).json({
        success: false,
        message: 'Valid timetable array is required'
      });
    }

    // Update class timetable
    const updatedClass = await Class.findByIdAndUpdate(
      classId,
      { timetable },
      { new: true }
    );

    if (!updatedClass) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Update teacher assigned periods
    await updateTeacherAssignedPeriods(classId, timetable);

    res.json({
      success: true,
      data: updatedClass,
      message: 'Timetable updated successfully'
    });
  } catch (error) {
    console.error('Error updating timetable:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating timetable'
    });
  }
});

// Get substitutions for a class
router.get('/:id/substitutions', protect, async (req, res) => {
  try {
    const classId = req.params.id;
    
    const substitutions = await Substitution.find({ 
      classId,
      isActive: true 
    })
    .populate('originalTeacherId', 'name subject')
    .populate('substituteTeacherId', 'name subject')
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
router.post('/:id/substitution', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const { day, periodNumber, originalTeacherId, substituteTeacherId, subject, room, notes } = req.body;
    const classId = req.params.id;

    // Validate required fields
    if (!day || !periodNumber || !originalTeacherId || !substituteTeacherId || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Day, period number, original teacher, substitute teacher, and subject are required'
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

// Helper function to update teacher assigned periods
async function updateTeacherAssignedPeriods(classId, timetable) {
  try {
    // Clear existing assigned periods for this class
    await Teacher.updateMany(
      { 'assignedPeriods.classId': classId },
      { $pull: { assignedPeriods: { classId } } }
    );

    // Get class name for assigned periods
    const classData = await Class.findById(classId).select('name');
    const className = classData ? classData.name : 'Unknown Class';

    // Add new assigned periods
    for (const dayData of timetable) {
      for (const period of dayData.periods) {
        await Teacher.findByIdAndUpdate(
          period.teacherId,
          {
            $push: {
              assignedPeriods: {
                classId,
                className,
                day: dayData.day,
                periodNumber: period.periodNumber,
                subject: period.subject,
                room: period.room || '',
                isSubstitution: period.isSubstitution || false,
                originalTeacherId: period.originalTeacherId || null,
                substitutionDate: period.substitutionDate || null
              }
            }
          }
        );
      }
    }
  } catch (error) {
    console.error('Error updating teacher assigned periods:', error);
  }
}

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