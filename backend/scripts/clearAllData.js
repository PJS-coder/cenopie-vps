import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Post from '../src/models/Post.js';
import Company from '../src/models/Company.js';
import Job from '../src/models/Job.js';
import Application from '../src/models/Application.js';
import Connection from '../src/models/Connection.js';
import MessageNew from '../src/models/MessageNew.js';
import Notification from '../src/models/Notification.js';

// Load environment variables
dotenv.config();

const clearAllData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');
    
    console.log('🗑️ Starting database cleanup...');
    
    // Delete all collections in order (to handle dependencies)
    const deletionResults = {};
    
    // Delete Applications first (references users and jobs)
    const applicationsDeleted = await Application.deleteMany({});
    deletionResults.applications = applicationsDeleted.deletedCount;
    console.log(`✅ Deleted ${applicationsDeleted.deletedCount} applications`);
    
    // Delete Jobs (references companies)
    const jobsDeleted = await Job.deleteMany({});
    deletionResults.jobs = jobsDeleted.deletedCount;
    console.log(`✅ Deleted ${jobsDeleted.deletedCount} jobs`);
    
    // Delete Companies
    const companiesDeleted = await Company.deleteMany({});
    deletionResults.companies = companiesDeleted.deletedCount;
    console.log(`✅ Deleted ${companiesDeleted.deletedCount} companies`);
    
    // Delete Messages
    const messagesDeleted = await MessageNew.deleteMany({});
    deletionResults.messages = messagesDeleted.deletedCount;
    console.log(`✅ Deleted ${messagesDeleted.deletedCount} messages`);
    
    // Delete Notifications
    const notificationsDeleted = await Notification.deleteMany({});
    deletionResults.notifications = notificationsDeleted.deletedCount;
    console.log(`✅ Deleted ${notificationsDeleted.deletedCount} notifications`);
    
    // Delete Connections
    const connectionsDeleted = await Connection.deleteMany({});
    deletionResults.connections = connectionsDeleted.deletedCount;
    console.log(`✅ Deleted ${connectionsDeleted.deletedCount} connections`);
    
    // Delete Posts
    const postsDeleted = await Post.deleteMany({});
    deletionResults.posts = postsDeleted.deletedCount;
    console.log(`✅ Deleted ${postsDeleted.deletedCount} posts`);
    
    // Delete Users last
    const usersDeleted = await User.deleteMany({});
    deletionResults.users = usersDeleted.deletedCount;
    console.log(`✅ Deleted ${usersDeleted.deletedCount} users`);
    
    console.log('🎉 Database cleanup completed successfully!');
    console.log('📊 Summary:', deletionResults);
    
    // Close connection
    await mongoose.connection.close();
    console.log('📦 MongoDB connection closed');
    
  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    process.exit(1);
  }
};

// Run the script
clearAllData();