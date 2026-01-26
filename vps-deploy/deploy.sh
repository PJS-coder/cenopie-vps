#!/bin/bash

# Cenopie VPS Automated Deployment Script
# Ubuntu 20.04+ compatible

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_NAME="cenopie"
APP_DIR="/opt/$APP_NAME"
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"
SYSTEMD_DIR="/etc/systemd/system"

# Functions
print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

print_info "🚀 Starting Cenopie VPS Deployment"
echo "=================================="

# Get the actual user (not root when using sudo)
ACTUAL_USER=${SUDO_USER:-$USER}
ACTUAL_HOME=$(eval echo ~$ACTUAL_USER)

print_info "Deploying for user: $ACTUAL_USER"
print_info "User home: $ACTUAL_HOME"

# Update system
print_info "📦 Updating system packages..."
apt update && apt upgrade -y

# Install essential packages
print_info "📦 Installing essential packages..."
apt install -y curl wget git nginx ufw fail2ban htop

# Install Node.js 18
print_info "📦 Installing Node.js 18..."
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'v' -f2 | cut -d'.' -f1) -lt 18 ]]; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi

NODE_VERSION=$(node --version)
print_status "Node.js installed: $NODE_VERSION"

# Install PM2 globally
print_info "📦 Installing PM2..."
npm install -g pm2

# Setup firewall
print_info "🔥 Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80
ufw allow 443
ufw --force enable

# Create application directory
print_info "📁 Creating application directory..."
mkdir -p $APP_DIR
chown $ACTUAL_USER:$ACTUAL_USER $APP_DIR

# Copy application files (assuming script is run from project root)
print_info "📋 Copying application files..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Copy backend
cp -r "$PROJECT_ROOT/backend" $APP_DIR/
chown -R $ACTUAL_USER:$ACTUAL_USER $APP_DIR/backend

# Copy frontend
cp -r "$PROJECT_ROOT/frontend" $APP_DIR/
chown -R $ACTUAL_USER:$ACTUAL_USER $APP_DIR/frontend

# Copy deployment files
cp -r "$PROJECT_ROOT/vps-deploy" $APP_DIR/
chown -R $ACTUAL_USER:$ACTUAL_USER $APP_DIR/vps-deploy

# Install backend dependencies
print_info "📦 Installing backend dependencies..."
cd $APP_DIR/backend
sudo -u $ACTUAL_USER npm install --production

# Install frontend dependencies and build
print_info "📦 Installing frontend dependencies and building..."
cd $APP_DIR/frontend
sudo -u $ACTUAL_USER npm install
sudo -u $ACTUAL_USER npm run build:prod

# Create environment files from templates
print_info "📝 Creating environment files..."
if [ ! -f "$APP_DIR/backend/.env.production" ]; then
    cp "$APP_DIR/vps-deploy/templates/.env.backend.template" "$APP_DIR/backend/.env.production"
    chown $ACTUAL_USER:$ACTUAL_USER "$APP_DIR/backend/.env.production"
    print_warning "Please edit $APP_DIR/backend/.env.production with your configuration"
fi

if [ ! -f "$APP_DIR/frontend/.env.production" ]; then
    cp "$APP_DIR/vps-deploy/templates/.env.frontend.template" "$APP_DIR/frontend/.env.production"
    chown $ACTUAL_USER:$ACTUAL_USER "$APP_DIR/frontend/.env.production"
    print_warning "Please edit $APP_DIR/frontend/.env.production with your configuration"
fi

# Setup Nginx
print_info "🌐 Configuring Nginx..."
cp "$APP_DIR/vps-deploy/nginx.conf" "$NGINX_AVAILABLE/$APP_NAME"
ln -sf "$NGINX_AVAILABLE/$APP_NAME" "$NGINX_ENABLED/"
rm -f "$NGINX_ENABLED/default"

# Test Nginx configuration
nginx -t
systemctl restart nginx
systemctl enable nginx

# Setup PM2 ecosystem
print_info "🔄 Setting up PM2..."
cp "$APP_DIR/vps-deploy/ecosystem.config.js" "$APP_DIR/"
chown $ACTUAL_USER:$ACTUAL_USER "$APP_DIR/ecosystem.config.js"

# Start applications with PM2
cd $APP_DIR
sudo -u $ACTUAL_USER pm2 start ecosystem.config.js
sudo -u $ACTUAL_USER pm2 save

# Setup PM2 startup script
sudo -u $ACTUAL_USER pm2 startup systemd -u $ACTUAL_USER --hp $ACTUAL_HOME
# The above command will output a command to run, but we'll handle it differently
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $ACTUAL_USER --hp $ACTUAL_HOME

# Create systemd services as backup
print_info "🔧 Creating systemd services..."
cp "$APP_DIR/vps-deploy/cenopie-backend.service" "$SYSTEMD_DIR/"
cp "$APP_DIR/vps-deploy/cenopie-frontend.service" "$SYSTEMD_DIR/"

# Update service files with correct user
sed -i "s/USER_PLACEHOLDER/$ACTUAL_USER/g" "$SYSTEMD_DIR/cenopie-backend.service"
sed -i "s/USER_PLACEHOLDER/$ACTUAL_USER/g" "$SYSTEMD_DIR/cenopie-frontend.service"

systemctl daemon-reload

# Setup log rotation
print_info "📝 Setting up log rotation..."
cat > /etc/logrotate.d/cenopie << EOF
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $ACTUAL_USER $ACTUAL_USER
    postrotate
        sudo -u $ACTUAL_USER pm2 reloadLogs
    endscript
}
EOF

# Create logs directory
mkdir -p $APP_DIR/logs
chown $ACTUAL_USER:$ACTUAL_USER $APP_DIR/logs

# Setup backup script
print_info "💾 Setting up backup script..."
cp "$APP_DIR/vps-deploy/backup.sh" "/usr/local/bin/cenopie-backup"
chmod +x "/usr/local/bin/cenopie-backup"

# Add backup cron job (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/cenopie-backup") | crontab -

# Final status check
print_info "🔍 Checking deployment status..."
sleep 5

# Check PM2 status
print_info "PM2 Status:"
sudo -u $ACTUAL_USER pm2 status

# Check Nginx status
print_info "Nginx Status:"
systemctl status nginx --no-pager -l

# Check if ports are listening
print_info "Port Status:"
netstat -tlnp | grep -E ':(3000|4000|80|443)'

print_status "🎉 Deployment completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "=============="
echo "1. Edit environment files:"
echo "   - $APP_DIR/backend/.env.production"
echo "   - $APP_DIR/frontend/.env.production"
echo ""
echo "2. Restart applications:"
echo "   sudo -u $ACTUAL_USER pm2 restart all"
echo ""
echo "3. Setup SSL certificate (optional):"
echo "   sudo apt install certbot python3-certbot-nginx"
echo "   sudo certbot --nginx -d yourdomain.com"
echo ""
echo "4. Monitor applications:"
echo "   sudo -u $ACTUAL_USER pm2 status"
echo "   sudo -u $ACTUAL_USER pm2 logs"
echo ""
echo "🌐 Your application should be available at:"
echo "   http://your-server-ip"
echo ""
print_warning "Remember to configure your environment variables before the application will work properly!"

exit 0