const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: [true, 'Teacher ID is required']
  },
  day: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    required: [true, 'Day is required']
  },
  periods: [{
    periodNumber: {
      type: Number,
      required: [true, 'Period number is required'],
      min: 1,
      max: 7
    },
    subject: {
      type: String,
      required: [true, 'Subject is required']
    },
    className: {
      type: String,
      required: [true, 'Class is required']
    },
    isSubstitution: {
      type: Boolean,
      default: false
    },
    originalTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher'
    },
    substitutionDate: {
      type: Date
    },
    leaveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Leave'
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
timetableSchema.index({ teacherId: 1, day: 1 });
timetableSchema.index({ 'periods.originalTeacherId': 1 });
timetableSchema.index({ 'periods.leaveId': 1 });

// Ensure virtual fields are serialized
timetableSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Timetable', timetableSchema);
