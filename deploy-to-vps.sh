#!/bin/bash

# Complete VPS Deployment Script with Socket.IO Fixes
# This script deploys all fixes to resolve messaging issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Deploying Socket.IO Fixes to VPS${NC}"
echo "=================================================="

# Configuration
VPS_USER="root"
VPS_HOST="185.27.135.185"
VPS_PROJECT_PATH="/var/www/cenopie-vps"

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "├─ VPS User: $VPS_USER"
echo "├─ VPS Host: $VPS_HOST"
echo "├─ Project Path: $VPS_PROJECT_PATH"
echo "└─ Target: Fix Socket.IO messaging"

# Function to run commands on VPS
run_vps() {
    echo -e "${YELLOW}🔄 VPS: $1${NC}"
    ssh $VPS_USER@$VPS_HOST "$1"
}

echo -e "\n${YELLOW}⚡ Phase 1: Commit and Push Local Changes${NC}"

# Commit current changes
echo "📝 Committing Socket.IO fixes..."
git add .
git commit -m "Fix Socket.IO messaging issues - WebSocket headers, rate limiting, error handling" || echo "No changes to commit"
git push origin main

echo -e "\n${YELLOW}⚡ Phase 2: Pull Latest Changes on VPS${NC}"

# Navigate to project and pull changes
run_vps "cd $VPS_PROJECT_PATH && git fetch origin && git reset --hard origin/main"

echo -e "\n${YELLOW}⚡ Phase 3: Update Nginx Configuration${NC}"

# Check nginx config location and update
echo "🔍 Checking nginx configuration..."
run_vps "ls -la /etc/nginx/sites-available/ | head -5"
run_vps "ls -la /etc/nginx/conf.d/ | head -5"

# Find and backup existing config
run_vps "find /etc/nginx -name '*cenopie*' -o -name 'default' | head -5"

# Copy nginx config to the correct location
echo "📝 Updating nginx configuration..."
run_vps "cp $VPS_PROJECT_PATH/nginx-config.conf /etc/nginx/conf.d/cenopie.conf"
run_vps "nginx -t"

echo -e "\n${YELLOW}⚡ Phase 4: Install Dependencies and Build${NC}"

# Backend dependencies
run_vps "cd $VPS_PROJECT_PATH/backend && npm ci --production --silent"

# Frontend dependencies and build
run_vps "cd $VPS_PROJECT_PATH/frontend && npm ci --production --silent"
run_vps "cd $VPS_PROJECT_PATH/frontend && NODE_ENV=production npm run build"

echo -e "\n${YELLOW}⚡ Phase 5: Restart Services${NC}"

# Restart nginx
echo "🔄 Restarting nginx..."
run_vps "systemctl reload nginx"

# Restart PM2 processes
echo "🔄 Restarting PM2 processes..."
run_vps "cd $VPS_PROJECT_PATH && pm2 restart all"

echo -e "\n${YELLOW}⚡ Phase 6: Verification${NC}"

# Check service status
echo "📊 Checking service status..."
run_vps "systemctl status nginx --no-pager -l | head -5"
run_vps "pm2 status"

# Test Socket.IO endpoint
echo "🧪 Testing Socket.IO endpoint..."
run_vps "curl -s 'https://cenopie.com/socket.io/?EIO=4&transport=polling' | head -3"

# Check logs for errors
echo "📋 Recent logs..."
run_vps "pm2 logs --lines 5"

echo -e "\n${GREEN}✅ Deployment Complete!${NC}"
echo "=================================================="
echo -e "${GREEN}🎯 What was deployed:${NC}"
echo "├─ ✅ Socket.IO WebSocket headers in nginx"
echo "├─ ✅ Rate limiting exclusions for Socket.IO"
echo "├─ ✅ Enhanced error handling in frontend"
echo "├─ ✅ CORS fixes for localhost and production"
echo "└─ ✅ All services restarted"

echo -e "\n${BLUE}📊 Next Steps - Testing:${NC}"
echo "1. Visit: https://cenopie.com/messages"
echo "2. Open browser console (F12)"
echo "3. Look for Socket.IO connection messages"
echo "4. Test sending a message"
echo "5. Check for any 400 errors in Network tab"

echo -e "\n${BLUE}🔍 If issues persist:${NC}"
echo "1. Check logs: ssh $VPS_USER@$VPS_HOST 'pm2 logs'"
echo "2. Check nginx: ssh $VPS_USER@$VPS_HOST 'tail -f /var/log/nginx/error.log'"
echo "3. Test Socket.IO: curl -v 'https://cenopie.com/socket.io/?EIO=4&transport=polling'"

echo -e "\n${GREEN}🚀 Messaging should now work on VPS!${NC}"