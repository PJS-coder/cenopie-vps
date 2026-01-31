# Production Socket.IO Fix for Real-time Messaging

## Issues Identified

1. **Socket.IO URL Configuration**: Frontend trying to connect to wrong URL in production
2. **Connection Timeout**: Default timeout too short for production environment
3. **Reconnection Logic**: Missing proper reconnection handling
4. **CORS Configuration**: May need adjustment for production domain
5. **Transport Priority**: WebSocket may be blocked, need polling fallback

## Fixes Applied

### 1. Frontend Socket Configuration (`frontend/hooks/useSocket.ts`)
- **Dynamic URL Detection**: Automatically detects localhost vs production
- **Enhanced Reconnection**: Added proper reconnection logic with retries
- **Better Error Handling**: Detailed logging for debugging
- **Transport Fallback**: WebSocket with polling fallback

### 2. Backend Socket Configuration (`backend/src/server.js`)
- **Enhanced CORS**: Added origin validation
- **Production Optimizations**: Disabled unnecessary features for production
- **Better Error Handling**: Added request validation

### 3. Environment Configuration
- **Production URL**: Uses `https://cenopie.com` (no port)
- **Local Development**: Uses `http://localhost:4000`
- **Automatic Detection**: Based on hostname

## Deployment Steps

### 1. Update Frontend Environment
Make sure your production environment has:
```bash
NEXT_PUBLIC_SOCKET_URL=https://cenopie.com
```

### 2. Backend Configuration
Ensure your backend is running on port 80/443 (standard HTTP/HTTPS ports) or behind a reverse proxy.

### 3. Nginx Configuration (if using reverse proxy)
Add WebSocket support to your Nginx config:
```nginx
location /socket.io/ {
    proxy_pass http://localhost:4000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

### 4. PM2 Configuration (if using PM2)
Update your ecosystem.config.js to handle Socket.IO clustering:
```javascript
module.exports = {
  apps: [{
    name: 'cenopie-backend',
    script: './src/server.js',
    instances: 1, // Use 1 instance for Socket.IO without Redis
    exec_mode: 'fork', // Use fork mode for single instance
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    }
  }]
};
```

## Testing Steps

### 1. Check Socket.IO Connection
Open browser console on cenopie.com and look for:
- `🔌 Connecting to Socket.IO server: https://cenopie.com`
- `✅ Socket connected successfully to: https://cenopie.com`

### 2. Test Message Sending
1. Send a message in chat
2. Check console for: `📤 Sending message:`
3. Check for: `✅ Message sent successfully:`
4. Verify real-time delivery without refresh

### 3. Network Tab Debugging
1. Open Network tab in DevTools
2. Look for Socket.IO requests to `/socket.io/`
3. Check for WebSocket upgrade or polling requests
4. Verify no CORS errors

## Common Production Issues & Solutions

### Issue 1: "Connection refused"
**Cause**: Backend not accessible on the expected URL
**Solution**: Verify backend is running and accessible at https://cenopie.com

### Issue 2: "CORS error"
**Cause**: Origin not allowed in CORS configuration
**Solution**: Check backend CORS settings include your domain

### Issue 3: "WebSocket connection failed"
**Cause**: WebSocket blocked by firewall/proxy
**Solution**: Socket.IO will automatically fallback to polling

### Issue 4: "Authentication failed"
**Cause**: Token not being sent properly
**Solution**: Check token is in localStorage and being passed to socket

### Issue 5: Messages slow/not real-time
**Cause**: Falling back to polling instead of WebSocket
**Solution**: Configure reverse proxy for WebSocket support

## Monitoring & Debugging

### Backend Logs to Watch
```bash
# Connection logs
✅ Socket authenticated: [username]
🔌 User connected: [username]

# Message logs  
📤 Emitting message to chat_[chatId]
✅ Message emitted to Socket.IO rooms

# Error logs
❌ Socket connection error: [error]
❌ Socket authentication error: [error]
```

### Frontend Console Logs
```bash
# Connection logs
🔌 Connecting to Socket.IO server: https://cenopie.com
✅ Socket connected successfully to: https://cenopie.com

# Message logs
📤 Sending message: [content]
✅ Message sent successfully: [data]
📨 Received new message event: [data]

# Error logs
❌ Socket connection error: [error]
❌ Failed to send message: [error]
```

## Performance Optimization

### 1. Enable Redis (Optional)
For multiple server instances, enable Redis adapter:
```bash
REDIS_DISABLED=false
```

### 2. WebSocket Priority
Ensure WebSocket is working for best performance:
- Configure reverse proxy for WebSocket
- Check firewall allows WebSocket connections
- Monitor connection type in browser DevTools

### 3. Connection Pooling
Limit concurrent connections per user:
- Implement connection limits
- Clean up old connections
- Monitor memory usage

## Rollback Plan

If issues persist, you can temporarily disable real-time features:
1. Comment out Socket.IO initialization in backend
2. Remove Socket.IO listeners in frontend
3. Messages will still work but require page refresh
4. Investigate and fix Socket.IO issues separately

This ensures the chat system remains functional while debugging real-time features.