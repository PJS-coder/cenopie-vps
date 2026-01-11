import express from 'express';
import mongoose from 'mongoose';
import redisClient from '../config/redis.js';
import logger from '../config/logger.js';

const router = express.Router();

// Basic health check
router.get('/', (_req, res) => {
  res.json({ ok: true });
});

// Detailed health check with dependencies
router.get('/detailed', async (req, res) => {
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    dependencies: {}
  };

  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState === 1) {
      healthCheck.dependencies.mongodb = { status: 'connected' };
    } else {
      healthCheck.dependencies.mongodb = { status: 'disconnected' };
      healthCheck.status = 'degraded';
    }

    // Check Redis connection
    try {
      if (redisClient && redisClient.isOpen) {
        await redisClient.ping();
        healthCheck.dependencies.redis = { status: 'connected' };
      } else {
        healthCheck.dependencies.redis = { 
          status: 'disabled', 
          message: 'Redis is disabled or not configured' 
        };
      }
    } catch (error) {
      healthCheck.dependencies.redis = { 
        status: 'disconnected', 
        error: error.message 
      };
      healthCheck.status = 'degraded';
    }

    // Memory usage
    const memUsage = process.memoryUsage();
    healthCheck.memory = {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)} MB`
    };

    logger.info('Health check performed', { 
      status: healthCheck.status,
      ip: req.ip 
    });

    res.json(healthCheck);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

export default router;
