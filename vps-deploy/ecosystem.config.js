// PM2 Ecosystem Configuration for Cenopie
// Production-ready process management

module.exports = {
  apps: [
    {
      name: 'cenopie-backend',
      script: 'src/server.js',
      cwd: '/opt/cenopie/backend',
      instances: 1, // Can be increased based on CPU cores
      exec_mode: 'fork', // Use 'cluster' for multiple instances
      env: {
        NODE_ENV: 'development',
        PORT: 4000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      // Logging
      log_file: '/opt/cenopie/logs/backend-combined.log',
      out_file: '/opt/cenopie/logs/backend-out.log',
      error_file: '/opt/cenopie/logs/backend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Process management
      autorestart: true,
      watch: false, // Set to true for development
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Advanced settings
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Health monitoring
      health_check_grace_period: 3000,
      
      // Environment-specific settings
      node_args: '--max-old-space-size=1024'
    },
    {
      name: 'cenopie-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/opt/cenopie/frontend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Logging
      log_file: '/opt/cenopie/logs/frontend-combined.log',
      out_file: '/opt/cenopie/logs/frontend-out.log',
      error_file: '/opt/cenopie/logs/frontend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Process management
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Advanced settings
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Health monitoring
      health_check_grace_period: 3000,
      
      // Environment-specific settings
      node_args: '--max-old-space-size=1024'
    }
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'ubuntu',
      host: ['your-server-ip'],
      ref: 'origin/main',
      repo: 'https://github.com/your-username/cenopie.git',
      path: '/opt/cenopie',
      'post-deploy': 'cd backend && npm install --production && cd ../frontend && npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt update && apt install git -y'
    }
  }
};