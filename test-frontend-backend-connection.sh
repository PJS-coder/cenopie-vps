#!/bin/bash

echo "Testing frontend-backend connection..."

# Test 1: Frontend trying to reach backend through main domain
echo "1. Testing https://cenopie.com/api/upload/interview-video (what frontend tries):"
curl -X POST https://cenopie.com/api/upload/interview-video
echo -e "\n"

# Test 2: Test health endpoint through main domain
echo "2. Testing https://cenopie.com/api/health (frontend health check):"
curl -X GET https://cenopie.com/api/health
echo -e "\n"

# Test 3: Test upload test endpoint through main domain
echo "3. Testing https://cenopie.com/api/upload/test:"
curl -X GET https://cenopie.com/api/upload/test
echo -e "\n"

# Test 4: Check if there's a reverse proxy or nginx configuration
echo "4. Testing if nginx/apache is proxying to backend:"
curl -I https://cenopie.com/api/health
echo -e "\n"