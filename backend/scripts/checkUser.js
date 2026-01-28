import mongoose from 'mongoose';
import User from '../src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const userId = '694d009577b5cb8127991501';
    const user = await User.findById(userId);
    
    console.log('User found:', !!user);
    if (user) {
      console.log('User name:', user.name);
      console.log('User email:', user.email);
      console.log('User ID:', user._id.toString());
    } else {
      console.log('User not found with ID:', userId);
      
      // Check if there are any users
      const userCount = await User.countDocuments();
      console.log('Total users in database:', userCount);
      
      if (userCount > 0) {
        const firstUser = await User.findOne();
        console.log('First user ID:', firstUser._id.toString());
        console.log('First user name:', firstUser.name);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkUser();