#!/bin/bash

# Quick deployment script for Cenopie
echo "🚀 Starting quick deployment..."

# Stop all PM2 processes
echo "🛑 Stopping PM2 processes..."
pm2 stop all
pm2 delete all

# Kill any hanging processes on ports 3000 and 5000
echo "🔪 Killing processes on ports 3000 and 5000..."
sudo fuser -k 3000/tcp 2>/dev/null || true
sudo fuser -k 5000/tcp 2>/dev/null || true

# Backend deployment
echo "📦 Installing backend dependencies..."
cd /var/www/cenopie/cenopie-cpanel-vercel/backend
npm install --production

# Frontend deployment
echo "🎨 Building frontend..."
cd /var/www/cenopie/cenopie-cpanel-vercel/frontend
rm -rf .next
npm install --production
npm run build:prod

# Start applications with PM2
echo "🚀 Starting applications..."
cd /var/www/cenopie/cenopie-cpanel-vercel
pm2 start ecosystem.config.js --env production

# Wait for applications to start
echo "⏳ Waiting for applications to start..."
sleep 10

# Check PM2 status
echo "📊 PM2 Status:"
pm2 status

# Test backend health
echo "🏥 Testing backend health..."
curl -f http://localhost:5000/api/health || echo "❌ Backend health check failed"

# Test frontend
echo "🎨 Testing frontend..."
curl -f http://localhost:3000 || echo "❌ Frontend health check failed"

# Restart nginx
echo "🔄 Restarting nginx..."
sudo systemctl reload nginx

echo "✅ Deployment complete!"
echo "🌐 Check https://cenopie.com"