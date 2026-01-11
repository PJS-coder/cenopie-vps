// Test script to check if backend can start with simplified components
import dotenv from 'dotenv';
dotenv.config();

console.log('🧪 Testing simplified backend startup...');

try {
  // Test environment variables
  console.log('📋 Environment check:');
  console.log('  NODE_ENV:', process.env.NODE_ENV || 'undefined');
  console.log('  PORT:', process.env.PORT || 'undefined');
  console.log('  MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
  console.log('  REDIS_DISABLED:', process.env.REDIS_DISABLED || 'undefined');
  
  // Test basic imports
  console.log('\n🔧 Testing imports...');
  
  // Test User model
  const User = (await import('./src/models/User.js')).default;
  console.log('✅ User model imported');
  
  // Test simplified controller
  const profileController = await import('./src/controllers/profileControllerSimple.js');
  console.log('✅ Simplified profile controller imported');
  console.log('📋 Available exports:', Object.keys(profileController));
  
  // Test if addCertification is available
  if (profileController.addCertification) {
    console.log('✅ addCertification function found');
  } else {
    console.log('❌ addCertification function NOT found');
  }
  
  console.log('\n🎉 All basic components loaded successfully!');
  console.log('💡 Try using the simplified controller in production');
  
} catch (error) {
  console.error('❌ Error in simplified startup test:', error.message);
  console.error('📄 Full error:', error);
}