import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
}, { timestamps: true });

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { 
    type: String, 
    default: ''
    // Removed all validation - we'll handle this in the controller
  },
  image: { type: String }, // URL to the image or video
  mediaType: { type: String, enum: ['image', 'video', 'article', 'multiple'], default: 'article' }, // Type of media
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema],
  reposts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users who reposted this post
  originalPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }, // If this is a repost, reference to the original post
}, { timestamps: true });

// Add indexes for better performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ originalPost: 1 });
postSchema.index({ 'reposts': 1 });

// Virtual field to check if this is a repost
postSchema.virtual('isRepost').get(function() {
  return !!this.originalPost;
});

// Ensure virtual fields are serialized
postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

export default mongoose.model('Post', postSchema);