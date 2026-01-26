#!/bin/bash

# Cenopie Deployment Status Checker
# Quick script to check if everything is running properly

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

echo "🔍 Cenopie Deployment Status Check"
echo "=================================="

# Check if application directory exists
if [ -d "/opt/cenopie" ]; then
    print_status "Application directory exists"
else
    print_error "Application directory not found"
    exit 1
fi

# Check PM2 processes
print_info "PM2 Process Status:"
pm2 status 2>/dev/null || print_warning "PM2 not running or no processes found"

# Check if ports are listening
print_info "Port Status:"
if netstat -tlnp 2>/dev/null | grep -q ":3000"; then
    print_status "Frontend port 3000 is listening"
else
    print_error "Frontend port 3000 is not listening"
fi

if netstat -tlnp 2>/dev/null | grep -q ":4000"; then
    print_status "Backend port 4000 is listening"
else
    print_error "Backend port 4000 is not listening"
fi

if netstat -tlnp 2>/dev/null | grep -q ":80"; then
    print_status "Nginx port 80 is listening"
else
    print_error "Nginx port 80 is not listening"
fi

# Check Nginx status
print_info "Nginx Status:"
if systemctl is-active --quiet nginx; then
    print_status "Nginx is running"
else
    print_error "Nginx is not running"
fi

# Check environment files
print_info "Environment Files:"
if [ -f "/opt/cenopie/backend/.env.production" ]; then
    print_status "Backend environment file exists"
else
    print_warning "Backend environment file missing"
fi

if [ -f "/opt/cenopie/frontend/.env.production" ]; then
    print_status "Frontend environment file exists"
else
    print_warning "Frontend environment file missing"
fi

# Check recent logs for errors
print_info "Recent Error Check:"
if [ -f "/opt/cenopie/logs/backend-error.log" ]; then
    ERROR_COUNT=$(tail -n 50 /opt/cenopie/logs/backend-error.log 2>/dev/null | wc -l)
    if [ "$ERROR_COUNT" -gt 0 ]; then
        print_warning "Found $ERROR_COUNT recent backend errors"
    else
        print_status "No recent backend errors"
    fi
else
    print_info "Backend error log not found"
fi

# Test HTTP endpoints
print_info "HTTP Endpoint Tests:"
if curl -s -o /dev/null -w "%{http_code}" http://localhost/health | grep -q "200"; then
    print_status "Health endpoint responding"
else
    print_warning "Health endpoint not responding"
fi

if curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health | grep -q "200"; then
    print_status "API health endpoint responding"
else
    print_warning "API health endpoint not responding"
fi

echo ""
print_info "💡 Useful Commands:"
echo "  - View PM2 logs: pm2 logs"
echo "  - Restart services: pm2 restart all"
echo "  - Check nginx config: sudo nginx -t"
echo "  - View nginx logs: sudo tail -f /var/log/nginx/cenopie_error.log"
echo "  - Edit backend env: sudo nano /opt/cenopie/backend/.env.production"
echo "  - Edit frontend env: sudo nano /opt/cenopie/frontend/.env.production"

exit 0