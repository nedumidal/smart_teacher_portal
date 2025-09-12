const mongoose = require('mongoose');

const substitutionSchema = new mongoose.Schema({
  leaveId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Leave',
    required: [true, 'Leave ID is required']
  },
  originalTeacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: [true, 'Original teacher ID is required']
  },
  substituteTeacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: [true, 'Substitute teacher ID is required']
  },
  day: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    required: [true, 'Day is required']
  },
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
  status: {
    type: String,
    enum: ['requested', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'requested'
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: [true, 'Admin who assigned the substitution is required']
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  acceptedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  },
  completedAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
substitutionSchema.index({ leaveId: 1 });
substitutionSchema.index({ substituteTeacherId: 1, day: 1, periodNumber: 1 });
substitutionSchema.index({ originalTeacherId: 1 });
substitutionSchema.index({ status: 1 });
substitutionSchema.index({ 'status': 1, 'substituteTeacherId': 1 });

// Ensure virtual fields are serialized
substitutionSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Substitution', substitutionSchema);
