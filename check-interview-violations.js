const mongoose = require('mongoose');

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
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://prabhjotsingh:Prabhjot%40123@cluster0.ae8q9xo.mongodb.net/canopie?retryWrites=true&w=majority&appName=Cluster0');
    console.log('✅ Connected to MongoDB');

    // Check the specific interview
    const interviewId = '6975c34ab3baeda815183162';
    const interview = await Interview.findById(interviewId);

    if (!interview) {
      console.log('❌ Interview not found');
      return;
    }

    console.log('🔍 Interview Data:');
    console.log('- ID:', interview._id);
    console.log('- Status:', interview.status);
    console.log('- Violation Count:', interview.violationCount);
    console.log('- Security Violations:', interview.securityViolations);
    console.log('- Forced Submission:', interview.forcedSubmission);
    console.log('- Submission Reason:', interview.submissionReason);
    console.log('- HR Review Decision:', interview.hrReview?.decision);
    console.log('- Created At:', interview.createdAt);
    console.log('- Updated At:', interview.updatedAt);

    // Check all interviews with violations
    const interviewsWithViolations = await Interview.find({
      violationCount: { $gt: 0 }
    }).select('_id violationCount securityViolations forcedSubmission');

    console.log('\n📊 All interviews with violations:');
    interviewsWithViolations.forEach(int => {
      console.log(`- ${int._id}: ${int.violationCount} violations, forced: ${int.forcedSubmission}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

checkInterview();