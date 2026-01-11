import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from '../src/models/User.js';

// Load environment variables
dotenv.config();

const makeHR = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');
    
    const email = 'pjs89079@gmail.com';
    
    // Check if user already exists
    let user = await User.findOne({ email });
    
    if (user) {
      // Update existing user to HR role
      user.role = 'hr';
      await user.save();
      console.log(`✅ Updated existing user ${email} to HR role`);
    } else {
      // Create new HR user
      const hashedPassword = await bcrypt.hash('hr123', 10); // Default password
      
      user = new User({
        name: 'HR User',
        email: email,
        password: hashedPassword,
        role: 'hr',
        headline: 'HR Administrator',
        bio: 'HR administrator account'
      });
      
      await user.save();
      console.log(`✅ Created new HR user: ${email}`);
      console.log(`🔑 Default password: hr123 (please change after first login)`);
    }
    
    console.log(`🎉 ${email} is now an HR user!`);
    
    // Close connection
    await mongoose.connection.close();
    console.log('📦 MongoDB connection closed');
    
  } catch (error) {
    console.error('❌ Error making user HR:', error);
    process.exit(1);
  }
};

// Run the script
makeHR();
