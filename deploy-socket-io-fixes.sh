#!/bin/bash

# Deploy Socket.IO Fixes to Production Server
# This script updates the production server with Socket.IO 400 error fixes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 Deploying Socket.IO Fixes to Production${NC}"
echo "=================================================="

# Configuration
DOMAIN="cenopie.com"
SERVER_IP="185.27.135.185"
SERVER_USER="pjs"  # Replace with your server username

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "├─ Domain: $DOMAIN"
echo "├─ Server IP: $SERVER_IP"
echo "├─ Server User: $SERVER_USER"
echo "└─ Fixes: Socket.IO 400 errors"

# Function to run commands on remote server
run_remote() {
    echo -e "${YELLOW}🔄 Running on server: $1${NC}"
    ssh $SERVER_USER@$SERVER_IP "$1"
}

# Function to copy files to remote server
copy_to_server() {
    echo -e "${YELLOW}📤 Copying: $1 → $2${NC}"
    scp "$1" $SERVER_USER@$SERVER_IP:"$2"
}

echo -e "\n${YELLOW}⚡ Phase 1: Uploading Updated Files${NC}"

# Upload nginx configuration
echo "📝 Uploading nginx configuration..."
copy_to_server "nginx-config.conf" "/tmp/nginx-config.conf"

# Upload backend app.js
echo "📝 Uploading backend app.js..."
copy_to_server "backend/src/app.js" "/tmp/app.js"

# Upload frontend useSocket.ts
echo "📝 Uploading frontend useSocket.ts..."
copy_to_server "frontend/hooks/useSocket.ts" "/tmp/useSocket.ts"

echo -e "\n${YELLOW}⚡ Phase 2: Backing Up Current Files${NC}"

# Create backup directory
run_remote "mkdir -p ~/backups/$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="~/backups/$(date +%Y%m%d_%H%M%S)"

# Backup current files
echo "💾 Backing up current files..."
run_remote "sudo cp /etc/nginx/sites-available/cenopie.com $BACKUP_DIR/nginx-config.conf.backup"
run_remote "cp ~/Cenopie-production-main/backend/src/app.js $BACKUP_DIR/app.js.backup"
run_remote "cp ~/Cenopie-production-main/frontend/hooks/useSocket.ts $BACKUP_DIR/useSocket.ts.backup"

echo -e "\n${YELLOW}⚡ Phase 3: Applying Fixes${NC}"

# Update nginx configuration
echo "🔧 Updating nginx configuration..."
run_remote "sudo cp /tmp/nginx-config.conf /etc/nginx/sites-available/cenopie.com"
run_remote "sudo nginx -t"  # Test nginx configuration

# Update backend files
echo "🔧 Updating backend files..."
run_remote "cp /tmp/app.js ~/Cenopie-production-main/backend/src/app.js"

# Update frontend files
echo "🔧 Updating frontend files..."
run_remote "cp /tmp/useSocket.ts ~/Cenopie-production-main/frontend/hooks/useSocket.ts"

echo -e "\n${YELLOW}⚡ Phase 4: Rebuilding and Restarting Services${NC}"

# Rebuild frontend
echo "🏗️ Rebuilding frontend..."
run_remote "cd ~/Cenopie-production-main/frontend && npm run build"

# Restart services
echo "🔄 Restarting nginx..."
run_remote "sudo systemctl reload nginx"

echo "🔄 Restarting backend..."
run_remote "cd ~/Cenopie-production-main && pm2 restart backend"

echo "🔄 Restarting frontend..."
run_remote "cd ~/Cenopie-production-main && pm2 restart frontend"

echo -e "\n${YELLOW}⚡ Phase 5: Verification${NC}"

# Check service status
echo "📊 Checking service status..."
echo "Nginx status:"
run_remote "sudo systemctl status nginx --no-pager -l | head -10"

echo "PM2 status:"
run_remote "pm2 status"

# Test Socket.IO endpoint
echo "🧪 Testing Socket.IO endpoint..."
run_remote "curl -s 'https://cenopie.com/socket.io/?EIO=4&transport=polling' | head -5"

echo -e "\n${GREEN}✅ Socket.IO Fixes Deployed Successfully!${NC}"
echo "=================================================="
echo -e "${GREEN}🎯 Fixes Applied:${NC}"
echo "├─ ✅ Nginx WebSocket headers added"
echo "├─ ✅ Backend rate limiting updated"
echo "├─ ✅ Frontend error handling enhanced"
echo "└─ ✅ Services restarted"

echo -e "\n${BLUE}📊 Next Steps:${NC}"
echo "1. Test Socket.IO connection in browser console"
echo "2. Monitor logs: ssh $SERVER_USER@$SERVER_IP 'pm2 logs'"
echo "3. Check nginx logs: ssh $SERVER_USER@$SERVER_IP 'sudo tail -f /var/log/nginx/error.log'"
echo "4. Verify no more 400 errors in browser network tab"

echo -e "\n${GREEN}🚀 Socket.IO should now work without 400 errors!${NC}"

# Cleanup temporary files
echo "🧹 Cleaning up temporary files..."
run_remote "rm -f /tmp/nginx-config.conf /tmp/app.js /tmp/useSocket.ts"

echo -e "\n${GREEN}✅ Deployment Complete!${NC}"