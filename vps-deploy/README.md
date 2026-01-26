# Cenopie VPS Deployment Guide

Complete guide to deploy Cenopie on Ubuntu VPS with production-ready configuration.

## 🚀 Quick Fresh Deployment

```bash
# 1. Clean up old deployment (if exists)
chmod +x vps-deploy/cleanup-old-deployment.sh
sudo ./vps-deploy/cleanup-old-deployment.sh

# 2. Clone and setup
git clone <your-repo-url> cenopie
cd cenopie

# 3. Run automated deployment
chmod +x vps-deploy/deploy.sh
sudo ./vps-deploy/deploy.sh

# 4. Configure environment
sudo nano /opt/cenopie/backend/.env.production
sudo nano /opt/cenopie/frontend/.env.production

# 5. Start services
sudo -u $USER pm2 restart all
```

## 📋 Prerequisites

- Ubuntu 20.04+ VPS
- Root or sudo access
- Domain name (optional but recommended)
- At least 2GB RAM, 20GB storage

## 🔧 Manual Setup Steps

### 1. System Updates
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install curl wget git nginx certbot python3-certbot-nginx -y
```

### 2. Install Node.js 18+
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y
node --version  # Should be 18+
```

### 3. Install PM2
```bash
sudo npm install -g pm2
```

### 4. Setup MongoDB (Optional - if not using Atlas)
```bash
# Import MongoDB GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt update
sudo apt install mongodb-org -y

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 5. Setup Redis (Optional)
```bash
sudo apt install redis-server -y
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

## 🏗️ Application Deployment

### 1. Clone Repository
```bash
sudo mkdir -p /opt/cenopie
sudo chown $USER:$USER /opt/cenopie
cd /opt/cenopie
git clone <your-repo-url> .
```

### 2. Backend Setup
```bash
cd /opt/cenopie/backend
npm install --production
cp .env.production.example .env.production
# Edit environment variables
nano .env.production
```

### 3. Frontend Setup
```bash
cd /opt/cenopie/frontend
npm install
npm run build
cp .env.production.example .env.production
# Edit environment variables
nano .env.production
```

## 🔧 Environment Configuration

### Backend (.env.production)
```env
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb://localhost:27017/cenopie
JWT_SECRET=your-super-secure-jwt-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLIENT_ORIGIN=https://yourdomain.com
```

### Frontend (.env.production)
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## 🔄 Process Management with PM2

### 1. Create PM2 Ecosystem File
```bash
cp /opt/cenopie/vps-deploy/ecosystem.config.js /opt/cenopie/
```

### 2. Start Applications
```bash
cd /opt/cenopie
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🌐 Nginx Configuration

### 1. Create Nginx Config
```bash
sudo cp /opt/cenopie/vps-deploy/nginx.conf /etc/nginx/sites-available/cenopie
sudo ln -s /etc/nginx/sites-available/cenopie /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
```

### 2. Test and Restart Nginx
```bash
sudo nginx -t
sudo systemctl restart nginx
```

## 🔒 SSL Certificate (Let's Encrypt)

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 🔧 Systemd Services (Alternative to PM2)

### 1. Create Service Files
```bash
sudo cp /opt/cenopie/vps-deploy/cenopie-backend.service /etc/systemd/system/
sudo cp /opt/cenopie/vps-deploy/cenopie-frontend.service /etc/systemd/system/
```

### 2. Enable and Start Services
```bash
sudo systemctl daemon-reload
sudo systemctl enable cenopie-backend cenopie-frontend
sudo systemctl start cenopie-backend cenopie-frontend
```

## 📊 Monitoring and Logs

### PM2 Monitoring
```bash
pm2 status
pm2 logs
pm2 monit
```

### Systemd Logs
```bash
sudo journalctl -u cenopie-backend -f
sudo journalctl -u cenopie-frontend -f
```

### Nginx Logs
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🔄 Updates and Maintenance

### Update Application
```bash
cd /opt/cenopie
git pull origin main
cd backend && npm install --production
cd ../frontend && npm install && npm run build
pm2 restart all
```

### Backup Database
```bash
mongodump --db cenopie --out /opt/backups/$(date +%Y%m%d)
```

## 🚨 Troubleshooting

### Common Issues

1. **Port 3000/4000 already in use**
   ```bash
   sudo lsof -ti:3000 | xargs sudo kill -9
   sudo lsof -ti:4000 | xargs sudo kill -9
   ```

2. **Permission denied**
   ```bash
   sudo chown -R $USER:$USER /opt/cenopie
   ```

3. **MongoDB connection failed**
   ```bash
   sudo systemctl status mongod
   sudo systemctl restart mongod
   ```

4. **Nginx 502 Bad Gateway**
   ```bash
   sudo nginx -t
   pm2 status
   sudo systemctl restart nginx
   ```

## 📈 Performance Optimization

### 1. Enable Gzip in Nginx
Already included in provided nginx.conf

### 2. Setup Redis Caching
```bash
sudo systemctl start redis-server
# Update backend .env.production
REDIS_URL=redis://localhost:6379
REDIS_DISABLED=false
```

### 3. Database Indexing
```bash
mongo cenopie
db.users.createIndex({ email: 1 })
db.posts.createIndex({ createdAt: -1 })
```

## 🔐 Security Checklist

- [ ] Firewall configured (UFW)
- [ ] SSH key authentication
- [ ] Regular security updates
- [ ] Strong passwords/secrets
- [ ] SSL certificate installed
- [ ] Database access restricted
- [ ] Regular backups scheduled

## 📞 Support

For issues with deployment, check:
1. Application logs: `pm2 logs`
2. System logs: `sudo journalctl -xe`
3. Nginx logs: `sudo tail -f /var/log/nginx/error.log`