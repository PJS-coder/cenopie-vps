import cluster from 'cluster';
import os from 'os';
import logger from './config/logger.js';
import { config } from 'dotenv';
config();

// Load environment variables
const PORT = process.env.PORT || 4000;
const NUM_CORES = os.cpus().length;
const CLUSTER_COUNT = Math.min(NUM_CORES, process.env.MAX_CLUSTERS || 4);

if (cluster.isMaster || cluster.isPrimary) {
  console.log(`🚀 Starting Cenopie Backend Cluster...`);
  console.log(`📋 Cores available: ${NUM_CORES}`);
  console.log(`🔧 Clusters to create: ${CLUSTER_COUNT}`);
  console.log(`🖥️  Environment: ${process.env.NODE_ENV || 'development'}`);

  // Fork workers
  for (let i = 0; i < CLUSTER_COUNT; i++) {
    cluster.fork();
  }

  // Worker event handlers
  cluster.on('online', (worker) => {
    console.log(`✅ Worker ${worker.process.pid} is online`);
  });

  cluster.on('exit', (worker, code, signal) => {
    console.log(`⚠️ Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
    console.log(`🔄 Starting a new worker...`);
    cluster.fork();
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('🛑 Shutting down cluster...');
    for (const worker in cluster.workers) {
      cluster.workers[worker].kill();
    }
    setTimeout(() => {
      console.log('💥 Forcefully shutting down...');
      process.exit(0);
    }, 5000);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

} else {
  // Worker processes will run the server
  console.log(`🔧 Worker ${process.pid} starting server...`);
  
  // Import and start the server
  import('./server.js').catch((error) => {
    console.error(`❌ Failed to start server in worker ${process.pid}:`, error);
    process.exit(1);
  });
}