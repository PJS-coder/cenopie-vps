import mongoose from 'mongoose';

// Interview Schema (simplified)
const interviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  domain: String,
  status: String,
  violationCount: { type: Number, default: 0 },
  securityViolations: [String],
  forcedSubmission: { type: Boolean, default: false },
  submissionReason: String,
  hrReview: {
    decision: { type: String, default: 'pending' }
  }
}, { timestamps: true });

const Interview = mongoose.model('Interview', interviewSchema);

async function checkInterview() {
  try {
    // Connect to MongoDB using the correct connection string
    await mongoose.connect('mongodb+srv://pjs89079_db_user:adO1gs2LZryrCKbM@cenopie.ae8q9xo.mongodb.net/?retryWrites=true&w=majority&appName=Cenopie');
    console.log('✅ Connected to MongoDB');

    // Check all recent interviews to see if any have violations
    const recentInterviews = await Interview.find({
      createdAt: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) } // Last 2 hours
    }).select('_id violationCount securityViolations forcedSubmission status createdAt').sort({ createdAt: -1 });

    console.log('\n📊 Recent interviews (last 2 hours):');
    recentInterviews.forEach(int => {
      console.log(`- ${int._id}: ${int.violationCount} violations, forced: ${int.forcedSubmission}, status: ${int.status}, created: ${int.createdAt}`);
    });

    if (recentInterviews.length === 0) {
      console.log('No recent interviews found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

checkInterview();