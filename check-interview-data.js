// Simple script to check interview data in the database
import mongoose from 'mongoose';
import Interview from './backend/src/models/Interview.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cenopie');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const checkInterviews = async () => {
  await connectDB();
  
  try {
    // Find all completed interviews
    const interviews = await Interview.find({ 
      status: { $in: ['completed', 'reviewed'] } 
    }).select('_id user status securityViolations violationCount forcedSubmission submissionReason createdAt');
    
    console.log(`\nFound ${interviews.length} completed/reviewed interviews:`);
    console.log('='.repeat(60));
    
    interviews.forEach((interview, index) => {
      console.log(`\n${index + 1}. Interview ID: ${interview._id}`);
      console.log(`   Status: ${interview.status}`);
      console.log(`   Created: ${interview.createdAt?.toLocaleDateString()}`);
      console.log(`   Security Violations: ${interview.securityViolations?.length || 0} violations`);
      console.log(`   Violation Count: ${interview.violationCount || 0}`);
      console.log(`   Forced Submission: ${interview.forcedSubmission || false}`);
      console.log(`   Submission Reason: ${interview.submissionReason || 'N/A'}`);
      
      if (interview.securityViolations && interview.securityViolations.length > 0) {
        console.log(`   Violation Details:`);
        interview.securityViolations.forEach((violation, i) => {
          console.log(`     ${i + 1}. ${violation}`);
        });
      }
    });
    
    // Check if any interviews have violation data
    const interviewsWithViolations = interviews.filter(i => 
      (i.securityViolations && i.securityViolations.length > 0) ||
      i.violationCount > 0 ||
      i.forcedSubmission
    );
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Summary:`);
    console.log(`- Total interviews: ${interviews.length}`);
    console.log(`- Interviews with violation data: ${interviewsWithViolations.length}`);
    console.log(`- Interviews without violation data: ${interviews.length - interviewsWithViolations.length}`);
    
    if (interviewsWithViolations.length === 0) {
      console.log(`\n⚠️  No interviews found with violation data!`);
      console.log(`   This could mean:`);
      console.log(`   1. No interviews have been completed with the new violation system`);
      console.log(`   2. The violation data is not being stored properly`);
      console.log(`   3. All interviews were completed without violations`);
    }
    
  } catch (error) {
    console.error('Error checking interviews:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

checkInterviews();