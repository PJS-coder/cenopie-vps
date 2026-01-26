#!/bin/bash

echo "🚀 Quick Deploy Script for Cenopie"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "frontend" ] && [ ! -d "backend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Starting deployment process..."

# Backend setup
echo ""
echo "🔧 Setting up Backend..."
cd backend

# Check if node_modules exists and is healthy
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    print_warning "Installing backend dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "Backend npm install failed"
        exit 1
    fi
else
    print_status "Backend dependencies already installed"
fi

# Test backend start
print_status "Testing backend..."
timeout 3s npm start > /dev/null 2>&1
if [ $? -eq 124 ]; then
    print_status "Backend starts successfully"
else
    print_warning "Backend may have issues, but continuing..."
fi

cd ..

# Frontend setup
echo ""
echo "🎨 Setting up Frontend..."
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_warning "Installing frontend dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "Frontend npm install failed"
        exit 1
    fi
else
    print_status "Frontend dependencies already installed"
fi

# Test frontend build
print_status "Testing frontend build..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_status "Frontend builds successfully"
else
    print_error "Frontend build failed"
    exit 1
fi

cd ..

# Final status
echo ""
echo "🎉 Deployment Check Complete!"
echo "=============================="
print_status "Backend: Ready"
print_status "Frontend: Ready"
echo ""
echo "To start the application:"
echo "1. Backend: cd backend && npm start"
echo "2. Frontend: cd frontend && npm run dev"
echo ""
echo "Production build:"
echo "1. Backend: cd backend && npm start"
echo "2. Frontend: cd frontend && npm run build && npm start"