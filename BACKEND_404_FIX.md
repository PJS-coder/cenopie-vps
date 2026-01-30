# 404 Error Fix - Upload Endpoint Not Found

## Problem
`POST https://cenopie.com/api/upload/interview-video 404 (Not Found)`

This means the backend upload endpoint is not accessible or not deployed properly.

## Quick Diagnosis

### 1. Check if Backend is Running
```bash
# Test if backend is accessible
curl https://cenopie.com/api/health
# or
curl https://cenopie.com:4000/api/health

# Should return 200 OK with health status
```

### 2. Check Upload Endpoint Specifically
```bash
# Test upload endpoint (will return 401 without auth, but not 404)
curl -X POST https://cenopie.com/api/upload/interview-video
# Should return 401 Unauthorized, NOT 404 Not Found
```

## Possible Causes & Solutions

### 1. Backend Not Running
**Symptoms**: All API endpoints return 404
**Solution**: Start the backend server
```bash
cd backend
npm start
# or
pm2 start ecosystem.config.js
```

### 2. Wrong Port/URL Configuration
**Symptoms**: Frontend connects to wrong backend URL
**Solution**: Check environment variables
```bash
# In frontend/.env.production
NEXT_PUBLIC_API_URL=https://cenopie.com

# In backend/.env.production  
PORT=4000
```

### 3. Reverse Proxy Not Configured
**Symptoms**: Frontend works but API endpoints return 404
**Solution**: Configure nginx/Apache to proxy API requests

#### Nginx Configuration:
```nginx
# Add to your server block
location /api/ {
    proxy_pass http://localhost:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

#### Apache Configuration:
```apache
# Add to your virtual host
ProxyPass /api/ http://localhost:4000/api/
ProxyPassReverse /api/ http://localhost:4000/api/
```

### 4. Upload Routes Not Registered
**Symptoms**: Other API endpoints work, but upload endpoints return 404
**Solution**: Verify upload routes are registered in backend

Check `backend/src/app.js`:
```javascript
import uploadRoutes from './routes/uploadRoutes.js';
// ...
app.use('/api/upload', uploadRoutes);
```

### 5. PM2/Process Manager Issues
**Symptoms**: Backend was running but stopped
**Solution**: Check and restart process
```bash
# Check PM2 status
pm2 status

# Restart if needed
pm2 restart all

# Check logs
pm2 logs
```

## Quick Fixes

### Fix 1: Temporary Frontend Fallback
Add to `frontend/.env.local` (for testing):
```bash
# Try different backend URLs
NEXT_PUBLIC_API_URL=https://cenopie.com:4000
# or
NEXT_PUBLIC_API_URL=http://cenopie.com:4000
```

### Fix 2: Test with Direct Backend URL
If backend is on different port:
```bash
# Test direct backend access
curl https://cenopie.com:4000/api/upload/interview-video
```

### Fix 3: Check Firewall/Security Groups
Ensure port 4000 is open if backend runs on separate port:
```bash
# Check if port is accessible
telnet cenopie.com 4000
```

## Debugging Steps

### 1. Check Backend Logs
```bash
# PM2 logs
pm2 logs

# Direct logs if running with npm
cd backend && npm start

# System logs
sudo journalctl -u your-backend-service -f
```

### 2. Test API Endpoints
```bash
# Test health endpoint
curl https://cenopie.com/api/health

# Test auth endpoint
curl -X POST https://cenopie.com/api/auth/login

# Test upload endpoint
curl -X POST https://cenopie.com/api/upload/interview-video
```

### 3. Check Network Configuration
```bash
# Check if backend process is running
ps aux | grep node

# Check which ports are listening
netstat -tlnp | grep :4000

# Check nginx/apache configuration
sudo nginx -t
sudo apache2ctl configtest
```

## Expected Responses

### ✅ Correct Responses:
- `/api/health` → 200 OK
- `/api/upload/interview-video` (no auth) → 401 Unauthorized
- `/api/upload/interview-video` (with auth) → 400 Bad Request (no file)

### ❌ Problem Responses:
- Any endpoint → 404 Not Found (backend not accessible)
- `/api/upload/interview-video` → 404 Not Found (routes not registered)

## Emergency Workaround

If you need immediate functionality, you can temporarily modify the frontend to use a different upload service or disable video upload:

```javascript
// In StrictInterviewMode.tsx - temporary disable
const uploadVideo = async (videoBlob: Blob): Promise<string> => {
  console.warn('Video upload temporarily disabled due to backend issues');
  return 'mock-video-url'; // Return mock URL
};
```

## Verification

After fixing, verify with:
```bash
# 1. Backend health check
curl https://cenopie.com/api/health

# 2. Upload endpoint exists (should return 401, not 404)
curl -X POST https://cenopie.com/api/upload/interview-video

# 3. Test from frontend
# Open browser console and check for successful API calls
```