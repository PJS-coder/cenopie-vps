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

async function addTestViolations() {
  try {
    // Connect to MongoDB using the correct connection string
    await mongoose.connect('mongodb+srv://pjs89079_db_user:adO1gs2LZryrCKbM@cenopie.ae8q9xo.mongodb.net/?retryWrites=true&w=majority&appName=Cenopie');
    console.log('✅ Connected to MongoDB');

    // Update the specific interview with test violation data
    const interviewId = '6975cc9b9e9d7d8433184f0f';
    
    const testViolations = [
      '13:26:15: Manual test violation',
      '13:26:20: Manual test violation', 
      '13:26:25: Manual test violation',
      '13:26:30: Manual test violation',
      '13:26:35: Manual test violation'
    ];

    const updatedInterview = await Interview.findByIdAndUpdate(
      interviewId,
      {
        violationCount: 5,
        securityViolations: testViolations,
        forcedSubmission: true,
        submissionReason: 'Maximum violations reached'
      },
      { new: true }
    );

    if (!updatedInterview) {
      console.log('❌ Interview not found');
      return;
    }

    console.log('✅ Successfully updated interview with test violations');
    console.log('🔍 Updated Interview Data:');
    console.log('- ID:', updatedInterview._id);
    console.log('- Status:', updatedInterview.status);
    console.log('- Violation Count:', updatedInterview.violationCount);
    console.log('- Security Violations:', updatedInterview.securityViolations);
    console.log('- Forced Submission:', updatedInterview.forcedSubmission);
    console.log('- Submission Reason:', updatedInterview.submissionReason);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

addTestViolations();