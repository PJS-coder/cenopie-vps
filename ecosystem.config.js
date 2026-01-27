module.exports = {
  apps: [
    {
      name: 'cenopie-backend',
      script: './backend/src/server.js',
      cwd: '/var/www/cenopie-vps',
      env: {
        NODE_ENV: 'development',
        PORT: 4000
      }
    },
    {
      name: 'cenopie-frontend',
      script: 'npm',
      args: 'run dev',
      cwd: '/var/www/cenopie-vps/frontend',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      }
    }
  ]
};