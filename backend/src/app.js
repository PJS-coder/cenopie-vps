import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './utils/swagger.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import postRoutes from './routes/postRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import profileRoutes from './routes/profileRoutes.js'; // Keep profile routes for general functionality
import connectionRoutes from './routes/connectionRoutes.js';
import searchRoutes from './routes/searchRoutes.js'; // Add search routes
import healthRoutes from './routes/healthRoutes.js';
import jobRoutes from './routes/jobRoutes.js';

import companyRoutes from './routes/companyRoutes.js';
import companyAuthRoutes from './routes/companyAuthRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import companyInterviewRoutes from './routes/companyInterviewRoutes.js';
import adminInterviewRoutes from './routes/adminInterviewRoutes.js';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';
import { performanceMiddleware, memoryMonitor, rateMonitor } from './middlewares/performance.js';
import { cacheMiddleware } from './middlewares/cache.js';
import performanceRoutes from './routes/performanceRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import hrAdminRoutes from './routes/hrAdminRoutes.js';
import showcaseRoutes from './routes/showcaseRoutes.js';
import newsRoutes from './routes/newsRoutes.js';
import launchControlRoutes from './routes/launchControlRoutes.js';
import passport from 'passport';
import './config/passport.js';

const app = express();

// Trust proxy for load balancers
app.set('trust proxy', process.env.TRUST_PROXY || 1);

// List of allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://cenopie.com',
  'https://www.cenopie.com', // Add this line for production
  'https://cenopie-cpanel-vercel.vercel.app',
  'https://cenopie-production-i2d97xotf-pjs-coders-projects.vercel.app',
  'https://cenopie-production.vercel.app',
  /https?:\/\/cenopie-.*-pjs-coders-projects.vercel.app$/, // Match all preview deployments
  /https?:\/\/cenopie-production-.*.vercel.app$/, // Match all production deployments
  /https?:\/\/cenopie-.*\.vercel\.app$/ // Match all Vercel deployments
];

// CORS configuration optimized for high concurrency
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    // Check if the origin matches any of the allowed patterns
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });

    if (!isAllowed) {
      const msg = `The CORS policy for this site does not allow access from ${origin}`;
      console.warn('CORS blocked:', origin);
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Response-Time', 'X-Memory-Usage'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS with the specified options
app.use(cors(corsOptions));

// Handle preflight requests more efficiently
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.header('Origin') || '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-csrf-token,X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(204).send();
});

// Security middleware with optimized settings
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: ["'self'", 'https://api.cenopie.com', 'http://localhost:4000'],
    }
  } : false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'no-referrer' },
  xssFilter: true
}));

// Compression with optimized settings
app.use(compression({
  level: process.env.COMPRESSION_LEVEL || 6,
  threshold: process.env.COMPRESSION_THRESHOLD || '1kb',
  filter: (req, res) => {
    // Don't compress streaming responses or already compressed content
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Don't compress images, videos, or already compressed files
    const contentType = res.getHeader('content-type');
    if (contentType && (
      contentType.includes('image/') ||
      contentType.includes('video/') ||
      contentType.includes('application/zip') ||
      contentType.includes('application/gzip') ||
      contentType.includes('application/octet-stream')
    )) {
      return false;
    }
    
    return compression.filter(req, res);
  },
}));

// Logging with reduced verbosity
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined', {
    skip: (req, res) => res.statusCode < 400, // Only log errors in production
    stream: process.stdout
  }));
} else {
  // Reduced logging in development - skip successful requests
  app.use(morgan('dev', {
    skip: (req, res) => {
      // Skip logging for successful requests and health checks
      return res.statusCode < 400 || req.path === '/health' || req.path === '/api/health';
    }
  }));
}

// Body parsing with optimized limits
app.use(express.json({ 
  limit: process.env.BODY_JSON_LIMIT || '10mb', // Increased from 5mb
  verify: (req, res, buf) => {
    // Add request size monitoring for large requests
    if (buf.length > 5 * 1024 * 1024) { // 5MB warning
      console.warn(`Large request body: ${buf.length} bytes from ${req.ip}`, {
        url: req.originalUrl,
        method: req.method
      });
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: process.env.BODY_URLENCODED_LIMIT || '10mb' 
}));

app.use(cookieParser());

// Add performance monitoring
app.use(performanceMiddleware);
app.use(rateMonitor);

// Start memory monitoring
memoryMonitor();

// Initialize Passport.js
app.use(passport.initialize());

// Enhanced rate limiting with Redis store for clustering
const limiter = rateLimit({ 
  windowMs: process.env.RATE_LIMIT_WINDOW || 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || (process.env.NODE_ENV === 'production' ? 5000 : 10000), // Increased limits significantly
  message: { 
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: process.env.RATE_LIMIT_WINDOW || 15 * 60 * 1000
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => {
    // Skip rate limiting for health checks and static assets
    if (req.path === '/health' || 
        req.path === '/api/health' ||
        req.path.startsWith('/api/docs') ||
        req.method === 'OPTIONS') {
      return true;
    }
    return false;
  },
  // Add per-endpoint rate limiting
  keyGenerator: (req) => {
    // Use IP + endpoint for more granular rate limiting
    return `${req.ip}:${req.path}`;
  }
});

app.use(limiter);

// Health check route (before rate limiting)
app.use('/health', healthRoutes);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/profile', profileRoutes); // Add profile routes
app.use('/api/connections', connectionRoutes);
app.use('/api/search', searchRoutes); // Add search routes
app.use('/api/jobs', jobRoutes);

app.use('/api/companies', companyRoutes);
app.use('/api/company/auth', companyAuthRoutes);
app.use('/api/company', companyAuthRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/company/interviews', companyInterviewRoutes);
app.use('/api/admin/interviews', adminInterviewRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/hr-admin', hrAdminRoutes);
app.use('/api/showcases', showcaseRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/launch-control', launchControlRoutes);

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

export default app;