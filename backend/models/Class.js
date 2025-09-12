const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true,
    maxlength: [50, 'Class name cannot exceed 50 characters']
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    trim: true
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: [1, 'Semester must be at least 1'],
    max: [8, 'Semester cannot exceed 8']
  },
  strength: {
    type: Number,
    default: 0,
    min: [0, 'Strength cannot be negative']
  },
  timetable: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      required: true
    },
    periods: [{
      periodNumber: {
        type: Number,
        required: true,
        min: 1,
        max: 7
      },
      subject: {
        type: String,
        required: true,
        trim: true
      },
      teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true
      },
      room: {
        type: String,
        trim: true
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
      }
    }]
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
classSchema.index({ department: 1, academicYear: 1, semester: 1 });
classSchema.index({ name: 1, department: 1 });
classSchema.index({ isActive: 1 });

// Ensure virtual fields are serialized
classSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Class', classSchema);
