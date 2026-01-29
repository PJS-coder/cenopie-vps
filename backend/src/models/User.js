import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const educationSchema = new mongoose.Schema({
  college: String,
  degree: String,
  fieldOfStudy: String,
  startYear: Number,
  endYear: Number,
  current: { type: Boolean, default: false }
});

const experienceSchema = new mongoose.Schema({
  company: String,
  jobTitle: String,
  employmentType: String,
  startDate: Date,
  endDate: Date,
  description: String,
  current: { type: Boolean, default: false }
});

// Simplified skill schema without proficiency
const skillSchema = new mongoose.Schema({
  name: String
});

const certificationSchema = new mongoose.Schema({
  name: String,
  organization: String,
  issueDate: Date,
  expirationDate: Date,
  credentialId: String,
  credentialUrl: String,
  doesNotExpire: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, enum: ['user', 'admin', 'hr'], default: 'user' },
  headline: String,
  bio: String,
  location: String,
  pronouns: String,
  links: [{ label: String, url: String }],
  education: [educationSchema],
  experience: [experienceSchema],
  skills: [skillSchema],
  certifications: [certificationSchema],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // Companies owned by this user
  companies: [{ type: String, ref: 'Company' }],
  // Profile image and banner
  profileImage: String,
  bannerImage: String,
  // Stats fields
  interviewsCompleted: { type: Number, default: 0 },
  applicationsSent: { type: Number, default: 0 },
  profileViews: { type: Number, default: 0 },
  successRate: { type: Number, default: 0 },
  // Interview statistics
  totalInterviews: { type: Number, default: 0 },
  selectedInterviews: { type: Number, default: 0 },
  rejectedInterviews: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  // Verification field
  isVerified: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// Add method to generate auth token
userSchema.methods.generateAuthToken = function() {
  const token = jwt.sign({ id: this._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return token;
};

// Add method to update interview statistics
userSchema.statics.updateInterviewStats = async function(userId) {
  try {
    console.log('📊 Updating interview stats for user:', userId);
    
    // Import Interview model dynamically to avoid circular dependency
    const Interview = mongoose.model('Interview');
    
    // Get all interviews for this user
    const interviews = await Interview.find({ user: userId });
    console.log('📊 Found interviews:', interviews.length);
    
    const totalInterviews = interviews.length;
    const completedInterviews = interviews.filter(i => i.status === 'completed');
    const rejectedInterviews = interviews.filter(i => i.status === 'rejected');
    
    console.log('📊 Interview breakdown:', {
      total: totalInterviews,
      completed: completedInterviews.length,
      rejected: rejectedInterviews.length
    });
    
    // Calculate selected interviews (completed interviews that were shortlisted by HR)
    const selectedInterviews = interviews.filter(i => 
      i.status === 'completed' && i.hrReview && i.hrReview.decision === 'shortlisted'
    ).length;
    
    // Calculate average score from completed interviews
    const scoresArray = completedInterviews
      .filter(i => i.aiScore && i.aiScore > 0)
      .map(i => i.aiScore);
    const averageScore = scoresArray.length > 0 
      ? Math.round(scoresArray.reduce((sum, score) => sum + score, 0) / scoresArray.length)
      : 0;
    
    const statsUpdate = {
      totalInterviews,
      selectedInterviews,
      rejectedInterviews: rejectedInterviews.length,
      averageScore,
      interviewsCompleted: completedInterviews.length
    };
    
    console.log('📊 Updating user with stats:', statsUpdate);
    
    // Update user statistics
    const result = await this.findByIdAndUpdate(userId, statsUpdate, { new: true });
    
    if (!result) {
      console.error('❌ User not found for stats update:', userId);
      return;
    }
    
    console.log(`✅ Updated interview stats for user ${userId}:`, {
      totalInterviews,
      selectedInterviews,
      rejectedInterviews: rejectedInterviews.length,
      averageScore
    });
    
  } catch (error) {
    console.error('❌ Error updating interview stats:', error);
    throw error; // Re-throw to let caller handle
  }
};

export default mongoose.model('User', userSchema);