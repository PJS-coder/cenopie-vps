#!/bin/bash

echo "📊 Cenopie Performance Monitor"
echo "=============================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_metric() {
    echo -e "${BLUE}$1:${NC} $2"
}

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo ""
echo "🖥️  System Resources"
echo "-------------------"

# CPU Usage
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
print_metric "CPU Usage" "${CPU_USAGE}%"

# Memory Usage
MEMORY_INFO=$(free -h | grep '^Mem:')
MEMORY_USED=$(echo $MEMORY_INFO | awk '{print $3}')
MEMORY_TOTAL=$(echo $MEMORY_INFO | awk '{print $2}')
print_metric "Memory Usage" "${MEMORY_USED}/${MEMORY_TOTAL}"

# Disk Usage
DISK_USAGE=$(df -h / | awk 'NR==2{print $5}')
print_metric "Disk Usage" "$DISK_USAGE"

# Load Average
LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}')
print_metric "Load Average" "$LOAD_AVG"

echo ""
echo "🚀 PM2 Processes"
echo "----------------"
pm2 status

echo ""
echo "🌐 Nginx Status"
echo "---------------"
if systemctl is-active --quiet nginx; then
    print_status "Nginx is running"
    # Show nginx connections
    NGINX_CONNECTIONS=$(ss -tuln | grep :443 | wc -l)
    print_metric "HTTPS Connections" "$NGINX_CONNECTIONS"
else
    print_error "Nginx is not running"
fi

echo ""
echo "🗄️  Redis Status"
echo "---------------"
if systemctl is-active --quiet redis-server; then
    print_status "Redis is running"
    # Redis info
    REDIS_MEMORY=$(redis-cli info memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')
    REDIS_CONNECTIONS=$(redis-cli info clients | grep connected_clients | cut -d: -f2 | tr -d '\r')
    print_metric "Redis Memory" "$REDIS_MEMORY"
    print_metric "Redis Connections" "$REDIS_CONNECTIONS"
else
    print_warning "Redis is not running (caching disabled)"
fi

echo ""
echo "🔗 Database Connections"
echo "-----------------------"
# Check MongoDB connections (if accessible)
if command -v mongo &> /dev/null || command -v mongosh &> /dev/null; then
    print_status "MongoDB client available"
else
    print_warning "MongoDB client not installed locally"
fi

echo ""
echo "📈 Performance Metrics"
echo "---------------------"

# Check response time
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}\n' https://cenopie.com)
print_metric "Homepage Response Time" "${RESPONSE_TIME}s"

# Check SSL certificate
SSL_EXPIRY=$(echo | openssl s_client -servername cenopie.com -connect cenopie.com:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
print_metric "SSL Certificate Expires" "$SSL_EXPIRY"

echo ""
echo "📊 Recent Logs (Last 10 lines)"
echo "------------------------------"
echo "Backend logs:"
pm2 logs cenopie-backend --lines 5 --nostream

echo ""
echo "Frontend logs:"
pm2 logs cenopie-frontend --lines 5 --nostream

echo ""
echo "🔍 Quick Health Check"
echo "--------------------"

# Test API endpoint
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://cenopie.com/api/health 2>/dev/null || echo "000")
if [ "$API_STATUS" = "200" ]; then
    print_status "API is responding (HTTP $API_STATUS)"
else
    print_error "API is not responding (HTTP $API_STATUS)"
fi

# Test frontend
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://cenopie.com 2>/dev/null || echo "000")
if [ "$FRONTEND_STATUS" = "200" ]; then
    print_status "Frontend is responding (HTTP $FRONTEND_STATUS)"
else
    print_error "Frontend is not responding (HTTP $FRONTEND_STATUS)"
fi

echo ""
echo "💡 Performance Tips"
echo "------------------"
echo "• Run 'pm2 monit' for real-time monitoring"
echo "• Check 'pm2 logs' for detailed application logs"
echo "• Monitor with 'htop' for system resources"
echo "• Use 'redis-cli monitor' to watch Redis activity"
echo "• Check nginx logs: 'sudo tail -f /var/log/nginx/access.log'"
echo ""