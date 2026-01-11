import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
}, { timestamps: true });

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  image: { type: String }, // URL to the image or video
  mediaType: { type: String, enum: ['image', 'video', 'article', 'multiple'], default: 'article' }, // Type of media
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema],
  reposts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users who reposted this post
  originalPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }, // If this is a repost, reference to the original post
}, { timestamps: true });

export default mongoose.model('Post', postSchema);