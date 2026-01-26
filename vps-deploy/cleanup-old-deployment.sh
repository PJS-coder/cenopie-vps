#!/bin/bash

# Cleanup script for removing old deployment files from VPS
# Run this on your VPS to clean up old deployment configurations

set -e

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

print_info "🧹 Cleaning up old Cenopie deployment files..."

# Stop old services if they exist
print_info "Stopping old services..."
sudo systemctl stop cenopie-backend 2>/dev/null || true
sudo systemctl stop cenopie-frontend 2>/dev/null || true
sudo systemctl disable cenopie-backend 2>/dev/null || true
sudo systemctl disable cenopie-frontend 2>/dev/null || true

# Stop PM2 processes
print_info "Stopping PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Remove old systemd services
print_info "Removing old systemd services..."
sudo rm -f /etc/systemd/system/cenopie-*.service
sudo systemctl daemon-reload

# Remove old nginx configurations
print_info "Removing old nginx configurations..."
sudo rm -f /etc/nginx/sites-available/cenopie*
sudo rm -f /etc/nginx/sites-enabled/cenopie*
sudo rm -f /etc/nginx/sites-enabled/default

# Remove old application directory
print_info "Removing old application directory..."
sudo rm -rf /opt/cenopie

# Remove old logs
print_info "Removing old logs..."
sudo rm -rf /var/log/cenopie*
sudo rm -rf /opt/cenopie/logs

# Remove old cron jobs
print_info "Removing old cron jobs..."
crontab -l 2>/dev/null | grep -v cenopie | crontab - 2>/dev/null || true

# Remove old backup scripts
print_info "Removing old backup scripts..."
sudo rm -f /usr/local/bin/cenopie-backup

# Clean up any remaining processes
print_info "Cleaning up remaining processes..."
sudo pkill -f "cenopie" 2>/dev/null || true
sudo pkill -f "node.*cenopie" 2>/dev/null || true

# Reset nginx to default state
print_info "Resetting nginx..."
sudo nginx -t && sudo systemctl restart nginx || print_warning "Nginx configuration may need manual fixing"

print_status "🎉 Cleanup completed!"
print_info "You can now run the new deployment script."
print_warning "Make sure to backup any important data before running this script!"

exit 0