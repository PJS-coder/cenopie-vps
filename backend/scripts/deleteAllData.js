import dotenv from 'dotenv';
import mongoose from 'mongoose';
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

async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function deleteAllData() {
  try {
    console.log('🗑️ Starting database cleanup...');
    console.log('⚠️  WARNING: This will delete ALL data from the database!');
    
    // Connect to database
    await connectDB();
    
    // Delete all collections in order (to handle dependencies)
    const deletionResults = {};
    
    console.log('🔄 Deleting Applications...');
    const applicationsDeleted = await Application.deleteMany({});
    deletionResults.applications = applicationsDeleted.deletedCount;
    console.log(`✅ Deleted ${applicationsDeleted.deletedCount} applications`);
    
    console.log('🔄 Deleting Jobs...');
    const jobsDeleted = await Job.deleteMany({});
    deletionResults.jobs = jobsDeleted.deletedCount;
    console.log(`✅ Deleted ${jobsDeleted.deletedCount} jobs`);
    
    console.log('🔄 Deleting Companies...');
    const companiesDeleted = await Company.deleteMany({});
    deletionResults.companies = companiesDeleted.deletedCount;
    console.log(`✅ Deleted ${companiesDeleted.deletedCount} companies`);
    
    console.log('🔄 Deleting Messages...');
    const messagesDeleted = await MessageNew.deleteMany({});
    deletionResults.messages = messagesDeleted.deletedCount;
    console.log(`✅ Deleted ${messagesDeleted.deletedCount} messages`);
    
    console.log('🔄 Deleting Notifications...');
    const notificationsDeleted = await Notification.deleteMany({});
    deletionResults.notifications = notificationsDeleted.deletedCount;
    console.log(`✅ Deleted ${notificationsDeleted.deletedCount} notifications`);
    
    console.log('🔄 Deleting Connections...');
    const connectionsDeleted = await Connection.deleteMany({});
    deletionResults.connections = connectionsDeleted.deletedCount;
    console.log(`✅ Deleted ${connectionsDeleted.deletedCount} connections`);
    
    console.log('🔄 Deleting Posts...');
    const postsDeleted = await Post.deleteMany({});
    deletionResults.posts = postsDeleted.deletedCount;
    console.log(`✅ Deleted ${postsDeleted.deletedCount} posts`);
    
    console.log('🔄 Deleting Users...');
    const usersDeleted = await User.deleteMany({});
    deletionResults.users = usersDeleted.deletedCount;
    console.log(`✅ Deleted ${usersDeleted.deletedCount} users`);
    
    console.log('\n🎉 Database cleanup completed successfully!');
    console.log('📊 Summary:');
    console.table(deletionResults);
    
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    process.exit(1);
  }
}

// Run the deletion
deleteAllData();