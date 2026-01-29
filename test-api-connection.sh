#!/bin/bash

# Test API Connection Script
# Quick test to verify API endpoints are working

echo "🧪 Testing Cenopie API Connection..."

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_test() {
    echo -n "Testing $1... "
}

print_pass() {
    echo -e "${GREEN}PASS${NC}"
}

print_fail() {
    echo -e "${RED}FAIL${NC} - $1"
}

print_warn() {
    echo -e "${YELLOW}WARN${NC} - $1"
}

# Test 1: Backend Health
print_test "Backend Health"
if curl -f -s http://localhost:4000/api/health > /dev/null 2>&1; then
    print_pass
else
    print_fail "Backend not responding on port 4000"
fi

# Test 2: Frontend Response
print_test "Frontend Response"
if curl -f -s http://localhost:3001 > /dev/null 2>&1; then
    print_pass
else
    print_fail "Frontend not responding on port 3001"
fi

# Test 3: Upload Route
print_test "Upload Route"
response=$(curl -s http://localhost:4000/api/upload/test 2>/dev/null)
if echo "$response" | grep -q "Upload route is working"; then
    print_pass
else
    print_fail "Upload route not accessible"
fi

# Test 4: CORS Headers
print_test "CORS Headers"
cors_header=$(curl -s -I -H "Origin: https://cenopie.com" http://localhost:4000/api/health | grep -i "access-control-allow-origin")
if [ ! -z "$cors_header" ]; then
    print_pass
else
    print_warn "CORS headers not found (may still work)"
fi

# Test 5: Environment Variables (Frontend)
print_test "Frontend Environment"
if [ -f "frontend/.env.local" ]; then
    api_url=$(grep "NEXT_PUBLIC_API_URL" frontend/.env.local | cut -d'=' -f2)
    if [ "$api_url" = "https://cenopie.com" ]; then
        print_pass
    else
        print_fail "API URL is '$api_url', should be 'https://cenopie.com'"
    fi
else
    print_fail "frontend/.env.local not found"
fi

# Test 6: PM2 Status
print_test "PM2 Services"
if pm2 list | grep -q "online"; then
    online_count=$(pm2 list | grep -c "online")
    if [ "$online_count" -ge 2 ]; then
        print_pass
    else
        print_warn "Only $online_count service(s) online, expected 2"
    fi
else
    print_fail "No PM2 services online"
fi

echo ""
echo "🔍 Detailed Status:"
echo "PM2 Status:"
pm2 status 2>/dev/null || echo "PM2 not running"

echo ""
echo "Recent PM2 Logs (last 10 lines):"
pm2 logs --lines 10 2>/dev/null || echo "No PM2 logs available"

echo ""
echo "✅ If all tests pass, your API connection issues should be resolved!"
echo "🌐 Test your application at: https://cenopie.com"