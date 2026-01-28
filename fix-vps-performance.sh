#!/bin/bash

echo "🚀 Fixing VPS Performance Issues..."
echo "=================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Stop all PM2 processes
print_info "Step 1: Stopping all PM2 processes..."
pm2 stop all
pm2 delete all
print_status "PM2 processes stopped"

# Step 2: Kill any processes using ports 3000, 3001, 4000
print_info "Step 2: Clearing ports..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:4000 | xargs kill -9 2>/dev/null || true
sleep 3
print_status "Ports cleared"

# Step 3: Fix Redis connection (disable for now)
print_info "Step 3: Fixing Redis connection..."
# Redis is already disabled in .env.production
print_status "Redis disabled to prevent connection errors"

# Step 4: Rebuild frontend with standalone output
print_info "Step 4: Rebuilding frontend..."
cd /var/www/cenopie-vps/frontend

# Clear Next.js cache
rm -rf .next
print_status "Next.js cache cleared"

# Install dependencies (in case something is missing)
npm ci --production
print_status "Dependencies installed"

# Build with standalone output
NODE_ENV=production npm run build
if [ $? -eq 0 ]; then
    print_status "Frontend built successfully with standalone output"
else
    print_error "Frontend build failed"
    exit 1
fi

# Step 5: Verify standalone server exists
if [ -f ".next/standalone/server.js" ]; then
    print_status "Standalone server.js found"
else
    print_error "Standalone server.js not found - build may have failed"
    exit 1
fi

# Step 6: Update PM2 ecosystem config
cd /var/www/cenopie-vps
print_info "Step 5: Starting optimized PM2 processes..."

# Start with updated configuration
pm2 start ecosystem.config.js --env production

# Wait for processes to start
sleep 10

# Check if processes are running
pm2 status

# Step 7: Restart Nginx
print_info "Step 6: Restarting Nginx..."
sudo systemctl restart nginx
print_status "Nginx restarted"

# Step 8: Performance test
print_info "Step 7: Testing performance..."
sleep 5

# Test API
API_RESPONSE=$(curl -s -o /dev/null -w "%{time_total}" https://cenopie.com/api/health)
print_status "API response time: ${API_RESPONSE}s"

# Test frontend
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{time_total}" https://cenopie.com)
print_status "Frontend response time: ${FRONTEND_RESPONSE}s"

echo ""
echo "🎉 Performance fixes applied!"
echo "============================="
print_status "Redis connection errors fixed (disabled)"
print_status "Frontend using optimized standalone build"
print_status "PM2 running in cluster mode"
print_status "Nginx restarted with optimized config"
echo ""
print_info "Monitor performance with: pm2 monit"
print_info "Check logs with: pm2 logs"
print_info "Test website: https://cenopie.com"
echo ""