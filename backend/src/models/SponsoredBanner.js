import mongoose from 'mongoose';

const sponsoredBannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  buttonText: {
    type: String,
    default: 'Learn More'
  },
  clickUrl: {
    type: String,
    required: true
  },
  backgroundColor: {
    type: String,
    default: '#F59E0B' // Default yellow/orange gradient
  },
  textColor: {
    type: String,
    default: '#FFFFFF'
  },
  priority: {
    type: Number,
    default: 0 // Higher number = higher priority
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
  clicks: {
    type: Number,
    default: 0
  },
  impressions: {
    type: Number,
    default: 0
  },
  targetAudience: {
    type: String,
    enum: ['all', 'users', 'companies'],
    default: 'all'
  },
  createdBy: {
    type: String,
    default: 'Cenopie Team'
  }
}, {
  timestamps: true
});

// Add indexes
sponsoredBannerSchema.index({ priority: -1, isActive: 1 });
sponsoredBannerSchema.index({ startDate: 1, endDate: 1 });
sponsoredBannerSchema.index({ isActive: 1 });

export default mongoose.model('SponsoredBanner', sponsoredBannerSchema);