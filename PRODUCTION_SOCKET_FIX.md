# Production Socket.IO Debugging Guide

## Manual Browser Console Test

Since the `/socket-test` page is showing blank, you can test Socket.IO directly in the browser console on cenopie.com/chats:

### Step 1: Open Browser Console
1. Go to `https://cenopie.com/chats`
2. Press F12 or right-click → Inspect
3. Go to Console tab

### Step 2: Look for Connection Logs
You should see logs like:
```
🔑 Connecting to socket with token: eyJhbGciOiJIUzI1NiIs...
🔌 Connecting to Socket.IO server: https://cenopie.com
🌐 Current location: https://cenopie.com/chats
🔑 Token available: true
🌍 Environment: production
📍 Hostname: cenopie.com
```

### Step 3: Check Connection Status
Look for either:
- ✅ `Socket connected successfully to: https://cenopie.com`
- ❌ `Socket connection error: [error message]`

### Step 4: Manual Socket Test
If you see connection errors, run this in console:
```javascript
// Test basic connectivity
fetch('https://cenopie.com/api/health')
  .then(r => r.json())
  .then(d => console.log('API Health:', d))
  .catch(e => console.error('API Error:', e));

// Test Socket.IO endpoint
fetch('https://cenopie.com/socket.io/')
  .then(r => console.log('Socket.IO endpoint status:', r.status))
  .catch(e => console.error('Socket.IO endpoint error:', e));
```

### Step 5: Debug Panel
On the chat page, you'll now see a red "Debug" button in the top-right. Click it to see:
- Connection status
- Socket ID
- Transport type
- Current timestamp

## Common Error Messages & Solutions

### "Failed to fetch" or "Network error"
**Cause**: Backend not accessible
**Check**: 
```bash
curl -I https://cenopie.com/api/health
curl -I https://cenopie.com/socket.io/
```

### "CORS policy" error
**Cause**: CORS configuration issue
**Solution**: Backend CORS already includes cenopie.com, check server logs

### "WebSocket connection failed"
**Cause**: WebSocket blocked, falling back to polling
**Expected**: This is normal, polling should still work

### "Authentication error"
**Cause**: Token issue
**Check**: Look for "Token available: true" in console logs

## Quick Diagnosis Commands

Run these in browser console on cenopie.com/chats:

```javascript
// Check if Socket.IO library is loaded
console.log('Socket.IO available:', typeof io !== 'undefined');

// Check auth token
console.log('Auth token:', localStorage.getItem('authToken')?.substring(0, 20) + '...');

// Check API connectivity
fetch('/api/health').then(r => r.json()).then(console.log);

// Manual Socket.IO test
const testSocket = io('https://cenopie.com', {
  auth: { token: localStorage.getItem('authToken') },
  transports: ['polling']
});
testSocket.on('connect', () => console.log('✅ Manual test: Connected!'));
testSocket.on('connect_error', (e) => console.log('❌ Manual test error:', e.message));
```

**Good Signs:**
```
✅ Socket connected successfully to: https://cenopie.com
🔗 Connection ID: abc123
🚀 Transport: polling (or websocket)
```

**Bad Signs:**
```
❌ Socket connection error: [error message]
❌ Socket disconnected: [reason]
```

### 3. Check Network Tab
In DevTools Network tab, look for:
- `/socket.io/` requests
- WebSocket connections (ws://)
- Polling requests (XHR)

## Common Production Issues & Solutions

### Issue 1: "Connection refused" or "Network error"
**Cause**: Backend not accessible or wrong URL
**Solutions**:
1. Verify backend is running: `pm2 status`
2. Check if port 4000 is accessible: `curl https://cenopie.com:4000`
3. Update Socket URL to use standard ports (80/443)

### Issue 2: "CORS policy" errors
**Cause**: CORS not configured for your domain
**Solution**: Backend CORS already includes cenopie.com, but verify in server logs

### Issue 3: WebSocket upgrade fails, falls back to polling
**Cause**: Reverse proxy (Nginx) not configured for WebSocket
**Solution**: Add to Nginx config:
```nginx
location /socket.io/ {
    proxy_pass http://localhost:4000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### Issue 4: SSL/HTTPS issues
**Cause**: Mixed content (HTTPS frontend, HTTP backend)
**Solution**: Ensure backend uses HTTPS or proxy through HTTPS

## Immediate Fixes to Try

### Fix 1: Force Polling Transport
If WebSocket is blocked, force polling-only:
```javascript
// In production environment
transports: ['polling']
```

### Fix 2: Use Different Port
If port 4000 is blocked:
```bash
# Change backend to run on port 80 or 443
PORT=80 npm start
```

### Fix 3: Proxy Through Main Domain
Instead of connecting to port 4000, proxy through main domain:
```nginx
# Nginx config
location /api/ {
    proxy_pass http://localhost:4000/api/;
}
location /socket.io/ {
    proxy_pass http://localhost:4000/socket.io/;
}
```

## Server Configuration Check

### PM2 Status
```bash
pm2 status
pm2 logs cenopie-backend --lines 50
```

### Port Accessibility
```bash
# Test if backend port is accessible
curl -I https://cenopie.com:4000/api/health
netstat -tlnp | grep :4000
```

### Firewall Check
```bash
# Check if port 4000 is open
sudo ufw status
sudo iptables -L
```

## Environment Variables Check

Ensure these are set in production:
```bash
# Frontend (.env.production)
NEXT_PUBLIC_SOCKET_URL=https://cenopie.com

# Backend (.env.production)
CLIENT_ORIGIN=https://cenopie.com
PORT=4000
NODE_ENV=production
```

## Real-time Debugging

### Backend Logs to Monitor
```bash
pm2 logs --lines 100 | grep -E "(Socket|socket|WebSocket|websocket)"
```

Look for:
- `✅ Socket authenticated: [username]`
- `🔌 User connected: [username]`
- `📤 Emitting message to chat_[chatId]`

### Frontend Console Commands
Run in browser console on cenopie.com:
```javascript
// Test Socket.IO connection manually
const io = require('socket.io-client');
const socket = io('https://cenopie.com', {
  auth: { token: localStorage.getItem('authToken') }
});
socket.on('connect', () => console.log('Manual test: Connected!'));
```

## Fallback Solutions

### Temporary Fix: Disable Real-time
If Socket.IO continues to fail, temporarily disable real-time features:
1. Messages still save to database
2. Users see messages on page refresh
3. Fix Socket.IO issues separately

### Alternative: Server-Sent Events
Consider using Server-Sent Events (SSE) as fallback:
- More reliable than WebSocket
- Works through most proxies
- Simpler configuration

## Next Steps

1. **Deploy the updated code** with enhanced debugging
2. **Visit `/socket-test` page** on cenopie.com to see connection status
3. **Check browser console** for detailed connection logs
4. **Monitor backend logs** for Socket.IO activity
5. **Test message sending** and check for real-time delivery

The enhanced debugging will show exactly what's happening with the Socket.IO connection in production.