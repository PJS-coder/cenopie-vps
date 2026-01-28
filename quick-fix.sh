#!/bin/bash

echo "🔧 Quick Fix for Cenopie Deployment Issues"
echo "=========================================="

# Stop everything
pm2 stop all
pm2 delete all

# Kill processes on ports
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:4000 | xargs kill -9 2>/dev/null || true
sleep 3

# Test environment loading manually
echo "🧪 Testing environment loading..."
cd /var/www/cenopie-vps/backend

# Create a simple test
cat > test-env.js << 'EOF'
import dotenv from 'dotenv';
console.log('Current dir:', process.cwd());
console.log('NODE_ENV before:', process.env.NODE_ENV);
process.env.NODE_ENV = 'production';
dotenv.config({ path: '.env.production' });
console.log('NODE_ENV after:', process.env.NODE_ENV);
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('MONGODB_URI type:', process.env.MONGODB_URI?.includes('mongodb+srv') ? 'Atlas' : 'Local');
console.log('REDIS_DISABLED:', process.env.REDIS_DISABLED);
EOF

node test-env.js
rm test-env.js

# Update ecosystem config to explicitly set environment
cd /var/www/cenopie-vps
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'cenopie-backend',
      script: './src/server.js',
      cwd: '/var/www/cenopie-vps/backend',
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      instances: 1,
      exec_mode: 'fork'
    },
    {
      name: 'cenopie-frontend',
      script: 'node',
      args: '.next/standalone/server.js',
      cwd: '/var/www/cenopie-vps/frontend',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      exec_mode: 'fork'
    }
  ]
};
EOF

# Start with production environment
echo "🚀 Starting with production environment..."
NODE_ENV=production pm2 start ecosystem.config.js --env production

# Wait and check
sleep 5
pm2 status
pm2 logs --lines 20

echo "✅ Quick fix applied!"