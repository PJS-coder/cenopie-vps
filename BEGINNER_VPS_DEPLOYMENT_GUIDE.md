# 🚀 Complete Beginner's Guide to Deploy Cenopie on Ubuntu VPS

**Step-by-step instructions for first-time VPS users**

## 📋 Prerequisites

Before starting, make sure you have:
- Ubuntu VPS (5GB RAM, 5 cores, 80GB storage)
- Domain name (e.g., cenopie.com)
- VPS IP address (e.g., 185.27.135.185)
- SSH access to your VPS
- Your project code ready

---

## 🔐 Step 1: Connect to Your VPS

### Option A: Using Terminal (Mac/Linux)
```bash
# Replace YOUR_VPS_IP with your actual IP address
ssh root@YOUR_VPS_IP

# Example:
ssh root@185.27.135.185
```

### Option B: Using PuTTY (Windows)
1. Download PuTTY from https://putty.org/
2. Enter your VPS IP address
3. Click "Open" and login with your credentials

### First Login Setup
```bash
# Update your password (recommended)
passwd

# Create a new user (replace 'cenopie' with your preferred username)
adduser cenopie

# Add user to sudo group
usermod -aG sudo cenopie

# Switch to new user
su - cenopie
```

---

## 🔄 Step 2: Update System

```bash
# Update package list
sudo apt update

# Upgrade all packages
sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git htop unzip software-properties-common
```

---

## 📦 Step 3: Install Node.js

```bash
# Install Node.js 18 (LTS version)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version

# Should show Node.js v18.x.x and npm 9.x.x
```

---

## 🗄️ Step 4: Install MongoDB

```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package list
sudo apt update

# Install MongoDB
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod
```

---

## ⚡ Step 5: Install Redis

```bash
# Install Redis
sudo apt install -y redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test Redis
redis-cli ping
# Should return "PONG"
```

---

## 🌐 Step 6: Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check if Nginx is running
sudo systemctl status nginx

# Test Nginx (should show Nginx welcome page)
curl http://localhost
```

---

## 🔧 Step 7: Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify PM2 installation
pm2 --version
```

---

## 📁 Step 8: Upload Your Project

### Option A: Using Git (Recommended)
```bash
# Navigate to web directory
cd /var/www

# Create project directory
sudo mkdir cenopie
sudo chown -R $USER:$USER cenopie
cd cenopie

# Clone your repository (replace with your actual repo URL)
git clone https://github.com/YOUR_USERNAME/cenopie-production.git .

# If you don't have a Git repository, use Option B
```

### Option B: Upload Files Manually
```bash
# Create project directory
cd /var/www
sudo mkdir cenopie
sudo chown -R $USER:$USER cenopie

# Use SCP to upload files from your local machine
# Run this command on your LOCAL machine (not VPS):
# scp -r /path/to/your/project/* cenopie@YOUR_VPS_IP:/var/www/cenopie/
```

---

## ⚙️ Step 9: Configure Environment Variables

```bash
# Navigate to project directory
cd /var/www/cenopie

# Make setup script executable
chmod +x setup-env.sh

# Run environment setup
./setup-env.sh
```

**Follow the prompts and enter:**
- Your domain name (e.g., cenopie.com)
- MongoDB connection (use: mongodb://localhost:27017/cenopie)
- Cloudinary credentials
- Email settings
- Other configuration options

---

## 🏗️ Step 10: Install Project Dependencies

```bash
# Install backend dependencies
cd /var/www/cenopie/backend
npm install --production

# Install frontend dependencies
cd /var/www/cenopie/frontend
npm install

# Build frontend for production
npm run build
```

---

## 🚀 Step 11: Deploy with Ultra-Performance

```bash
# Navigate back to project root
cd /var/www/cenopie

# Make deployment script executable
chmod +x ultra-deploy.sh

# Run ultra-performance deployment
sudo ./ultra-deploy.sh
```

**This script will:**
- Optimize system settings
- Configure databases
- Start PM2 processes
- Set up Nginx
- Apply performance optimizations

---

## 🗄️ Step 12: Optimize Database

```bash
# Run database optimization
cd /var/www/cenopie
node backend/scripts/ultra-db-optimize.js
```

---

## 🔒 Step 13: Configure Domain and SSL

### Configure Domain DNS
1. Go to your domain registrar (GoDaddy, Namecheap, etc.)
2. Add these DNS records:
   ```
   Type: A
   Name: @
   Value: YOUR_VPS_IP (e.g., 185.27.135.185)
   
   Type: A
   Name: www
   Value: YOUR_VPS_IP
   
   Type: A
   Name: api
   Value: YOUR_VPS_IP
   ```

### Install SSL Certificate
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace cenopie.com with your domain)
sudo certbot --nginx -d cenopie.com -d www.cenopie.com

# Follow the prompts and choose to redirect HTTP to HTTPS
```

---

## 🔥 Step 14: Configure Firewall

```bash
# Enable firewall
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Check firewall status
sudo ufw status
```

---

## ✅ Step 15: Verify Deployment

### Check Services
```bash
# Check all services are running
sudo systemctl status mongod
sudo systemctl status redis-server
sudo systemctl status nginx

# Check PM2 processes
pm2 status

# Should show multiple Node.js processes running
```

### Test Your Website
```bash
# Test local connections
curl http://localhost:3000  # Frontend
curl http://localhost:4000/api/health  # Backend API

# Test your domain (replace with your domain)
curl https://cenopie.com
curl https://cenopie.com/api/health
```

### Open in Browser
Visit your website:
- https://cenopie.com (main website)
- https://cenopie.com/api/docs (API documentation)

---

## 📊 Step 16: Performance Testing

```bash
# Run performance tests
cd /var/www/cenopie
chmod +x scripts/performance-test.sh
./scripts/performance-test.sh
```

---

## 🔍 Step 17: Monitoring and Management

### Real-time Monitoring
```bash
# View PM2 processes with monitoring
pm2 monit

# View system resources
htop

# Check logs
pm2 logs

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Useful Commands
```bash
# Restart all PM2 processes
pm2 restart all

# Reload Nginx configuration
sudo nginx -t && sudo systemctl reload nginx

# Check MongoDB status
mongo cenopie --eval "db.stats()"

# Check Redis status
redis-cli info stats
```

---

## 🛠️ Troubleshooting Common Issues

### Issue 1: PM2 processes not starting
```bash
# Check PM2 logs
pm2 logs

# Restart PM2
pm2 delete all
pm2 start ecosystem.config.js
```

### Issue 2: Website not accessible
```bash
# Check Nginx configuration
sudo nginx -t

# Check if ports are open
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

### Issue 3: Database connection issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Restart MongoDB
sudo systemctl restart mongod
```

### Issue 4: SSL certificate issues
```bash
# Renew SSL certificate
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

---

## 🔄 Step 18: Set Up Automatic Backups

```bash
# Create backup script
sudo tee /usr/local/bin/backup-cenopie.sh > /dev/null <<'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/cenopie"
mkdir -p $BACKUP_DIR

# Backup MongoDB
mongodump --out $BACKUP_DIR/mongodb_$DATE

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /var/www/cenopie

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

# Make script executable
sudo chmod +x /usr/local/bin/backup-cenopie.sh

# Add to crontab (daily backup at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-cenopie.sh") | crontab -
```

---

## 🎉 Congratulations!

Your Cenopie social networking platform is now deployed and running on your Ubuntu VPS with:

✅ **Ultra-high performance** (150k+ users capacity)
✅ **SSL encryption** (HTTPS)
✅ **Automatic backups**
✅ **Real-time monitoring**
✅ **Production-ready security**

### Your website is now live at:
- **Main site**: https://cenopie.com
- **API docs**: https://cenopie.com/api/docs
- **Admin panel**: https://cenopie.com/secure-admin

### Next Steps:
1. Create your first admin user
2. Test all features
3. Monitor performance with `pm2 monit`
4. Set up regular maintenance schedule

---

## 📞 Need Help?

If you encounter any issues:

1. **Check logs**: `pm2 logs`
2. **Monitor system**: `htop`
3. **Check services**: `sudo systemctl status nginx mongod redis-server`
4. **View error logs**: `sudo tail -f /var/log/nginx/error.log`

**Your social networking platform is now ready to handle 150,000+ users with bulletproof performance!** 🚀