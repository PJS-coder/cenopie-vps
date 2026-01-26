import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../src/models/User.js';

async function countUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Count total users
    const totalUsers = await User.countDocuments();
    
    // Count users by role
    const regularUsers = await User.countDocuments({ role: 'user' });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const hrUsers = await User.countDocuments({ role: 'hr' });
    
    // Count verified users
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    
    // Count users created in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUsers = await User.countDocuments({ 
      createdAt: { $gte: thirtyDaysAgo } 
    });

    // Count users created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayUsers = await User.countDocuments({ 
      createdAt: { $gte: today } 
    });

    console.log('\n📊 USER STATISTICS');
    console.log('==================');
    console.log(`Total Users: ${totalUsers}`);
    console.log(`Regular Users: ${regularUsers}`);
    console.log(`Admin Users: ${adminUsers}`);
    console.log(`HR Users: ${hrUsers}`);
    console.log(`Verified Users: ${verifiedUsers}`);
    console.log(`Users (Last 30 days): ${recentUsers}`);
    console.log(`Users (Today): ${todayUsers}`);
    
    // Get latest 5 users
    const latestUsers = await User.find()
      .select('name email role createdAt isVerified')
      .sort({ createdAt: -1 })
      .limit(5);
    
    console.log('\n👥 LATEST 5 USERS');
    console.log('==================');
    latestUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role} - ${user.isVerified ? '✅' : '❌'} - ${user.createdAt.toLocaleDateString()}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

countUsers();