#!/bin/bash

# Quick Clean Deployment Script for Cenopie with Cloudflare SSL
# This script performs a fast clean deployment

set -e

echo "🚀 Quick Clean Deployment Starting..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[INFO]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Clean everything
print_status "Cleaning up processes..."
pm2 kill || true
sudo pkill -9 node || true
sudo systemctl stop nginx || true

# Clean configurations
print_status "Cleaning configurations..."
sudo rm -f /etc/nginx/sites-enabled/cenopie*
sudo rm -f /etc/nginx/sites-available/cenopie*

# Update code
print_status "Updating code..."
cd /var/www/cenopie-vps
git fetch origin
git reset --hard origin/main

# Install dependencies
print_status "Installing dependencies..."
cd backend && rm -rf node_modules && npm install
cd ../frontend && rm -rf node_modules .next && npm install && npm run build

# Create SSL directory
print_status "Setting up SSL directory..."
sudo mkdir -p /etc/ssl/cloudflare

# Copy nginx config
print_status "Setting up nginx..."
sudo cp /var/www/cenopie-vps/nginx.conf /etc/nginx/sites-available/cenopie.com
sudo ln -sf /etc/nginx/sites-available/cenopie.com /etc/nginx/sites-enabled/
sudo nginx -t

# Start services
print_status "Starting services..."
cd /var/www/cenopie-vps/backend
pm2 start src/server.js --name "cenopie-backend"

cd /var/www/cenopie-vps/frontend
pm2 start npm --name "cenopie-frontend" -- run start

pm2 save
sudo systemctl start nginx

print_status "✅ Quick deployment completed!"
print_warning "⚠️  Don't forget to add Cloudflare Origin certificates to /etc/ssl/cloudflare/"
print_warning "📋 Next: Configure Cloudflare Dashboard SSL settings"

pm2 status