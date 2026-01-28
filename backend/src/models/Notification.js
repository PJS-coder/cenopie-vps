import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { 
    type: String, 
    enum: ['like', 'comment', 'follow', 'message', 'job', 'system', 'connection_request', 'interview_decision', 'repost'], 
    required: true 
  },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  relatedPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  relatedJob: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  relatedInterview: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview' },
  link: String,
  data: { type: mongoose.Schema.Types.Mixed }, // For storing additional notification data
}, { timestamps: true });

// Index for efficient querying
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, read: 1 });

export default mongoose.model('Notification', notificationSchema);
