import logger from '../config/logger.js';

export function notFound(req, res, next) {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
}

export function errorHandler(err, req, res, _next) {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Log error with context
  logger.error('Error occurred', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    statusCode,
    timestamp: new Date().toISOString()
  });

  res.status(statusCode);
  res.json({ 
    message: err.message || 'Server Error',
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    ...(process.env.NODE_ENV !== 'production' && { 
      url: req.originalUrl,
      method: req.method 
    })
  });
}