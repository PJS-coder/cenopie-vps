import cluster from 'cluster';
import os from 'os';
import logger from './config/logger.js';
import { config } from 'dotenv';
config();

// Enhanced clustering for high concurrency
const PORT = process.env.PORT || 4000;
const NUM_CORES = os.cpus().length;
const MAX_CLUSTERS = process.env.MAX_CLUSTERS || Math.min(NUM_CORES - 2, 20); // Leave 2 cores for system
const INSTANCE_ID = process.env.INSTANCE_ID || 'default';

// Memory monitoring
const MEMORY_THRESHOLD = 0.85; // 85% memory usage threshold
const CHECK_INTERVAL = 30000; // 30 seconds

if (cluster.isMaster || cluster.isPrimary) {
  console.log(`🚀 Starting Canopie Backend Cluster (Instance: ${INSTANCE_ID})`);
  console.log(`📋 Cores available: ${NUM_CORES}`);
  console.log(`🔧 Clusters to create: ${MAX_CLUSTERS}`);
  console.log(`🖥️  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Memory threshold: ${MEMORY_THRESHOLD * 100}%`);

  // Track worker statistics
  const workerStats = new Map();
  let totalRequests = 0;
  let totalErrors = 0;

  // Fork workers
  for (let i = 0; i < MAX_CLUSTERS; i++) {
    const worker = cluster.fork();
    workerStats.set(worker.id, {
      pid: worker.process.pid,
      requests: 0,
      errors: 0,
      memory: 0,
      cpu: 0,
      startTime: Date.now()
    });
  }

  // Worker event handlers
  cluster.on('online', (worker) => {
    console.log(`✅ Worker ${worker.process.pid} (ID: ${worker.id}) is online`);
  });

  cluster.on('exit', (worker, code, signal) => {
    console.log(`⚠️ Worker ${worker.process.pid} (ID: ${worker.id}) died with code ${code} and signal ${signal}`);
    
    // Clean up stats
    workerStats.delete(worker.id);
    
    // Fork new worker
    console.log(`🔄 Starting a new worker...`);
    const newWorker = cluster.fork();
    workerStats.set(newWorker.id, {
      pid: newWorker.process.pid,
      requests: 0,
      errors: 0,
      memory: 0,
      cpu: 0,
      startTime: Date.now()
    });
  });

  // Handle worker messages for statistics
  cluster.on('message', (worker, message) => {
    if (message.type === 'stats') {
      const stats = workerStats.get(worker.id);
      if (stats) {
        stats.requests = message.requests;
        stats.errors = message.errors;
        stats.memory = message.memory;
        stats.cpu = message.cpu;
      }
    }
  });

  // Periodic statistics logging
  setInterval(() => {
    let totalReqs = 0;
    let totalErrs = 0;
    let totalMem = 0;
    let workerCount = 0;

    console.log('\n📊 Cluster Statistics:');
    console.log('┌─────────┬──────────┬───────────┬─────────┬──────────┬─────────────┐');
    console.log('│ Worker  │   PID    │ Requests  │ Errors  │ Memory   │   Uptime    │');
    console.log('├─────────┼──────────┼───────────┼─────────┼──────────┼─────────────┤');

    for (const [workerId, stats] of workerStats) {
      const uptime = Math.floor((Date.now() - stats.startTime) / 1000);
      const uptimeStr = `${Math.floor(uptime / 60)}m ${uptime % 60}s`;
      const memoryMB = Math.round(stats.memory / 1024 / 1024);
      
      console.log(`│ ${workerId.toString().padStart(7)} │ ${stats.pid.toString().padStart(8)} │ ${stats.requests.toString().padStart(9)} │ ${stats.errors.toString().padStart(7)} │ ${memoryMB.toString().padStart(6)}MB │ ${uptimeStr.padStart(11)} │`);
      
      totalReqs += stats.requests;
      totalErrs += stats.errors;
      totalMem += stats.memory;
      workerCount++;
    }

    console.log('└─────────┴──────────┴───────────┴─────────┴──────────┴─────────────┘');
    console.log(`📈 Total Requests: ${totalReqs} | Total Errors: ${totalErrs} | Avg Memory: ${Math.round(totalMem / workerCount / 1024 / 1024)}MB`);
    console.log(`🎯 Error Rate: ${totalReqs > 0 ? ((totalErrs / totalReqs) * 100).toFixed(2) : 0}%`);
  }, 60000); // Every minute

  // Memory monitoring and worker recycling
  setInterval(() => {
    for (const [workerId, stats] of workerStats) {
      const memoryUsage = stats.memory / (1024 * 1024 * 1024); // GB
      
      if (memoryUsage > 4) { // If worker uses more than 4GB
        console.log(`⚠️ Worker ${workerId} using ${memoryUsage.toFixed(2)}GB memory, recycling...`);
        
        const worker = Object.values(cluster.workers).find(w => w.id === workerId);
        if (worker) {
          worker.kill('SIGTERM');
        }
      }
    }
  }, CHECK_INTERVAL);

  // Graceful shutdown
  const shutdown = () => {
    console.log('🛑 Shutting down cluster...');
    
    for (const worker in cluster.workers) {
      cluster.workers[worker].send('shutdown');
      cluster.workers[worker].kill('SIGTERM');
    }
    
    setTimeout(() => {
      console.log('💥 Forcefully shutting down...');
      process.exit(0);
    }, 10000); // 10 second grace period
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Health check endpoint for load balancer
  const setupHealthCheck = async () => {
    try {
      const { default: express } = await import('express');
      const healthApp = express();
      
      healthApp.get('/health', (req, res) => {
        const healthStatus = {
          status: 'healthy',
          instance: INSTANCE_ID,
          workers: workerStats.size,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString()
        };
        res.json(healthStatus);
      });
      
      healthApp.listen(PORT + 1000, () => {
        console.log(`🏥 Health check server running on port ${PORT + 1000}`);
      });
    } catch (error) {
      console.warn('⚠️ Health check server setup failed:', error.message);
    }
  };

  setupHealthCheck();

} else {
  // Worker process
  console.log(`🔧 Worker ${process.pid} (ID: ${cluster.worker.id}) starting server...`);
  
  // Worker statistics tracking
  let requestCount = 0;
  let errorCount = 0;
  
  // Send statistics to master periodically
  setInterval(() => {
    const memUsage = process.memoryUsage();
    
    process.send({
      type: 'stats',
      requests: requestCount,
      errors: errorCount,
      memory: memUsage.rss,
      cpu: process.cpuUsage()
    });
  }, 10000); // Every 10 seconds
  
  // Listen for shutdown signal
  process.on('message', (message) => {
    if (message === 'shutdown') {
      console.log(`🔄 Worker ${process.pid} received shutdown signal`);
      process.exit(0);
    }
  });
  
  // Increment request counter (to be called from app middleware)
  global.incrementRequestCount = () => requestCount++;
  global.incrementErrorCount = () => errorCount++;
  
  // Import and start the server
  import('./server.js').catch((error) => {
    console.error(`❌ Failed to start server in worker ${process.pid}:`, error);
    process.exit(1);
  });
}