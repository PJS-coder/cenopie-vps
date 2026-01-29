module.exports = {
  apps: [
    {
      name: 'cenopie-backend',
      script: './src/server.js',
      cwd: '/var/www/cenopie-vps/backend',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        // Performance optimizations
        UV_THREADPOOL_SIZE: 128,
        NODE_OPTIONS: '--max-old-space-size=1024'
      },
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      // Logging
      error_file: '/var/log/pm2/cenopie-backend-error.log',
      out_file: '/var/log/pm2/cenopie-backend-out.log',
      log_file: '/var/log/pm2/cenopie-backend.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Auto restart on file changes (disable in production)
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      // Performance monitoring
      pmx: true,
      automation: false
    },
    {
      name: 'cenopie-frontend',
      script: 'npm',
      args: 'run start:prod',
      cwd: '/var/www/cenopie-vps/frontend',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        // Performance optimizations
        NODE_OPTIONS: '--max-old-space-size=512'
      },
      instances: 1, // Single instance for Next.js
      exec_mode: 'fork',
      max_memory_restart: '512M',
      min_uptime: '10s',
      max_restarts: 10,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      // Logging
      error_file: '/var/log/pm2/cenopie-frontend-error.log',
      out_file: '/var/log/pm2/cenopie-frontend-out.log',
      log_file: '/var/log/pm2/cenopie-frontend.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Auto restart on file changes (disable in production)
      watch: false,
      ignore_watch: ['node_modules', '.next'],
      // Performance monitoring
      pmx: true,
      automation: false
    }
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'root',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'your-git-repo',
      path: '/var/www/cenopie-vps',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production'
    }
  }
};