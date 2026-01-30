#!/bin/bash

echo "Testing upload endpoints..."

# Test 1: Check if upload route exists (should return 401 without auth, not 404)
echo "1. Testing /api/upload/interview-video (no auth - should return 401, not 404):"
curl -X POST http://localhost:4000/api/upload/interview-video
echo -e "\n"

# Test 2: Check upload test endpoint
echo "2. Testing /api/upload/test:"
curl -X GET http://localhost:4000/api/upload/test
echo -e "\n"

# Test 3: List all available routes
echo "3. Testing root API endpoint:"
curl -X GET http://localhost:4000/api/
echo -e "\n"

# Test 4: Check if upload routes are loaded
echo "4. Testing upload base path:"
curl -X GET http://localhost:4000/api/upload/
echo -e "\n"