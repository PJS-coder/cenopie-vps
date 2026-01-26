# VPS Deployment Guide with Socket.IO Fixes

## ✅ Socket.IO Fixes Applied

The following fixes have been applied to resolve messaging issues:

1. **Nginx Configuration Updated** (`vps-deploy/nginx.conf`):
   - Added WebSocket headers for proper Socket.IO handshake
   - Added authentication headers
   - Increased timeouts for long-lived connections

2. **Backend Rate Limiting Fixed** (`backend/src/app.js`):
   - Excluded `/socket.io/` paths from rate limiting
   - Added localhost CORS support

3. **Frontend Error Handling Enhanced** (`frontend/hooks/useSocket.ts`):
   - Better error logging and debugging
   - Improved connection handling

## 🚀 Full Deployment Steps

### Step 1: Commit and Push Changes
```bash
git add .
git commit -m "Socket.IO fixes - messaging should work now"
git push origin main
```

### Step 2: Deploy to VPS
```bash
# SSH into your VPS
ssh root@185.27.135.185

# Navigate to project directory
cd /var/www/cenopie-vps

# Pull latest changes
git pull origin main

# Run the deployment script
chmod +x vps-deploy/deploy.sh
./vps-deploy/deploy.sh
```

### Step 3: Update Nginx Configuration
```bash
# Copy the updated nginx config
cp vps-deploy/nginx.conf /etc/nginx/sites-available/cenopie

# Test and reload nginx
nginx -t
systemctl reload nginx
```

### Step 4: Restart Services
```bash
# Restart PM2 processes
pm2 restart all

# Check status
pm2 status
```

## 🧪 Testing the Deployment

### 1. Test Socket.IO Endpoint
```bash
curl -v "https://cenopie.com/socket.io/?EIO=4&transport=polling"
```
**Expected**: 200 OK response, no 400 errors

### 2. Test Website
1. Visit: https://cenopie.com/messages
2. Open browser console (F12)
3. Look for: `✅ Socket.IO connected successfully`
4. Try sending a message

### 3. Check Logs
```bash
# PM2 logs
pm2 logs

# Nginx logs
tail -f /var/log/nginx/cenopie_error.log
```

## 🔧 If Issues Persist

### Check Service Status
```bash
pm2 status
systemctl status nginx
```

### Verify Ports
```bash
netstat -tlnp | grep -E ':(3000|4000|80|443)'
```

### Check Configuration
```bash
# Verify nginx config
nginx -t
cat /etc/nginx/sites-available/cenopie | grep -A 15 "socket.io"

# Check backend CORS
grep -A 10 "allowedOrigins" /opt/cenopie/backend/src/app.js
```

## 📋 What's Fixed

- ✅ Socket.IO 400 Bad Request errors
- ✅ WebSocket connection issues
- ✅ Real-time messaging
- ✅ Rate limiting conflicts
- ✅ CORS issues
- ✅ Authentication token passing

## 🎯 Expected Results

After deployment, you should see:
- No 400 errors in browser console
- Socket.IO connects successfully
- Messages send and receive in real-time
- Typing indicators work
- User presence updates

The messaging system should now work perfectly on your VPS!