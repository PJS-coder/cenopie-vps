import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Interview from '../src/models/Interview.js';

async function clearInterviews() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cenopie');
    console.log('✅ Connected to MongoDB');

    // Delete all interviews
    const result = await Interview.deleteMany({});
    console.log(`🗑️  Deleted ${result.deletedCount} interviews`);

    console.log('\n✨ All interview data cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing interviews:', error);
    process.exit(1);
  }
}

clearInterviews();
