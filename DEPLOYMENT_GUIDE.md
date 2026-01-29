# Cenopie Deployment Guide

## Current Issues Identified

1. **Backend**: Environment file not loading correctly (trying to connect to localhost instead of MongoDB Atlas)
2. **Frontend**: Port 3000 conflict causing constant restarts
3. **Redis**: Attempting to connect to localhost despite being disabled
4. **API Connection**: Frontend "Failed to fetch" errors due to missing environment variables

## Quick Fix Commands

Run these commands on your server (`root@cenopie:/var/www/cenopie-vps`):

### Option 1: Automated Fix (Recommended)
```bash
# Run the comprehensive fix script
./fix-api-connection.sh
```

### Option 2: Manual Fix

#### 1. Stop All Services and Clear Ports
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

#### 2. Create Log Directories
```bash
mkdir -p /var/log/pm2
chown -R root:root /var/log/pm2
```

#### 3. Set Up Environment Files
```bash
# Copy production environment files
cp backend/.env.production backend/.env
cp frontend/.env.production frontend/.env.local

# Verify frontend environment
cat frontend/.env.local | grep NEXT_PUBLIC_API_URL
# Should show: NEXT_PUBLIC_API_URL=https://cenopie.com
```

#### 4. Rebuild Frontend
```bash
cd /var/www/cenopie-vps/frontend
rm -rf .next node_modules/.cache
npm ci
npm run build:prod
cd ..
```

#### 5. Start Services with New Configuration
```bash
pm2 start ecosystem.config.js
pm2 save
```

#### 6. Monitor Status
```bash
pm2 status
pm2 logs --lines 50
```

## Expected Results

After running these commands, you should see:
- Backend connecting to "Atlas Database" (not "Local Database")
- No Redis connection errors (Redis disabled)
- Frontend starting on port 3001 without conflicts
- Both services showing stable uptime without restarts
- **No "Failed to fetch" errors in browser console**
- **API calls to `/api/upload/interview-video` and `/api/interviews/*/complete` working**

## API Connection Verification

Test the API endpoints that were failing:

```bash
# Test backend health
curl -f http://localhost:4000/api/health

# Test upload endpoint
curl -f http://localhost:4000/api/upload/test

# Check frontend environment variables
cd /var/www/cenopie-vps/frontend
node -e "console.log('API URL:', process.env.NEXT_PUBLIC_API_URL)"

# Debug API URL resolution
node /var/www/cenopie-vps/debug-api-url.js
```

Should show:
- Backend health: `{"status":"ok"}`
- Upload test: `{"message":"Upload route is working!"}`
- Frontend API URL: `https://cenopie.com`
- Debug script showing correct URL resolution

## Browser Console Debugging

After deployment, check the browser console for:
```
🔗 API URL configured: https://cenopie.com
Using API URL for video upload: https://cenopie.com
Using API URL for interview completion: https://cenopie.com
```

If you see `undefined` or `localhost` URLs in production, the environment variables aren't being loaded correctly.

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
✅ **No "Failed to fetch" errors in browser console**  
✅ **Frontend environment shows `NEXT_PUBLIC_API_URL=https://cenopie.com`**  
✅ **API endpoints respond correctly: `/api/health`, `/api/upload/test`**  
✅ **Interview video upload and completion work without errors**

## Next Steps After Fix

1. Test your application: `curl https://cenopie.com/api/health`
2. Monitor for 5-10 minutes to ensure stability
3. Set up PM2 to start on boot: `pm2 startup` and `pm2 save`