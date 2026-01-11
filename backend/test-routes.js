// Test script to validate route imports
console.log('🧪 Testing route imports...');

try {
  // Test importing the routes
  const profileRoutes = await import('./src/routes/profileRoutes.js');
  
  console.log('✅ ProfileRoutes imported successfully');
  console.log('📋 Route export type:', typeof profileRoutes.default);
  
} catch (error) {
  console.error('❌ Error importing profileRoutes:', error.message);
  console.error('📄 Full error:', error);
  
  // Try to identify the specific line causing issues
  if (error.message.includes('addCertification')) {
    console.log('🔍 The error is related to addCertification import');
    
    // Test importing just the controller
    try {
      const controller = await import('./src/controllers/profileController.js');
      console.log('✅ Controller imports fine separately');
      console.log('📋 Controller exports:', Object.keys(controller));
    } catch (controllerError) {
      console.error('❌ Controller also has issues:', controllerError.message);
    }
  }
}