const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Class = require('../models/Class');
const Department = require('../models/Department');
const Teacher = require('../models/Teacher');

// Get all classes
router.get('/', protect, async (req, res) => {
  try {
    console.log('Classes API called by user:', req.user._id, 'Role:', req.user.role);
    
    const classes = await Class.find({ isActive: true })
      .populate('department', 'name code')
      .populate('timetable.periods.teacherId', 'name subject')
      .sort({ 'department.name': 1, name: 1 });

    console.log('Found classes:', classes.length);
    
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

// Get class by ID with full timetable
router.get('/:id', protect, async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate('department', 'name code')
      .populate('timetable.periods.teacherId', 'name subject email')
      .populate('timetable.periods.originalTeacherId', 'name subject');

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

// Create new class (admin only)
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { name, department, academicYear, semester, strength } = req.body;

    if (!name || !department || !academicYear || !semester) {
      return res.status(400).json({
        success: false,
        message: 'Name, department, academic year, and semester are required'
      });
    }

    // Check if class already exists
    const existingClass = await Class.findOne({
      name,
      department,
      academicYear,
      semester
    });

    if (existingClass) {
      return res.status(400).json({
        success: false,
        message: 'Class already exists with these details'
      });
    }

    const classData = new Class({
      name,
      department,
      academicYear,
      semester,
      strength: strength || 0
    });

    await classData.save();

    res.status(201).json({
      success: true,
      data: classData
    });
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating class'
    });
  }
});

// Update class (admin only)
router.put('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { name, department, academicYear, semester, strength } = req.body;

    const classData = await Class.findByIdAndUpdate(
      req.params.id,
      { name, department, academicYear, semester, strength },
      { new: true, runValidators: true }
    );

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
    console.error('Error updating class:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating class'
    });
  }
});

// Update class timetable (admin only)
router.put('/:id/timetable', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { timetable } = req.body;

    if (!Array.isArray(timetable)) {
      return res.status(400).json({
        success: false,
        message: 'Timetable must be an array'
      });
    }

    // Validate timetable structure
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (const daySchedule of timetable) {
      if (!validDays.includes(daySchedule.day)) {
        return res.status(400).json({
          success: false,
          message: `Invalid day: ${daySchedule.day}`
        });
      }

      if (!Array.isArray(daySchedule.periods)) {
        return res.status(400).json({
          success: false,
          message: `Periods must be an array for ${daySchedule.day}`
        });
      }

      // Validate periods
      for (const period of daySchedule.periods) {
        if (!period.periodNumber || !period.subject || !period.teacherId) {
          return res.status(400).json({
            success: false,
            message: 'Period number, subject, and teacher are required for all periods'
          });
        }

        if (period.periodNumber < 1 || period.periodNumber > 7) {
          return res.status(400).json({
            success: false,
            message: 'Period number must be between 1 and 7'
          });
        }
      }
    }

    // Get the class data to know the class name
    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Update the class timetable
    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      { timetable },
      { new: true, runValidators: true }
    ).populate('timetable.periods.teacherId', 'name subject');

    // Sync teacher timetables
    await syncTeacherTimetables(classData.name, timetable);

    res.json({
      success: true,
      data: updatedClass,
      message: 'Timetable updated and teacher timetables synchronized successfully'
    });
  } catch (error) {
    console.error('Error updating class timetable:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating class timetable'
    });
  }
});

// Helper function to sync teacher timetables
async function syncTeacherTimetables(className, classTimetable) {
  const Timetable = require('../models/Timetable');
  
  try {
    // Get all teachers who are assigned in this class timetable
    const teacherIds = new Set();
    classTimetable.forEach(daySchedule => {
      daySchedule.periods.forEach(period => {
        if (period.teacherId) {
          teacherIds.add(period.teacherId.toString());
        }
      });
    });

    // For each teacher, update their timetable
    for (const teacherId of teacherIds) {
      // Get teacher's current timetable
      const teacherTimetables = await Timetable.find({
        teacherId,
        isActive: true
      });

      // Create a map of existing periods for this teacher
      const existingPeriods = new Map();
      teacherTimetables.forEach(tt => {
        tt.periods.forEach(period => {
          const key = `${tt.day}-${period.periodNumber}`;
          existingPeriods.set(key, period);
        });
      });

      // Update teacher's timetable with new class assignments
      for (const daySchedule of classTimetable) {
        const day = daySchedule.day;
        
        for (const period of daySchedule.periods) {
          if (period.teacherId.toString() === teacherId) {
            const key = `${day}-${period.periodNumber}`;
            const existingPeriod = existingPeriods.get(key);
            
            // Check if this period is already a substitution
            const isSubstitution = existingPeriod && existingPeriod.isSubstitution;
            
            // Create or update the period
            const periodData = {
              periodNumber: period.periodNumber,
              subject: period.subject,
              className: className,
              isSubstitution: isSubstitution,
              originalTeacherId: isSubstitution ? existingPeriod.originalTeacherId : undefined,
              substitutionDate: isSubstitution ? existingPeriod.substitutionDate : undefined,
              leaveId: isSubstitution ? existingPeriod.leaveId : undefined
            };

            // Find or create the day entry for this teacher
            let teacherDayTimetable = teacherTimetables.find(tt => tt.day === day);
            
            if (!teacherDayTimetable) {
              // Create new day entry
              teacherDayTimetable = new Timetable({
                teacherId,
                day,
                periods: [periodData]
              });
              await teacherDayTimetable.save();
            } else {
              // Update existing day entry
              const periodIndex = teacherDayTimetable.periods.findIndex(p => p.periodNumber === period.periodNumber);
              
              if (periodIndex !== -1) {
                // Update existing period (but preserve substitution data if it's a substitution)
                if (isSubstitution) {
                  teacherDayTimetable.periods[periodIndex] = {
                    ...periodData,
                    originalTeacherId: existingPeriod.originalTeacherId,
                    substitutionDate: existingPeriod.substitutionDate,
                    leaveId: existingPeriod.leaveId
                  };
                } else {
                  teacherDayTimetable.periods[periodIndex] = periodData;
                }
              } else {
                // Add new period
                teacherDayTimetable.periods.push(periodData);
              }
              
              await teacherDayTimetable.save();
            }
          }
        }
      }
    }

    console.log(`Successfully synced timetables for ${teacherIds.size} teachers`);
  } catch (error) {
    console.error('Error syncing teacher timetables:', error);
    throw error;
  }
}

// Get classes by department
router.get('/department/:departmentId', protect, async (req, res) => {
  try {
    const classes = await Class.find({
      department: req.params.departmentId,
      isActive: true
    })
    .populate('department', 'name code')
    .sort({ name: 1 });

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

// Get teacher's classes
router.get('/teacher/:teacherId', protect, async (req, res) => {
  try {
    const classes = await Class.find({
      'timetable.periods.teacherId': req.params.teacherId,
      isActive: true
    })
    .populate('department', 'name code')
    .populate('timetable.periods.teacherId', 'name subject');

    res.json({
      success: true,
      data: classes
    });
  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching teacher classes'
    });
  }
});

// Delete class (admin only)
router.delete('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const classData = await Class.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    res.json({
      success: true,
      message: 'Class deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting class'
    });
  }
});

module.exports = router;
