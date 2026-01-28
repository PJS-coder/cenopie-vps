# Cenopie Deployment Guide

## Current Issues Identified

1. **Backend**: Environment file not loading correctly (trying to connect to localhost instead of MongoDB Atlas)
2. **Frontend**: Port 3000 conflict causing constant restarts
3. **Redis**: Attempting to connect to localhost despite being disabled

## Quick Fix Commands

Run these commands on your server (`root@cenopie:/var/www/cenopie-vps`):

### 1. Stop All Services and Clear Ports
```bash
# Stop PM2 processes
pm2 stop all
pm2 delete all

# Kill any processes using ports 3000 and 4000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:4000 | xargs kill -9 2>/dev/null || true

# Wait for processes to terminate
sleep 3
```

### 2. Create Log Directories
```bash
mkdir -p /var/log/pm2
chown -R root:root /var/log/pm2
```

### 3. Verify Environment Files
```bash
# Check backend environment
cat backend/.env.production | grep MONGODB_URI
cat backend/.env.production | grep REDIS_DISABLED

# Should show:
# MONGODB_URI=mongodb+srv://pjs89079_db_user:adO1gs2LZryrCKbM@cenopie.ae8q9xo.mongodb.net/?retryWrites=true&w=majority&appName=Cenopie
# REDIS_DISABLED=true
```

### 4. Test Backend Manually (Optional)
```bash
cd /var/www/cenopie-vps/backend
NODE_ENV=production node src/server.js
# Should connect to MongoDB Atlas, not localhost
# Press Ctrl+C to stop
```

### 5. Start Services with New Configuration
```bash
cd /var/www/cenopie-vps
pm2 start ecosystem.config.js
```

### 6. Monitor Status
```bash
pm2 status
pm2 logs --lines 50
```

## Expected Results

After running these commands, you should see:
- Backend connecting to "Atlas Database" (not "Local Database")
- No Redis connection errors (Redis disabled)
- Frontend starting on port 3000 without conflicts
- Both services showing stable uptime without restarts

## Troubleshooting

### If Backend Still Shows "Local Database":
```bash
# Check if environment is loading
cd /var/www/cenopie-vps/backend
NODE_ENV=production node -e "
require('dotenv').config({ path: '.env.production' });
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('REDIS_DISABLED:', process.env.REDIS_DISABLED);
"
```

### If Frontend Port Conflict Persists:
```bash
# Find what's using port 3000
netstat -tlnp | grep :3000
# Kill the process if needed
kill -9 <PID>
```

### Check Logs for Specific Issues:
```bash
# Backend logs
pm2 logs cenopie-backend --lines 100

# Frontend logs  
pm2 logs cenopie-frontend --lines 100

# All logs
pm2 logs --lines 100
```

## Success Indicators

✅ Backend log shows: "✅ MongoDB Connected: cenopie.ae8q9xo.mongodb.net"
✅ No "ENOTFOUND localhost" errors
✅ No "EADDRINUSE" errors
✅ PM2 status shows both services "online" with low restart counts
✅ Services maintain stable uptime (not constantly restarting)

## Next Steps After Fix

1. Test your application: `curl https://cenopie.com/api/health`
2. Monitor for 5-10 minutes to ensure stability
3. Set up PM2 to start on boot: `pm2 startup` and `pm2 save`