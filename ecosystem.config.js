// PM2 Ecosystem Configuration for Cenopie Production with Cloudflare SSL
// This file is used by PM2 to manage the application processes

module.exports = {
  apps: [
    {
      name: 'cenopie-backend',
      script: './backend/src/server.js',
      cwd: '/var/www/cenopie-vps',
      instances: 1, // Single instance for stability
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 4000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000
      },
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
      node_args: '--max-old-space-size=1024'
    },
    {
      name: 'cenopie-frontend',
      script: 'npm',
      args: 'run start',
      cwd: '/var/www/cenopie-vps/frontend',
      instances: 1, // Next.js handles its own optimization
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
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
      kill_timeout: 5000
    }
  ]
};