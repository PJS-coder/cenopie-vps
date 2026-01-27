#!/bin/bash

# SSL Setup Script for Cenopie
# This script sets up Let's Encrypt SSL certificates

set -e

echo "🔒 Setting up SSL certificates for cenopie.com..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root (use sudo)"
    exit 1
fi

# Update system packages
print_status "Updating system packages..."
apt update

# Install Certbot
print_status "Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# Stop Nginx temporarily
print_status "Stopping Nginx temporarily..."
systemctl stop nginx 2>/dev/null || true

# Obtain SSL certificate
print_status "Obtaining SSL certificate for cenopie.com..."
certbot certonly --standalone \
    --email admin@cenopie.com \
    --agree-tos \
    --no-eff-email \
    -d cenopie.com \
    -d www.cenopie.com \
    -d api.cenopie.com

# Copy Nginx configuration
print_status "Setting up Nginx configuration..."
cp nginx.conf /etc/nginx/sites-available/cenopie.com

# Enable the site
ln -sf /etc/nginx/sites-available/cenopie.com /etc/nginx/sites-enabled/

# Remove default Nginx site
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
print_status "Testing Nginx configuration..."
nginx -t

# Start Nginx
print_status "Starting Nginx..."
systemctl start nginx
systemctl enable nginx

# Set up automatic certificate renewal
print_status "Setting up automatic certificate renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

print_success "SSL certificates installed successfully!"
print_status "Certificate will auto-renew via cron job"

# Display certificate info
print_status "Certificate information:"
certbot certificates

print_success "🎉 SSL setup completed!"
print_warning "Make sure your DNS is pointing to this server:"
print_warning "  cenopie.com -> $(curl -s ifconfig.me)"
print_warning "  www.cenopie.com -> $(curl -s ifconfig.me)"
print_warning "  api.cenopie.com -> $(curl -s ifconfig.me)"