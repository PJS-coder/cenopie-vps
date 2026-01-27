#!/bin/bash

# Complete Server Setup Script for Cenopie Production
# This script sets up everything needed for production deployment

set -e

echo "🚀 Setting up production server for Cenopie..."

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

# Update system
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install essential packages
print_status "Installing essential packages..."
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Install Node.js 20 LTS
print_status "Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

print_success "Node.js installed: $(node -v)"
print_success "NPM installed: $(npm -v)"

# Install PM2 globally
print_status "Installing PM2..."
npm install -g pm2

# Install Nginx
print_status "Installing Nginx..."
apt install -y nginx

# Install MongoDB
print_status "Installing MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update
apt install -y mongodb-org

# Start and enable MongoDB
systemctl start mongod
systemctl enable mongod

print_success "MongoDB installed and started"

# Install Redis
print_status "Installing Redis..."
apt install -y redis-server

# Configure Redis
print_status "Configuring Redis..."
sed -i 's/^supervised no/supervised systemd/' /etc/redis/redis.conf
sed -i 's/^# maxmemory <bytes>/maxmemory 256mb/' /etc/redis/redis.conf
sed -i 's/^# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf

# Start and enable Redis
systemctl restart redis-server
systemctl enable redis-server

print_success "Redis installed and configured"

# Install UFW (Uncomplicated Firewall)
print_status "Setting up firewall..."
apt install -y ufw

# Configure firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

print_success "Firewall configured"

# Create cenopie user
print_status "Creating cenopie user..."
if ! id "cenopie" &>/dev/null; then
    useradd -m -s /bin/bash cenopie
    usermod -aG sudo cenopie
    print_success "User 'cenopie' created"
else
    print_warning "User 'cenopie' already exists"
fi

# Set up directory structure
print_status "Setting up directory structure..."
mkdir -p /var/www/cenopie
mkdir -p /var/log/cenopie
mkdir -p /var/backups/cenopie

# Set permissions
chown -R cenopie:cenopie /var/www/cenopie
chown -R cenopie:cenopie /var/log/cenopie
chown -R cenopie:cenopie /var/backups/cenopie

# Install fail2ban for security
print_status "Installing fail2ban for security..."
apt install -y fail2ban

# Configure fail2ban
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
logpath = /var/log/nginx/error.log
maxretry = 10
findtime = 600
bantime = 7200
EOF

systemctl enable fail2ban
systemctl start fail2ban

print_success "fail2ban configured"

# Install and configure logrotate
print_status "Setting up log rotation..."
cat > /etc/logrotate.d/cenopie << 'EOF'
/var/log/cenopie/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 cenopie cenopie
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

print_success "Log rotation configured"

# Create backup script
print_status "Creating backup script..."
cat > /usr/local/bin/backup-cenopie.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/var/backups/cenopie"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup MongoDB
mongodump --out "$BACKUP_DIR/mongodb_$DATE"

# Backup application files
tar -czf "$BACKUP_DIR/app_$DATE.tar.gz" -C /var/www/cenopie .

# Keep only last 7 days of backups
find "$BACKUP_DIR" -type f -mtime +7 -delete
find "$BACKUP_DIR" -type d -empty -delete

echo "Backup completed: $DATE"
EOF

chmod +x /usr/local/bin/backup-cenopie.sh

# Set up daily backup cron job
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-cenopie.sh") | crontab -

print_success "Backup script created and scheduled"

# Install monitoring tools
print_status "Installing monitoring tools..."
apt install -y htop iotop nethogs

# Create system info script
cat > /usr/local/bin/cenopie-status.sh << 'EOF'
#!/bin/bash

echo "=== Cenopie System Status ==="
echo "Date: $(date)"
echo ""

echo "=== System Resources ==="
echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo "Memory Usage: $(free | grep Mem | awk '{printf("%.2f%%", $3/$2 * 100.0)}')"
echo "Disk Usage: $(df -h / | awk 'NR==2{printf "%s", $5}')"
echo ""

echo "=== Services Status ==="
systemctl is-active --quiet nginx && echo "Nginx: Running" || echo "Nginx: Stopped"
systemctl is-active --quiet mongod && echo "MongoDB: Running" || echo "MongoDB: Stopped"
systemctl is-active --quiet redis-server && echo "Redis: Running" || echo "Redis: Stopped"
echo ""

echo "=== PM2 Applications ==="
pm2 status
echo ""

echo "=== Recent Logs ==="
echo "Last 5 lines from application logs:"
tail -n 5 /var/log/cenopie/*.log 2>/dev/null || echo "No logs found"
EOF

chmod +x /usr/local/bin/cenopie-status.sh

print_success "System monitoring tools installed"

# Display final information
print_success "🎉 Server setup completed successfully!"
echo ""
print_status "System Information:"
echo "  OS: $(lsb_release -d | cut -f2)"
echo "  Node.js: $(node -v)"
echo "  NPM: $(npm -v)"
echo "  PM2: $(pm2 -v)"
echo "  MongoDB: $(mongod --version | head -n1)"
echo "  Redis: $(redis-server --version)"
echo "  Nginx: $(nginx -v 2>&1)"
echo ""

print_status "Next Steps:"
print_warning "1. Upload your application code to /var/www/cenopie"
print_warning "2. Run the deployment script: ./deploy.sh"
print_warning "3. Set up SSL certificates: sudo ./setup-ssl.sh"
print_warning "4. Configure your domain DNS to point to this server"
print_warning "5. Update environment variables with production values"
echo ""

print_status "Useful Commands:"
echo "  cenopie-status.sh   - Check system status"
echo "  pm2 status          - Check application status"
echo "  pm2 logs            - View application logs"
echo "  systemctl status nginx - Check Nginx status"
echo ""

print_success "Server is ready for Cenopie deployment! 🚀"