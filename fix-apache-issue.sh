#!/bin/bash

echo "🔧 Fixing Apache/Nginx conflict..."

# Stop Apache if it's running
echo "🛑 Stopping Apache..."
sudo systemctl stop apache2 2>/dev/null || true
sudo systemctl disable apache2 2>/dev/null || true

# Stop nginx temporarily
echo "🛑 Stopping Nginx..."
sudo systemctl stop nginx

# Kill any processes on ports 80 and 443
echo "🔪 Killing processes on ports 80 and 443..."
sudo fuser -k 80/tcp 2>/dev/null || true
sudo fuser -k 443/tcp 2>/dev/null || true

# Stop all PM2 processes
echo "🛑 Stopping PM2 processes..."
pm2 stop all
pm2 delete all

# Kill processes on application ports
echo "🔪 Killing processes on ports 3000 and 5000..."
sudo fuser -k 3000/tcp 2>/dev/null || true
sudo fuser -k 5000/tcp 2>/dev/null || true

# Wait a moment
sleep 3

# Start applications first
echo "🚀 Starting applications..."
cd /var/www/cenopie/cenopie-cpanel-vercel

# Start backend
echo "📦 Starting backend..."
cd backend
npm install --production
cd ..

# Start frontend
echo "🎨 Starting frontend..."
cd frontend
npm install --production
npm run build:prod
cd ..

# Start with PM2
pm2 start ecosystem.config.js --env production

# Wait for apps to start
echo "⏳ Waiting for applications to start..."
sleep 15

# Check if apps are running
echo "📊 Checking application status..."
pm2 status

# Test applications
echo "🏥 Testing applications..."
curl -f http://localhost:5000/api/health && echo "✅ Backend OK" || echo "❌ Backend failed"
curl -f http://localhost:3000 && echo "✅ Frontend OK" || echo "❌ Frontend failed"

# Start nginx
echo "🚀 Starting Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Test final result
echo "🌐 Testing final result..."
sleep 5
curl -f https://cenopie.com && echo "✅ Website OK" || echo "❌ Website still has issues"

echo "✅ Fix complete!"
echo "🌐 Check https://cenopie.com"