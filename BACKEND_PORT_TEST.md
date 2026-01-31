# Backend Port 4000 Test

## Issue Identified
The Socket.IO diagnostic shows:
- ✅ API Health at root domain works: `{ok: true}`
- ❌ Socket.IO at root domain fails: `400 (Bad Request)`

This means your backend is running on port 4000, but the frontend was trying to connect to the main domain without the port.

## Fix Applied
Updated Socket.IO connection to use `https://cenopie.com:4000` instead of `https://cenopie.com`

## Test Commands

Run these in browser console on cenopie.com to verify:

```javascript
// Test backend API on port 4000
fetch('https://cenopie.com:4000/api/health')
  .then(r => r.json())
  .then(d => console.log('✅ Backend API (port 4000):', d))
  .catch(e => console.error('❌ Backend API error:', e));

// Test Socket.IO on port 4000
fetch('https://cenopie.com:4000/socket.io/')
  .then(r => console.log('✅ Socket.IO (port 4000) status:', r.status))
  .catch(e => console.error('❌ Socket.IO error:', e));
```

## Expected Results
After the fix, you should see:
- ✅ Backend API (port 4000): `{status: "healthy", ...}`
- ✅ Socket.IO (port 4000) status: `200`

## If Port 4000 is Blocked

If the above tests fail, your hosting provider might be blocking port 4000. Solutions:

### Option 1: Use Standard Ports (Recommended)
Configure your backend to run on port 80 (HTTP) or 443 (HTTPS):
```bash
# In your server
PORT=443 npm start
# or
PORT=80 npm start
```

### Option 2: Reverse Proxy (Nginx)
Set up Nginx to proxy requests:
```nginx
# /etc/nginx/sites-available/cenopie.com
server {
    listen 80;
    server_name cenopie.com;
    
    location /api/ {
        proxy_pass http://localhost:4000/api/;
    }
    
    location /socket.io/ {
        proxy_pass http://localhost:4000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Option 3: Different Port
Try a different port that's commonly open:
- Port 8080: `https://cenopie.com:8080`
- Port 3001: `https://cenopie.com:3001`

## Deployment Steps

1. **Deploy the updated frontend** with port 4000 configuration
2. **Test the backend accessibility** using the commands above
3. **Check chat real-time messaging** - should work now
4. **If port 4000 is blocked**, implement one of the solutions above

## Verification

After deployment, the chat should work in real-time. You can verify by:
1. Opening chat on two different browsers/devices
2. Sending messages - they should appear instantly
3. Checking console logs for successful Socket.IO connection