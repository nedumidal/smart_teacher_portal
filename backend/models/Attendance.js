const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: [true, 'Teacher ID is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'half-day', 'leave'],
    required: [true, 'Status is required']
  },
  checkIn: {
    type: Date
  },
  checkOut: {
    type: Date
  },
  leaveId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Leave'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
attendanceSchema.index({ teacherId: 1, date: 1 });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ status: 1 });

// Ensure virtual fields are serialized
attendanceSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Attendance', attendanceSchema);
