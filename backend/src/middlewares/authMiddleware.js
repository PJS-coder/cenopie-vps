import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function protect(req, res, next) {
  try {
    let token = null;
    const auth = req.headers.authorization;
    
    if (auth && auth.startsWith('Bearer ')) token = auth.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Not authorized - no token' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if it's a company token or user token
    if (decoded.type === 'company') {
      // Handle company token
      const Company = (await import('../models/Company.js')).default;
      const company = await Company.findById(decoded.id);
      
      if (!company) {
        return res.status(401).json({ message: 'Not authorized - company not found' });
      }
      
      req.company = company;
      req.user = { id: company._id, type: 'company' }; // For compatibility
    } else {
      // Handle user token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({ message: 'Not authorized - user not found' });
      }
      
      req.user = user;
    }
    
    next();
  } catch (e) {
    // Only log actual errors, not expired tokens (those are normal)
    if (e.name !== 'TokenExpiredError') {
      console.error('Authentication error:', e.message);
    }
    
    if (e.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Not authorized - invalid token' });
    }
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Not authorized - token expired' });
    }
    return res.status(401).json({ message: 'Not authorized - token invalid' });
  }
}

export function admin(req, res, next) {
  // Check both role and isAdmin field
  if (req.user && (req.user.role === 'admin' || req.user.isAdmin === true)) {
    return next();
  }
  return res.status(403).json({ message: 'Admin access required' });
}

export function moderator(req, res, next) {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'moderator')) return next();
  return res.status(403).json({ message: 'Moderator only' });
}

export function hr(req, res, next) {
  // Check if user has HR or admin role
  if (req.user && (req.user.role === 'hr' || req.user.role === 'admin')) {
    return next();
  }
  return res.status(403).json({ message: 'HR access required' });
}