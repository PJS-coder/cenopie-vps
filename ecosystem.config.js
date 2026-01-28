module.exports = {
  apps: [
    {
      name: 'cenopie-backend',
      script: './src/server.js',
      cwd: '/var/www/cenopie-vps/backend',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/cenopie-backend-error.log',
      out_file: '/var/log/pm2/cenopie-backend-out.log',
      log_file: '/var/log/pm2/cenopie-backend.log',
      time: true
    },
    {
      name: 'cenopie-frontend',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/cenopie-vps/frontend',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      error_file: '/var/log/pm2/cenopie-frontend-error.log',
      out_file: '/var/log/pm2/cenopie-frontend-out.log',
      log_file: '/var/log/pm2/cenopie-frontend.log',
      time: true
    }
  ]
};