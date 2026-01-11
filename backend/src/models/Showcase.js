import mongoose from 'mongoose';

const showcaseSchema = new mongoose.Schema({
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
  category: {
    type: String,
    required: true,
    enum: ['Web Development', 'Mobile App', 'UI/UX Design', 'Data Science', 'AI/ML', 'Blockchain', 'Game Development', 'Other']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  tags: [String],
  projectUrl: String,
  githubUrl: String,
  technologies: [String]
}, {
  timestamps: true
});

// Add indexes for better performance
showcaseSchema.index({ author: 1 });
showcaseSchema.index({ category: 1 });
showcaseSchema.index({ featured: -1, createdAt: -1 });
showcaseSchema.index({ likes: 1 });

// Virtual for like count
showcaseSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Ensure virtual fields are serialized
showcaseSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Showcase', showcaseSchema);