import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import Interview model
const InterviewSchema = new mongoose.Schema({
  domain: { type: String, required: true },
  status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  questions: [{
    question: String,
    answer: String
  }],
  score: Number,
  aiAnalysis: {
    overallFeedback: String,
    strengths: [String],
    improvements: [String],
    technicalScore: Number,
    communicationScore: Number,
    confidenceScore: Number
  },
  videoUrl: String,
  duration: Number,
  securityViolations: [String],
  violationCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  completedAt: Date
});

const Interview = mongoose.model('Interview', InterviewSchema);

const clearAllInterviews = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Count existing interviews
    const interviewCount = await Interview.countDocuments();
    console.log(`Found ${interviewCount} interviews to delete`);

    if (interviewCount === 0) {
      console.log('No interviews found to delete');
      process.exit(0);
    }

    // Delete all interviews
    const result = await Interview.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} interviews`);

    // Verify deletion
    const remainingCount = await Interview.countDocuments();
    console.log(`Remaining interviews: ${remainingCount}`);

    if (remainingCount === 0) {
      console.log('✅ All interviews have been successfully cleared!');
    } else {
      console.log('⚠️ Some interviews may still remain');
    }

  } catch (error) {
    console.error('Error clearing interviews:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

// Run the script
clearAllInterviews();