import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import passport from 'passport';

function genToken(id, expiresIn = process.env.JWT_EXPIRES_IN || '24h') {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });
}
function genRefresh(id, expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d') {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn });
}

export const register = async (req, res) => {
  const { name, email, password } = req.body;
  
  try {
    // Check if email is already in use
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ 
        success: false,
        message: 'Email already taken',
        errors: [{ field: 'email', message: 'This email is already registered' }]
      });
    }
    
    const hash = await bcrypt.hash(password, 10);
    // Initialize education and skills arrays when creating a new user
    const user = await User.create({ 
      name, 
      email, 
      password: hash,
      education: [],
      skills: []
    });
    const userData = {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      headline: user.headline,
      bio: user.bio,
      location: user.location,
      pronouns: user.pronouns,
      links: user.links,
      education: user.education,
      experience: user.experience,
      skills: user.skills,
      profileImage: user.profileImage,
      bannerImage: user.bannerImage,
      interviewsCompleted: user.interviewsCompleted,
      applicationsSent: user.applicationsSent,
      profileViews: user.profileViews,
      successRate: user.successRate,
      followers: user.followers,
      following: user.following,
      isVerified: user.isVerified,
      role: user.role
    };
    res.status(201).json({ 
      success: true,
      user: userData, 
      token: genToken(user._id), 
      refresh: genRefresh(user._id) 
    });
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    // Handle other errors
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      errors: [{ field: 'general', message: 'Something went wrong' }]
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid credentials',
      errors: [{ field: 'email', message: 'No account found with this email' }]
    });
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid credentials',
      errors: [{ field: 'password', message: 'Incorrect password' }]
    });
  }
  const userData = {
    _id: user._id,
    id: user._id,
    name: user.name,
    email: user.email,
    headline: user.headline,
    bio: user.bio,
    location: user.location,
    pronouns: user.pronouns,
    links: user.links,
    education: user.education,
    experience: user.experience,
    skills: user.skills,
    profileImage: user.profileImage,
    bannerImage: user.bannerImage,
    interviewsCompleted: user.interviewsCompleted,
    applicationsSent: user.applicationsSent,
    profileViews: user.profileViews,
    successRate: user.successRate,
    followers: user.followers,
    following: user.following,
    isVerified: user.isVerified,
    role: user.role
  };
  res.json({ 
    success: true,
    user: userData, 
    token: genToken(user._id), 
    refresh: genRefresh(user._id) 
  });
};

// Google OAuth handlers (only if configured)
let googleAuth, googleAuthCallback;

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });
  
  googleAuthCallback = (req, res, next) => {
    passport.authenticate('google', { failureRedirect: '/auth/login' }, (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ 
          success: false,
          message: 'Google authentication failed'
        });
      }
      
      // Successful authentication
      const token = genToken(user._id);
      const refresh = genRefresh(user._id);
      
      const userData = {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        headline: user.headline,
        bio: user.bio,
        location: user.location,
        pronouns: user.pronouns,
        links: user.links,
        education: user.education,
        experience: user.experience,
        skills: user.skills,
        profileImage: user.profileImage,
        bannerImage: user.bannerImage,
        interviewsCompleted: user.interviewsCompleted,
        applicationsSent: user.applicationsSent,
        profileViews: user.profileViews,
        successRate: user.successRate,
        followers: user.followers,
        following: user.following,
        isVerified: user.isVerified,
        role: user.role
      };
      
      // For API clients, send JSON response
      res.json({ 
        success: true,
        user: userData, 
        token, 
        refresh 
      });
    })(req, res, next);
  };
} else {
  // If Google OAuth is not configured, return 404
  googleAuth = (req, res) => {
    res.status(404).json({ 
      success: false,
      message: 'Google OAuth not configured' 
    });
  };
  
  googleAuthCallback = (req, res) => {
    res.status(404).json({ 
      success: false,
      message: 'Google OAuth not configured' 
    });
  };
}

export { googleAuth, googleAuthCallback };

export const refreshToken = async (req, res) => {
  const { refresh } = req.body;
  try {
    const decoded = jwt.verify(refresh, process.env.JWT_REFRESH_SECRET);
    res.json({ 
      success: true,
      token: genToken(decoded.id),
      refresh: genRefresh(decoded.id)
    });
  } catch (e) {
    res.status(401).json({ 
      success: false,
      message: 'Invalid refresh token',
      errors: [{ field: 'refresh', message: 'Refresh token is invalid or expired' }]
    });
  }
};

export const logout = async (_req, res) => {
  res.json({ 
    success: true,
    message: 'Logged out successfully' 
  });
};