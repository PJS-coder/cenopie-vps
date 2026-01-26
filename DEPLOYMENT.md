# 🚀 Cenopie Production Deployment Guide

Complete guide to deploy Cenopie on Ubuntu VPS with production-ready configuration.

## 📋 Quick Start (Automated)

```bash
# 1. Clone repository on your VPS
git clone https://github.com/your-username/cenopie.git
cd cenopie

# 2. Run automated deployment
sudo ./vps-deploy/deploy.sh

# 3. Configure environment variables
sudo nano /opt/cenopie/backend/.env.production
sudo nano /opt/cenopie/frontend/.env.production

# 4. Restart services
sudo -u $USER pm2 restart all

# 5. Setup SSL (optional)
sudo ./vps-deploy/ssl-setup.sh yourdomain.com
```

## 🖥️ Server Requirements

### Minimum Requirements
- **OS**: Ubuntu 20.04+ LTS
- **RAM**: 2GB (4GB recommended)
- **Storage**: 20GB SSD
- **CPU**: 1 vCPU (2+ recommended)
- **Network**: 1Gbps connection

### Recommended VPS Providers
- **DigitalOcean**: $12/month droplet (2GB RAM, 1 vCPU, 50GB SSD)
- **Linode**: $12/month nanode (2GB RAM, 1 vCPU, 50GB SSD)
- **Vultr**: $12/month instance (2GB RAM, 1 vCPU, 55GB SSD)
- **AWS EC2**: t3.small instance
- **Google Cloud**: e2-small instance

## 🔧 Manual Installation Steps

### 1. Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git nginx ufw fail2ban htop

# Setup firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Create non-root user (if not exists)
sudo adduser cenopie
sudo usermod -aG sudo cenopie
```

### 2. Install Node.js 18+

```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v18.x.x or higher
npm --version
```

### 3. Install PM2 Process Manager

```bash
sudo npm install -g pm2
```

### 4. Clone and Setup Application

```bash
# Create application directory
sudo mkdir -p /opt/cenopie
sudo chown $USER:$USER /opt/cenopie

# Clone repository
cd /opt/cenopie
git clone https://github.com/your-username/cenopie.git .

# Install backend dependencies
cd backend
npm install --production

# Install frontend dependencies and build
cd ../frontend
npm install
npm run build:prod
```

### 5. Configure Environment Variables

#### Backend Environment (`/opt/cenopie/backend/.env.production`)
```env
NODE_ENV=production
PORT=4000

# Database
MONGODB_URI=mongodb://localhost:27017/cenopie

# JWT Secrets (CHANGE THESE!)
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-min-32-chars

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Application URLs
CLIENT_ORIGIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Optional: Redis
REDIS_URL=redis://localhost:6379
REDIS_DISABLED=true
```

#### Frontend Environment (`/opt/cenopie/frontend/.env.production`)
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 6. Setup Process Management

```bash
# Copy PM2 ecosystem file
cp vps-deploy/ecosystem.config.js /opt/cenopie/

# Start applications
cd /opt/cenopie
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 7. Configure Nginx

```bash
# Copy Nginx configuration
sudo cp vps-deploy/nginx.conf /etc/nginx/sites-available/cenopie

# Enable site
sudo ln -s /etc/nginx/sites-available/cenopie /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Update domain name in config
sudo sed -i 's/server_name _;/server_name yourdomain.com www.yourdomain.com;/' /etc/nginx/sites-available/cenopie

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 8. Setup SSL Certificate (Optional but Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Setup auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🗄️ Database Setup

### Option 1: MongoDB Atlas (Recommended)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster
3. Get connection string
4. Update `MONGODB_URI` in backend `.env.production`

### Option 2: Local MongoDB
```bash
# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database and user
mongo
> use cenopie
> db.createUser({user: "cenopie", pwd: "secure-password", roles: ["readWrite"]})
> exit

# Update connection string
MONGODB_URI=mongodb://cenopie:secure-password@localhost:27017/cenopie
```

## 🔄 Deployment Workflow

### Initial Deployment
```bash
sudo ./vps-deploy/deploy.sh
```

### Updates
```bash
cd /opt/cenopie
git pull origin main
cd backend && npm install --production
cd ../frontend && npm install && npm run build:prod
pm2 restart all
```

### Rollback
```bash
cd /opt/cenopie
git checkout previous-commit-hash
cd backend && npm install --production
cd ../frontend && npm install && npm run build:prod
pm2 restart all
```

## 📊 Monitoring and Maintenance

### Health Monitoring
```bash
# Setup monitoring script
sudo cp vps-deploy/monitoring.sh /usr/local/bin/cenopie-monitor
sudo chmod +x /usr/local/bin/cenopie-monitor

# Add to crontab (check every 5 minutes)
crontab -e
# Add: */5 * * * * /usr/local/bin/cenopie-monitor
```

### Backup Setup
```bash
# Setup backup script
sudo cp vps-deploy/backup.sh /usr/local/bin/cenopie-backup
sudo chmod +x /usr/local/bin/cenopie-backup

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/cenopie-backup
```

### Log Management
```bash
# View application logs
pm2 logs

# View specific service logs
pm2 logs cenopie-backend
pm2 logs cenopie-frontend

# View Nginx logs
sudo tail -f /var/log/nginx/cenopie_access.log
sudo tail -f /var/log/nginx/cenopie_error.log

# View system logs
sudo journalctl -u nginx -f
```

## 🔧 Common Commands

### PM2 Management
```bash
pm2 status                 # Check status
pm2 restart all           # Restart all apps
pm2 stop all              # Stop all apps
pm2 delete all            # Delete all apps
pm2 logs                  # View logs
pm2 monit                 # Monitor resources
pm2 reload all            # Zero-downtime reload
```

### Nginx Management
```bash
sudo nginx -t             # Test configuration
sudo systemctl restart nginx
sudo systemctl reload nginx
sudo systemctl status nginx
```

### System Monitoring
```bash
htop                      # System resources
df -h                     # Disk usage
free -h                   # Memory usage
netstat -tlnp             # Network connections
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
sudo lsof -ti:3000 | xargs sudo kill -9
sudo lsof -ti:4000 | xargs sudo kill -9
pm2 restart all
```

#### 2. Permission Denied
```bash
sudo chown -R $USER:$USER /opt/cenopie
```

#### 3. MongoDB Connection Failed
```bash
sudo systemctl status mongod
sudo systemctl restart mongod
# Check connection string in .env.production
```

#### 4. Nginx 502 Bad Gateway
```bash
pm2 status                # Check if apps are running
sudo nginx -t             # Test nginx config
sudo systemctl restart nginx
```

#### 5. SSL Certificate Issues
```bash
sudo certbot certificates  # Check certificate status
sudo certbot renew --dry-run  # Test renewal
```

#### 6. High Memory Usage
```bash
pm2 restart all           # Restart applications
# Consider upgrading server or optimizing code
```

### Log Locations
- **Application Logs**: `/opt/cenopie/logs/`
- **Nginx Logs**: `/var/log/nginx/`
- **System Logs**: `journalctl -u service-name`
- **PM2 Logs**: `~/.pm2/logs/`

## 🔐 Security Checklist

- [ ] Firewall configured (UFW enabled)
- [ ] SSH key authentication (disable password auth)
- [ ] Regular security updates scheduled
- [ ] Strong passwords and JWT secrets
- [ ] SSL certificate installed and auto-renewing
- [ ] Database access restricted
- [ ] Regular backups scheduled
- [ ] Fail2ban configured for brute force protection
- [ ] Non-root user for application
- [ ] Environment variables secured

## 📈 Performance Optimization

### 1. Enable Redis Caching
```bash
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Update backend .env.production
REDIS_DISABLED=false
REDIS_URL=redis://localhost:6379
```

### 2. Database Optimization
```bash
# Create indexes for better performance
mongo cenopie
> db.users.createIndex({ email: 1 })
> db.posts.createIndex({ createdAt: -1 })
> db.messages.createIndex({ conversationId: 1, createdAt: -1 })
```

### 3. PM2 Cluster Mode
```javascript
// In ecosystem.config.js
instances: 'max',  // Use all CPU cores
exec_mode: 'cluster'
```

## 📞 Support and Maintenance

### Regular Maintenance Tasks
- **Weekly**: Check logs for errors
- **Monthly**: Update system packages
- **Quarterly**: Review and rotate secrets
- **Annually**: Review and update SSL certificates

### Monitoring Alerts
Setup monitoring alerts for:
- Application downtime
- High resource usage
- SSL certificate expiration
- Database connection issues
- Disk space warnings

### Backup Strategy
- **Daily**: Application data and configuration
- **Weekly**: Full system backup
- **Monthly**: Test backup restoration
- **Offsite**: Store backups in cloud storage

---

## 🎉 Congratulations!

Your Cenopie application is now deployed and running in production! 

**Access your application at**: `https://yourdomain.com`

For support or issues, check the troubleshooting section or review the application logs.