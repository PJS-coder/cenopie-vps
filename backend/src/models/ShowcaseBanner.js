import mongoose from 'mongoose';

const showcaseBannerSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true
  },
  cloudinaryPublicId: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: String,
    default: 'Admin'
  }
}, {
  timestamps: true
});

// Index for ordering
showcaseBannerSchema.index({ order: 1, isActive: 1 });

export default mongoose.model('ShowcaseBanner', showcaseBannerSchema);