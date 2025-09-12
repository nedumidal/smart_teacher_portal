const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: [true, 'Teacher ID is required']
  },
  date: {
    type: Date,
    required: [true, 'Leave date is required']
  },
  reason: {
    type: String,
    required: [true, 'Leave reason is required'],
    trim: true,
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  leaveType: {
    type: String,
    enum: ['sick', 'personal', 'medical', 'other'],
    default: 'other'
  },
  duration: {
    type: String,
    enum: ['half-day', 'full-day', 'multiple-days'],
    default: 'full-day'
  },
  endDate: {
    type: Date
  },
  substitutes: [{
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    responseDate: {
      type: Date
    }
  }],
  finalSubstitute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    default: null
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  approvedAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
leaveSchema.index({ teacherId: 1, date: 1 });
leaveSchema.index({ status: 1, date: 1 });
leaveSchema.index({ 'substitutes.teacherId': 1 });

// Virtual for leave duration in days
leaveSchema.virtual('durationInDays').get(function() {
  if (this.duration === 'half-day') return 0.5;
  if (this.duration === 'full-day') return 1;
  if (this.endDate && this.date) {
    const diffTime = Math.abs(this.endDate - this.date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  }
  return 1;
});

// Ensure virtual fields are serialized
leaveSchema.set('toJSON', {
  virtuals: true
});

// Pre-save middleware to set endDate for multiple days
leaveSchema.pre('save', function(next) {
  if (this.duration === 'multiple-days' && !this.endDate) {
    this.endDate = this.date;
  }
  next();
});

module.exports = mongoose.model('Leave', leaveSchema);
