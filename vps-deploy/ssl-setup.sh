#!/bin/bash

# SSL Certificate Setup Script for Cenopie
# Uses Let's Encrypt with automatic renewal

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

print_info "🔒 SSL Certificate Setup for Cenopie"
echo "===================================="

# Get domain name
if [ -z "$1" ]; then
    read -p "Enter your domain name (e.g., yourdomain.com): " DOMAIN
else
    DOMAIN=$1
fi

if [ -z "$DOMAIN" ]; then
    print_error "Domain name is required"
    exit 1
fi

print_info "Setting up SSL for domain: $DOMAIN"

# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
    print_info "📦 Installing Certbot..."
    apt update
    apt install -y certbot python3-certbot-nginx
fi

# Update Nginx configuration with domain
print_info "🌐 Updating Nginx configuration..."
sed -i "s/server_name _;/server_name $DOMAIN www.$DOMAIN;/" /etc/nginx/sites-available/cenopie

# Test Nginx configuration
nginx -t
if [ $? -ne 0 ]; then
    print_error "Nginx configuration test failed"
    exit 1
fi

# Reload Nginx
systemctl reload nginx

# Obtain SSL certificate
print_info "🔒 Obtaining SSL certificate..."
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "admin@$DOMAIN" --redirect

if [ $? -eq 0 ]; then
    print_status "SSL certificate obtained successfully!"
else
    print_error "Failed to obtain SSL certificate"
    exit 1
fi

# Setup automatic renewal
print_info "🔄 Setting up automatic renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

# Test renewal
print_info "🧪 Testing certificate renewal..."
certbot renew --dry-run

if [ $? -eq 0 ]; then
    print_status "Certificate renewal test passed!"
else
    print_warning "Certificate renewal test failed, but certificate is still valid"
fi

# Update Nginx configuration for better SSL security
print_info "🔧 Enhancing SSL security..."
cat >> /etc/nginx/sites-available/cenopie << 'EOF'

# SSL Security Enhancements
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_stapling on;
ssl_stapling_verify on;

# HSTS (HTTP Strict Transport Security)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
EOF

# Test and reload Nginx
nginx -t && systemctl reload nginx

print_status "🎉 SSL setup completed successfully!"
echo ""
echo "📋 SSL Certificate Information:"
echo "==============================="
certbot certificates

echo ""
echo "🌐 Your application is now available at:"
echo "   https://$DOMAIN"
echo "   https://www.$DOMAIN"
echo ""
echo "🔄 Certificate will auto-renew via cron job"
echo "🔍 Check renewal status: sudo certbot renew --dry-run"

exit 0