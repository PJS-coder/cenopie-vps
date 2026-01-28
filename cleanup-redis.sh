#!/bin/bash

echo "🧹 Cleaning up Redis warnings..."

# Update the Redis config to completely disable Redis client creation
cd /var/www/cenopie-vps/backend/src/config

# Backup original
cp redis.js redis.js.backup

# Create a completely disabled Redis config
cat > redis.js << 'EOF'
// Redis configuration - completely disabled for production
let redisClient = null;

// Always disable Redis in production
console.log('⚠️ Redis is disabled - using in-memory operations');

export default redisClient;
EOF

echo "✅ Redis configuration updated to eliminate warnings"

# Restart backend to apply changes
pm2 restart cenopie-backend

echo "🔄 Backend restarted to apply Redis fix"
sleep 3

# Check logs
pm2 logs cenopie-backend --lines 10