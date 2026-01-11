import express from 'express';
import { protect, admin } from '../middlewares/authMiddleware.js';
import redisClient from '../config/redis.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get system performance metrics (admin only)
router.get('/metrics', protect, admin, async (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      system: {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        cpuUsage: process.cpuUsage(),
        nodeVersion: process.version,
        platform: process.platform,
      },
      database: {
        mongodb: {
          readyState: mongoose.connection.readyState,
          host: mongoose.connection.host,
          name: mongoose.connection.name,
        },
      },
      cache: {
        redis: {
          connected: redisClient.isReady,
        },
      },
    };

    // Get Redis info if connected
    if (redisClient.isReady) {
      try {
        const redisInfo = await redisClient.info();
        const lines = redisInfo.split('\r\n');
        const info = {};
        
        lines.forEach(line => {
          if (line.includes(':')) {
            const [key, value] = line.split(':');
            info[key] = value;
          }
        });
        
        metrics.cache.redis.info = {
          used_memory: info.used_memory,
          used_memory_human: info.used_memory_human,
          connected_clients: info.connected_clients,
          total_commands_processed: info.total_commands_processed,
          keyspace_hits: info.keyspace_hits,
          keyspace_misses: info.keyspace_misses,
        };
      } catch (error) {
        metrics.cache.redis.error = error.message;
      }
    }

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get performance metrics',
      error: error.message,
    });
  }
});

// Get application statistics
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const User = mongoose.model('User');
    const Post = mongoose.model('Post');
    
    const stats = {
      users: {
        total: await User.countDocuments(),
        active: await User.countDocuments({ 
          lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
        }),
        newToday: await User.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }),
      },
      posts: {
        total: await Post.countDocuments(),
        today: await Post.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }),
      },
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get application statistics',
      error: error.message,
    });
  }
});

// Clear cache (admin only)
router.post('/cache/clear', protect, admin, async (req, res) => {
  try {
    const { pattern = '*' } = req.body;
    
    if (redisClient.isReady) {
      const keys = await redisClient.keys(`cache:${pattern}`);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      
      res.json({
        success: true,
        message: `Cleared ${keys.length} cache entries`,
        clearedKeys: keys.length,
      });
    } else {
      res.status(503).json({
        success: false,
        message: 'Redis not connected',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message,
    });
  }
});

export default router;