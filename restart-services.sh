#!/bin/bash

echo "🔄 Restarting Cenopie Services..."

# Stop all PM2 processes
echo "⏹️ Stopping PM2 processes..."
pm2 stop all
pm2 delete all

# Kill any processes using ports 3000 and 4000
echo "🔍 Checking for processes on ports 3000 and 4000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:4000 | xargs kill -9 2>/dev/null || true

# Wait a moment for processes to fully terminate
sleep 3

# Debug environment loading
echo "🔍 Debugging environment..."
echo "Current directory: $(pwd)"
echo "Backend .env.production exists: $(test -f backend/.env.production && echo 'YES' || echo 'NO')"
echo "Frontend .env.production exists: $(test -f frontend/.env.production && echo 'YES' || echo 'NO')"

if [ -f backend/.env.production ]; then
    echo "Backend MongoDB URI configured: $(grep -q 'MONGODB_URI=mongodb+srv' backend/.env.production && echo 'YES (Atlas)' || echo 'NO (Local)')"
    echo "Backend Redis disabled: $(grep -q 'REDIS_DISABLED=true' backend/.env.production && echo 'YES' || echo 'NO')"
fi

# Create log directories if they don't exist
echo "📁 Creating log directories..."
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2

# Test backend environment loading
echo "🧪 Testing backend environment loading..."
cd backend
NODE_ENV=production node -e "
import dotenv from 'dotenv';
dotenv.config({ path: '.env.production' });
console.log('MONGODB_URI loaded:', process.env.MONGODB_URI ? 'YES' : 'NO');
console.log('URI type:', process.env.MONGODB_URI?.includes('mongodb+srv') ? 'Atlas' : 'Local');
console.log('REDIS_DISABLED:', process.env.REDIS_DISABLED);
" 2>/dev/null || echo "❌ Environment test failed"
cd ..

# Start services with the updated configuration
echo "🚀 Starting services..."
pm2 start ecosystem.config.js

# Wait a moment for startup
sleep 5

# Show status
echo "📊 Service Status:"
pm2 status

echo "📋 Recent logs:"
pm2 logs --lines 10

echo "✅ Services restarted successfully!"
echo ""
echo "📋 To monitor logs:"
echo "   Backend:  pm2 logs cenopie-backend"
echo "   Frontend: pm2 logs cenopie-frontend"
echo "   All:      pm2 logs"