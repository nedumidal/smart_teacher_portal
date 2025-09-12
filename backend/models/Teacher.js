const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const teacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  subject: {
    type: String,
    trim: true
  },
  workload: {
    type: Number,
    default: 0,
    min: [0, 'Workload cannot be negative']
  },
  available: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['teacher', 'admin'],
    default: 'teacher'
  },
  phone: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  leaveBalances: {
    casualLeave: {
      type: Number,
      default: 8,
      min: [0, 'Casual leave balance cannot be negative']
    },
    medicalLeave: {
      type: Number,
      default: 10,
      min: [0, 'Medical leave balance cannot be negative']
    },
    earnedLeave: {
      type: Number,
      default: 2.5,
      min: [0, 'Earned leave balance cannot be negative']
    }
  },
  attendancePercentage: {
    type: Number,
    default: 100,
    min: [0, 'Attendance percentage cannot be negative'],
    max: [100, 'Attendance percentage cannot exceed 100']
  }
}, {
  timestamps: true
});

// Hash password before saving
teacherSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
teacherSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual for full name
teacherSchema.virtual('fullName').get(function() {
  return `${this.name}`;
});

// Ensure virtual fields are serialized
teacherSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    return ret;
  }
});

module.exports = mongoose.model('Teacher', teacherSchema);
