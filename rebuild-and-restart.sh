#!/bin/bash

echo "🔄 Rebuilding and Restarting Cenopie..."
echo "======================================"

# Stop all PM2 processes
echo "⏹️ Stopping PM2 processes..."
pm2 stop all
pm2 delete all

# Kill any processes using ports 3001 and 4000
echo "🔍 Killing processes on ports 3001 and 4000..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:4000 | xargs kill -9 2>/dev/null || true

# Wait for processes to terminate
sleep 3

echo "🏗️ Building frontend..."
cd frontend

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf .next
rm -rf out

# Install dependencies if needed
echo "📦 Checking dependencies..."
npm ci --production=false

# Build for production
echo "🔨 Building for production..."
NODE_ENV=production npm run build:prod

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi

cd ..

echo "🚀 Starting services with updated configuration..."
pm2 start ecosystem.config.js

# Wait for startup
sleep 5

echo "📊 Service Status:"
pm2 status

echo "🧪 Testing services..."

# Test backend
echo "Testing backend..."
BACKEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/health || echo "000")
if [ "$BACKEND_RESPONSE" = "200" ]; then
    echo "✅ Backend responding (200)"
elif [ "$BACKEND_RESPONSE" = "404" ]; then
    echo "⚠️ Backend responding but no health endpoint (404)"
else
    echo "❌ Backend not responding ($BACKEND_RESPONSE)"
fi

# Test frontend
echo "Testing frontend..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 || echo "000")
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo "✅ Frontend responding (200)"
else
    echo "❌ Frontend not responding ($FRONTEND_RESPONSE)"
fi

# Test HTTPS
echo "Testing HTTPS..."
HTTPS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://cenopie.com || echo "000")
if [ "$HTTPS_RESPONSE" = "200" ]; then
    echo "✅ HTTPS working (200)"
else
    echo "⚠️ HTTPS returned: $HTTPS_RESPONSE"
fi

echo ""
echo "📋 Recent logs:"
pm2 logs --lines 5

echo ""
echo "✅ Rebuild and restart complete!"
echo ""
echo "🔗 Your site should now be available at:"
echo "   https://cenopie.com"
echo ""
echo "📋 To monitor:"
echo "   pm2 logs"
echo "   pm2 monit"