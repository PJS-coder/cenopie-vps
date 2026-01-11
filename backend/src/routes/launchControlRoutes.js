import { Router } from 'express';
import { protect, admin } from '../middlewares/authMiddleware.js';
import fs from 'fs';
import path from 'path';

const router = Router();

// Get current launch settings
router.get('/status', protect, admin, (req, res) => {
  const allowRegistration = process.env.ALLOW_REGISTRATION === 'true';
  const launchMode = process.env.LAUNCH_MODE || 'open';
  
  res.json({
    success: true,
    allowRegistration,
    launchMode,
    message: allowRegistration 
      ? 'Registration is currently open' 
      : 'Registration is currently disabled - closed beta mode'
  });
});

// Update launch settings (Admin only)
router.post('/toggle-registration', protect, admin, async (req, res) => {
  try {
    const { allowRegistration, launchMode } = req.body;
    
    // Read current .env file
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';
    
    try {
      envContent = fs.readFileSync(envPath, 'utf8');
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Could not read environment file'
      });
    }
    
    // Update the environment variables in the file
    const allowRegValue = allowRegistration ? 'true' : 'false';
    const modeValue = launchMode || 'closed_beta';
    
    // Replace or add ALLOW_REGISTRATION
    if (envContent.includes('ALLOW_REGISTRATION=')) {
      envContent = envContent.replace(/ALLOW_REGISTRATION=.*/g, `ALLOW_REGISTRATION=${allowRegValue}`);
    } else {
      envContent += `\nALLOW_REGISTRATION=${allowRegValue}`;
    }
    
    // Replace or add LAUNCH_MODE
    if (envContent.includes('LAUNCH_MODE=')) {
      envContent = envContent.replace(/LAUNCH_MODE=.*/g, `LAUNCH_MODE=${modeValue}`);
    } else {
      envContent += `\nLAUNCH_MODE=${modeValue}`;
    }
    
    // Write back to .env file
    fs.writeFileSync(envPath, envContent);
    
    // Update process.env for immediate effect
    process.env.ALLOW_REGISTRATION = allowRegValue;
    process.env.LAUNCH_MODE = modeValue;
    
    res.json({
      success: true,
      message: `Registration ${allowRegistration ? 'enabled' : 'disabled'} successfully`,
      allowRegistration: allowRegistration,
      launchMode: modeValue
    });
    
  } catch (error) {
    console.error('Error updating launch settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update launch settings'
    });
  }
});

export default router;