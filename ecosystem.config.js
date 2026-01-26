module.exports = {
  apps: [
    {
      name: 'cenopie-backend',
      cwd: '/var/www/cenopie/cenopie-cpanel-vercel/backend',
      script: 'src/server.js',
      instances: 'max',  // Use all available cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,  // Updated to match server.js
        UV_THREADPOOL_SIZE: 16,
        NODE_OPTIONS: '--max-old-space-size=1024 --optimize-for-size'
      },
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      autorestart: true,
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      error_file: '/var/log/pm2/cenopie-backend-error.log',
      out_file: '/var/log/pm2/cenopie-backend-out.log',
      log_file: '/var/log/pm2/cenopie-backend.log',
      time: true,
      
      // Latest Node.js optimizations
      node_args: [
        '--max-old-space-size=1024',
        '--optimize-for-size',
        '--gc-interval=100',
        '--expose-gc',
        '--enable-source-maps'
      ].join(' '),
      
      // Enhanced monitoring
      pmx: true,
      monitoring: true,
      
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 8000,
      
      // Log rotation
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Health checks
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true
    },
    {
      name: 'cenopie-frontend',
      cwd: '/var/www/cenopie/cenopie-cpanel-vercel/frontend',
      script: 'server.js',
      instances: 2,  // Frontend needs fewer instances
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        UV_THREADPOOL_SIZE: 8,
        NODE_OPTIONS: '--max-old-space-size=768 --optimize-for-size',
        NEXT_TELEMETRY_DISABLED: 1
      },
      max_memory_restart: '800M',
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
        '--max-old-space-size=768',
        '--optimize-for-size',
        '--enable-source-maps'
      ].join(' '),
      
      pmx: true,
      monitoring: true,
      kill_timeout: 5000,
      listen_timeout: 8000,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Health checks
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true
    }
  ],
  
  // Latest PM2 deployment configuration
  deploy: {
    production: {
      user: 'root',
      host: ['cenopie.com'],
      ref: 'origin/main',
      repo: 'https://github.com/PJS-coder/cenopie-cpanel-vercel.git',
      path: '/var/www/cenopie',
      'pre-deploy-local': '',
      'post-deploy': 'npm install --production && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'ForwardAgent=yes'
    }
  }
};