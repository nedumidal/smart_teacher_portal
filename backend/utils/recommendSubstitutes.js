const Teacher = require('../models/Teacher');
const Leave = require('../models/Leave');

/**
 * Recommend substitute teachers based on subject expertise, availability, and workload
 * @param {string} subject - The subject for which substitute is needed
 * @param {Date} leaveDate - The date when substitute is needed
 * @param {string} leaveId - The leave request ID
 * @param {number} maxRecommendations - Maximum number of recommendations (default: 3)
 * @returns {Array} Array of recommended teachers with scores
 */
const recommendSubstitutes = async (subject, leaveDate, leaveId, maxRecommendations = 3) => {
  try {
    // Get all available teachers for the subject
    const availableTeachers = await Teacher.find({
      subject: subject,
      available: true,
      isActive: true,
      role: 'teacher'
    }).select('_id name subject workload available');

    if (availableTeachers.length === 0) {
      return [];
    }

    // Check for conflicts on the leave date
    const conflictingLeaves = await Leave.find({
      date: leaveDate,
      status: { $in: ['pending', 'approved'] },
      'substitutes.teacherId': { $in: availableTeachers.map(t => t._id) }
    });

    // Create a map of teachers with conflicts
    const teacherConflicts = {};
    conflictingLeaves.forEach(leave => {
      leave.substitutes.forEach(sub => {
        if (sub.status === 'accepted') {
          teacherConflicts[sub.teacherId.toString()] = true;
        }
      });
    });

    // Filter out teachers with conflicts and calculate scores
    const eligibleTeachers = availableTeachers
      .filter(teacher => !teacherConflicts[teacher._id.toString()])
      .map(teacher => {
        // Calculate score based on multiple factors
        let score = 100; // Base score

        // Workload factor (lower workload = higher score)
        const workloadScore = Math.max(0, 50 - (teacher.workload * 2));
        score += workloadScore;

        // Availability bonus
        if (teacher.available) {
          score += 20;
        }

        // Subject expertise bonus (same subject = higher score)
        if (teacher.subject.toLowerCase() === subject.toLowerCase()) {
          score += 30;
        }

        return {
          teacherId: teacher._id,
          name: teacher.name,
          subject: teacher.subject,
          workload: teacher.workload,
          score: score
        };
      })
      .sort((a, b) => b.score - a.score) // Sort by score descending
      .slice(0, maxRecommendations);

    return eligibleTeachers;
  } catch (error) {
    console.error('Error in recommendSubstitutes:', error);
    throw new Error('Failed to generate substitute recommendations');
  }
};

/**
 * Assign substitute teachers to a leave request
 * @param {string} leaveId - The leave request ID
 * @param {Array} recommendations - Array of recommended teachers
 * @returns {Object} Updated leave with substitutes
 */
const assignSubstitutes = async (leaveId, recommendations) => {
  try {
    const substitutes = recommendations.map(rec => ({
      teacherId: rec.teacherId,
      status: 'pending',
      responseDate: null
    }));

    const updatedLeave = await Leave.findByIdAndUpdate(
      leaveId,
      { substitutes: substitutes },
      { new: true }
    ).populate('substitutes.teacherId', 'name email subject');

    return updatedLeave;
  } catch (error) {
    console.error('Error in assignSubstitutes:', error);
    throw new Error('Failed to assign substitutes');
  }
};

/**
 * Check if a teacher is available for substitution on a specific date
 * @param {string} teacherId - The teacher ID to check
 * @param {Date} date - The date to check availability
 * @returns {boolean} True if available, false otherwise
 */
const checkTeacherAvailability = async (teacherId, date) => {
  try {
    // Check if teacher has any leaves on the date
    const existingLeave = await Leave.findOne({
      teacherId: teacherId,
      date: date,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingLeave) {
      return false;
    }

    // Check if teacher is already assigned as substitute on the date
    const existingSubstitution = await Leave.findOne({
      'substitutes.teacherId': teacherId,
      date: date,
      status: { $in: ['pending', 'approved'] },
      'substitutes.status': 'accepted'
    });

    if (existingSubstitution) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in checkTeacherAvailability:', error);
    return false;
  }
};

module.exports = {
  recommendSubstitutes,
  assignSubstitutes,
  checkTeacherAvailability
};
