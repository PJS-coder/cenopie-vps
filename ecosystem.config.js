// PM2 Ecosystem Configuration for Cenopie Production
// This file is used by PM2 to manage the application processes

module.exports = {
  apps: [
    {
      name: 'cenopie-backend',
      script: './backend/src/server.js',
      cwd: '/var/www/cenopie',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      kill_timeout: 5000,
      listen_timeout: 8000,
      // Environment variables for production
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000
      }
    },
    {
      name: 'cenopie-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/cenopie/frontend',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1, // Next.js handles its own optimization
      max_memory_restart: '1G',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      kill_timeout: 5000,
      // Environment variables for production
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ],

  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'cenopie',
      host: 'cenopie.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/cenopie.git',
      path: '/var/www/cenopie',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};