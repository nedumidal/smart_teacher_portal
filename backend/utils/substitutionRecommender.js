const Teacher = require('../models/Teacher');
const Timetable = require('../models/Timetable');
const Substitution = require('../models/Substitution');
const Attendance = require('../models/Attendance');

class SubstitutionRecommender {
  constructor() {
    this.weights = {
      availability: 0.4,
      workload: 0.25,
      subjectCompatibility: 0.2,
      attendanceScore: 0.15
    };
  }

  // Calculate teacher availability score for a specific time slot
  async calculateAvailabilityScore(teacherId, day, periodNumber, date) {
    try {
      // Check if teacher has a class at this time
      const timetable = await Timetable.findOne({
        teacherId,
        day,
        'periods.periodNumber': periodNumber,
        isActive: true
      });

      if (!timetable) {
        return 1.0; // Teacher is completely free
      }

      // Check if teacher has a substitution assignment at this time
      const substitution = await Substitution.findOne({
        substituteTeacherId: teacherId,
        day,
        periodNumber,
        status: { $in: ['assigned', 'accepted'] },
        isActive: true
      });

      if (substitution) {
        return 0.0; // Teacher is already assigned a substitution
      }

      // Check if teacher is on leave
      const attendance = await Attendance.findOne({
        teacherId,
        date,
        status: { $in: ['absent', 'leave'] }
      });

      if (attendance) {
        return 0.0; // Teacher is on leave
      }

      return 0.5; // Teacher has a regular class but might be available for substitution
    } catch (error) {
      console.error('Error calculating availability score:', error);
      return 0.0;
    }
  }

  // Calculate workload score (lower workload = higher score)
  async calculateWorkloadScore(teacherId) {
    try {
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) return 0.0;

      // Count total periods per week
      const timetables = await Timetable.find({ teacherId, isActive: true });
      let totalPeriods = 0;
      
      timetables.forEach(timetable => {
        totalPeriods += timetable.periods.length;
      });

      // Count active substitutions
      const activeSubstitutions = await Substitution.countDocuments({
        substituteTeacherId: teacherId,
        status: { $in: ['assigned', 'accepted'] },
        isActive: true
      });

      const totalWorkload = totalPeriods + activeSubstitutions;
      
      // Normalize workload score (0-1, where 1 is lowest workload)
      if (totalWorkload === 0) return 1.0;
      if (totalWorkload >= 35) return 0.0; // 35 periods per week is considered full workload
      
      return Math.max(0, 1 - (totalWorkload / 35));
    } catch (error) {
      console.error('Error calculating workload score:', error);
      return 0.5;
    }
  }

  // Calculate subject compatibility score
  async calculateSubjectCompatibilityScore(teacherId, requiredSubject) {
    try {
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) return 0.0;

      // Exact subject match
      if (teacher.subject && teacher.subject.toLowerCase() === requiredSubject.toLowerCase()) {
        return 1.0;
      }

      // Subject family compatibility (you can expand this based on your curriculum)
      const subjectFamilies = {
        'mathematics': ['mathematics', 'algebra', 'geometry', 'calculus', 'statistics'],
        'science': ['physics', 'chemistry', 'biology', 'science'],
        'languages': ['english', 'hindi', 'sanskrit', 'french', 'german'],
        'social': ['history', 'geography', 'civics', 'economics'],
        'arts': ['art', 'music', 'dance', 'drama'],
        'physical': ['physical education', 'sports', 'yoga']
      };

      for (const [family, subjects] of Object.entries(subjectFamilies)) {
        if (subjects.some(subject => 
          teacher.subject && teacher.subject.toLowerCase().includes(subject) ||
          requiredSubject.toLowerCase().includes(subject)
        )) {
          return 0.7; // Good compatibility
        }
      }

      return 0.3; // Basic compatibility
    } catch (error) {
      console.error('Error calculating subject compatibility score:', error);
      return 0.5;
    }
  }

  // Calculate attendance score
  async calculateAttendanceScore(teacherId) {
    try {
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) return 0.0;

      // Use the stored attendance percentage
      return teacher.attendancePercentage / 100;
    } catch (error) {
      console.error('Error calculating attendance score:', error);
      return 0.8; // Default to 80%
    }
  }

  // Get recommended substitute teachers
  async getRecommendedSubstitutes(requiredSubject, day, periodNumber, date, excludeTeacherId = null) {
    try {
      // Get all active teachers
      const teachers = await Teacher.find({ 
        isActive: true, 
        role: 'teacher',
        _id: { $ne: excludeTeacherId }
      });

      const recommendations = [];

      for (const teacher of teachers) {
        const availabilityScore = await this.calculateAvailabilityScore(
          teacher._id, day, periodNumber, date
        );
        
        const workloadScore = await this.calculateWorkloadScore(teacher._id);
        const subjectScore = await this.calculateSubjectCompatibilityScore(teacher._id, requiredSubject);
        const attendanceScore = await this.calculateAttendanceScore(teacher._id);

        // Calculate weighted total score
        const totalScore = 
          (availabilityScore * this.weights.availability) +
          (workloadScore * this.weights.workload) +
          (subjectScore * this.weights.subjectCompatibility) +
          (attendanceScore * this.weights.attendanceScore);

        recommendations.push({
          teacherId: teacher._id,
          teacherName: teacher.name,
          subject: teacher.subject,
          department: teacher.department,
          scores: {
            availability: availabilityScore,
            workload: workloadScore,
            subject: subjectScore,
            attendance: attendanceScore,
            total: totalScore
          },
          leaveBalances: teacher.leaveBalances,
          attendancePercentage: teacher.attendancePercentage
        });
      }

      // Sort by total score (highest first)
      recommendations.sort((a, b) => b.scores.total - a.scores.total);

      // Return top 5 recommendations
      return recommendations.slice(0, 5);
    } catch (error) {
      console.error('Error getting recommended substitutes:', error);
      return [];
    }
  }

  // Update teacher attendance percentage
  async updateAttendancePercentage(teacherId) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const attendanceRecords = await Attendance.find({
        teacherId,
        date: { $gte: thirtyDaysAgo },
        isActive: true
      });

      if (attendanceRecords.length === 0) return;

      let presentDays = 0;
      let totalDays = attendanceRecords.length;

      attendanceRecords.forEach(record => {
        if (record.status === 'present') {
          presentDays++;
        } else if (record.status === 'half-day') {
          presentDays += 0.5;
        }
      });

      const attendancePercentage = Math.round((presentDays / totalDays) * 100);

      await Teacher.findByIdAndUpdate(teacherId, {
        attendancePercentage: Math.max(0, Math.min(100, attendancePercentage))
      });
    } catch (error) {
      console.error('Error updating attendance percentage:', error);
    }
  }
}

module.exports = new SubstitutionRecommender();
