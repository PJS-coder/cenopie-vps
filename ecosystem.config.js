module.exports = {
  apps: [
    {
      name: 'cenopie-backend',
      cwd: '/var/www/cenopie/cenopie-cpanel-vercel/backend',
      script: 'src/server.js',
      instances: 3,  // Use 3 of 5 cores for backend
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        UV_THREADPOOL_SIZE: 16,  // Increase thread pool
        NODE_OPTIONS: '--max-old-space-size=768 --optimize-for-size'
      },
      max_memory_restart: '800M',  // Tight memory control
      min_uptime: '10s',
      max_restarts: 5,
      autorestart: true,
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      error_file: '/var/log/pm2/cenopie-backend-error.log',
      out_file: '/var/log/pm2/cenopie-backend-out.log',
      log_file: '/var/log/pm2/cenopie-backend.log',
      time: true,
      
      // Ultra-performance Node.js optimizations
      node_args: [
        '--max-old-space-size=768',
        '--optimize-for-size',
        '--gc-interval=100',
        '--expose-gc'
      ].join(' '),
      
      // Performance monitoring
      pmx: true,
      
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 8000,
      
      // Log rotation
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      name: 'cenopie-frontend',
      cwd: '/var/www/cenopie/cenopie-cpanel-vercel/frontend',
      script: 'server.js',
      instances: 2,  // Use 2 cores for frontend
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        UV_THREADPOOL_SIZE: 8,
        NODE_OPTIONS: '--max-old-space-size=512 --optimize-for-size'
      },
      max_memory_restart: '600M',
      min_uptime: '10s',
      max_restarts: 5,
      autorestart: true,
      watch: false,
      error_file: '/var/log/pm2/cenopie-frontend-error.log',
      out_file: '/var/log/pm2/cenopie-frontend-out.log',
      log_file: '/var/log/pm2/cenopie-frontend.log',
      time: true,
      
      // Frontend optimizations
      node_args: [
        '--max-old-space-size=512',
        '--optimize-for-size'
      ].join(' '),
      
      pmx: true,
      kill_timeout: 5000,
      listen_timeout: 8000,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ],
  
  // PM2 deployment configuration
  deploy: {
    production: {
      user: 'cenopie',
      host: '185.27.135.185',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/cenopie.git',
      path: '/var/www/cenopie',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};