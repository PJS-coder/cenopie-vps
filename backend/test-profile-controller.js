// Test script to validate profileController exports
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing profileController imports...');

try {
  // Test importing the controller
  const controller = await import('./src/controllers/profileController.js');
  
  console.log('✅ ProfileController imported successfully');
  console.log('📋 Available exports:', Object.keys(controller));
  
  // Check for specific exports
  const requiredExports = [
    'updateProfile',
    'getProfile', 
    'getProfileById',
    'addEducation',
    'updateEducation',
    'deleteEducation',
    'addExperience',
    'updateExperience',
    'deleteExperience',
    'addSkill',
    'updateSkill',
    'deleteSkill',
    'addCertification',
    'updateCertification',
    'deleteCertification'
  ];
  
  const missingExports = requiredExports.filter(exp => !controller[exp]);
  
  if (missingExports.length === 0) {
    console.log('✅ All required exports are present');
  } else {
    console.log('❌ Missing exports:', missingExports);
  }
  
  // Test specific function that was causing issues
  if (controller.addCertification) {
    console.log('✅ addCertification export found');
    console.log('📝 Function type:', typeof controller.addCertification);
  } else {
    console.log('❌ addCertification export NOT found');
  }
  
} catch (error) {
  console.error('❌ Error importing profileController:', error.message);
  console.error('📄 Full error:', error);
}