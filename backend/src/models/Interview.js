import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema({
  // User taking the interview
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Company and job (optional - for job-linked interviews)
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application'
  },
  
  // Interview details
  domain: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: 'Technical Interview'
  },
  
  // Questions and answers
  questions: [{
    question: {
      type: String,
      required: true
    },
    answer: String,
    videoUrl: String,
    duration: Number,
    answeredAt: Date
  }],
  
  // Status
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'reviewed'],
    default: 'scheduled'
  },
  
  // Timing
  startedAt: Date,
  completedAt: Date,
  totalDuration: Number,
  
  // Video Recording
  fullRecordingUrl: String,
  
  // AI Analysis
  aiScore: {
    type: Number,
    min: 0,
    max: 100
  },
  aiAnalysis: {
    overall: String,
    strengths: [String],
    improvements: [String],
    technicalScore: Number,
    communicationScore: Number
  },
  
  // HR Review
  hrReview: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company'
    },
    reviewedAt: Date,
    decision: {
      type: String,
      enum: ['pending', 'shortlisted', 'rejected', 'on-hold'],
      default: 'pending'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String,
    meetingLink: String,  // HR interview meeting link (Google Meet, Zoom, etc.)
    meetingDate: String,  // Interview date (YYYY-MM-DD)
    meetingTime: String   // Interview time (HH:MM)
  }
}, {
  timestamps: true
});

// Indexes
interviewSchema.index({ user: 1, createdAt: -1 });
interviewSchema.index({ company: 1, status: 1 });
interviewSchema.index({ 'hrReview.decision': 1 });

const Interview = mongoose.model('Interview', interviewSchema);

export default Interview;
