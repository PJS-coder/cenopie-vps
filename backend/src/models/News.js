import mongoose from 'mongoose';

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  image: {
    type: String
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  isPublished: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for search functionality
newsSchema.index({ title: 'text', content: 'text' });
newsSchema.index({ companyId: 1 });
newsSchema.index({ publishedAt: -1 });
newsSchema.index({ isPublished: 1 });

export default mongoose.model('News', newsSchema);