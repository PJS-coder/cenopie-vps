import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    required: true
  },
  link: {
    type: String,
    trim: true
  },
  buttonText: {
    type: String,
    default: 'Learn More'
  },
  position: {
    type: String,
    enum: ['top', 'middle', 'bottom'],
    default: 'top'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  priority: {
    type: Number,
    default: 0
  },
  targetAudience: {
    type: String,
    enum: ['all', 'users', 'companies'],
    default: 'all'
  },
  clickCount: {
    type: Number,
    default: 0
  },
  impressions: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: String,
    default: 'Cenopie Team'
  }
}, {
  timestamps: true
});

// Indexes for performance
bannerSchema.index({ isActive: 1, priority: -1 });
bannerSchema.index({ position: 1, isActive: 1 });
bannerSchema.index({ startDate: 1, endDate: 1 });

export default mongoose.model('Banner', bannerSchema);