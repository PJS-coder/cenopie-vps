/**
 * Registration Control Middleware
 * Blocks new user registrations when ALLOW_REGISTRATION is false
 */

export const checkRegistrationAllowed = (req, res, next) => {
  const allowRegistration = process.env.ALLOW_REGISTRATION === 'true';
  
  if (!allowRegistration) {
    return res.status(403).json({
      success: false,
      message: 'New user registrations are currently disabled. Cenopie is in closed beta mode.',
      code: 'REGISTRATION_DISABLED',
      launchMode: process.env.LAUNCH_MODE || 'closed_beta'
    });
  }
  
  next();
};

export const getRegistrationStatus = (req, res) => {
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
};