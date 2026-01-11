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
  company: {
    name: {
      type: String,
      required: true
    },
    logo: String,
    website: String
  },
  clickUrl: {
    type: String,
    required: true
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
    type: Date,
    required: true
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
    categories: [String], // e.g., ['Web Development', 'UI/UX Design']
    locations: [String],
    ageRange: {
      min: Number,
      max: Number
    }
  }
}, {
  timestamps: true
});

// Add indexes
sponsoredBannerSchema.index({ priority: -1, isActive: 1 });
sponsoredBannerSchema.index({ startDate: 1, endDate: 1 });
sponsoredBannerSchema.index({ isActive: 1 });

export default mongoose.model('SponsoredBanner', sponsoredBannerSchema);