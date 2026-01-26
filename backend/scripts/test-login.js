import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../src/models/User.js';

async function testLogin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Test credentials
    const email = 'test@cenopie.com';
    const password = 'test123';

    console.log(`\n🔍 Testing login for: ${email}`);
    console.log(`Password: ${password}`);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found in database');
      console.log('\n📊 Available users:');
      const allUsers = await User.find().select('name email role createdAt');
      allUsers.forEach((u, i) => {
        console.log(`${i + 1}. ${u.name} (${u.email}) - ${u.role}`);
      });
      return;
    }

    console.log('✅ User found in database');
    console.log(`User: ${user.name} (${user.email})`);
    console.log(`Role: ${user.role}`);
    console.log(`Created: ${user.createdAt}`);

    // Test password
    if (!user.password) {
      console.log('❌ User has no password set');
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (passwordMatch) {
      console.log('✅ Password matches!');
      console.log('\n🎉 Login should work with these credentials:');
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
    } else {
      console.log('❌ Password does not match');
      console.log('The password in database is different from what you\'re testing');
    }

  } catch (error) {
    console.error('Error testing login:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testLogin();