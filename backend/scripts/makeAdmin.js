import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from '../src/models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the backend directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const makeAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');
    
    const email = 'pjs89079@gmail.com';
    
    // Check if user already exists
    let user = await User.findOne({ email });
    
    if (user) {
      // Update existing user to admin
      user.role = 'admin';
      await user.save();
      console.log(`✅ Updated existing user ${email} to admin role`);
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash('admin123', 10); // Default password
      
      user = new User({
        name: 'Admin User',
        email: email,
        password: hashedPassword,
        role: 'admin',
        headline: 'System Administrator',
        bio: 'System administrator account'
      });
      
      await user.save();
      console.log(`✅ Created new admin user: ${email}`);
      console.log(`🔑 Default password: admin123 (please change after first login)`);
    }
    
    console.log(`🎉 ${email} is now an admin user!`);
    
    // Close connection
    await mongoose.connection.close();
    console.log('📦 MongoDB connection closed');
    
  } catch (error) {
    console.error('❌ Error making user admin:', error);
    process.exit(1);
  }
};

// Run the script
makeAdmin();