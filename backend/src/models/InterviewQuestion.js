import mongoose from 'mongoose';

const interviewQuestionSchema = new mongoose.Schema({
  domain: {
    type: String,
    required: true
  },
  question: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

interviewQuestionSchema.index({ domain: 1, isActive: 1, order: 1 });

const InterviewQuestion = mongoose.model('InterviewQuestion', interviewQuestionSchema);

export default InterviewQuestion;
