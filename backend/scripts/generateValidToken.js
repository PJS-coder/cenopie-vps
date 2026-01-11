import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function generateValidToken() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get the first user
    const user = await User.findOne();
    if (!user) {
      console.log('No users found in database');
      return;
    }
    
    console.log('User found:', user.name, '(' + user._id + ')');
    
    // Generate a fresh token
    const token = jwt.sign(
      { id: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('\n=== COPY THIS TOKEN TO FRONTEND ===');
    console.log('Token:', token);
    console.log('\n=== COPY THIS USER DATA TO FRONTEND ===');
    console.log('User data:', JSON.stringify({
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      isVerified: user.isVerified
    }, null, 2));
    
    console.log('\n=== INSTRUCTIONS ===');
    console.log('1. Open browser console on the frontend');
    console.log('2. Run: localStorage.setItem("authToken", "' + token + '")');
    console.log('3. Run: localStorage.setItem("currentUser", \'' + JSON.stringify({
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      isVerified: user.isVerified
    }) + '\')');
    console.log('4. Refresh the page');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

generateValidToken();