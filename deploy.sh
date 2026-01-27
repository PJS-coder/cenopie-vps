#!/bin/bash

# Cenopie Production Deployment Script
# Usage: ./deploy.sh

set -e  # Exit on any error

echo "🚀 Starting Cenopie Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please don't run this script as root"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_status "Node.js version: $(node -v) ✓"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 is not installed. Installing PM2..."
    npm install -g pm2
fi

print_status "PM2 version: $(pm2 -v) ✓"

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs
mkdir -p uploads
mkdir -p backups

# Install backend dependencies
print_status "Installing backend dependencies..."
cd backend
npm ci --production=false
print_success "Backend dependencies installed"

# Install frontend dependencies
print_status "Installing frontend dependencies..."
cd ../frontend
npm ci --production=false
print_success "Frontend dependencies installed"

# Build frontend
print_status "Building frontend for production..."
npm run build:prod
print_success "Frontend built successfully"

# Go back to root directory
cd ..

# Copy environment files
print_status "Setting up environment files..."
if [ ! -f backend/.env ]; then
    cp backend/.env.production backend/.env
    print_warning "Created backend/.env from .env.production. Please update with your actual values."
fi

if [ ! -f frontend/.env.local ]; then
    cp frontend/.env.production frontend/.env.local
    print_warning "Created frontend/.env.local from .env.production. Please update with your actual values."
fi

# Create PM2 ecosystem file
print_status "Creating PM2 ecosystem configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'cenopie-backend',
      script: 'backend/src/server.js',
      cwd: './',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git'],
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000
    },
    {
      name: 'cenopie-frontend',
      script: 'npm',
      args: 'start',
      cwd: './frontend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      max_memory_restart: '512M',
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000
    }
  ]
};
EOF

print_success "PM2 ecosystem configuration created"

# Start applications with PM2
print_status "Starting applications with PM2..."
pm2 delete all 2>/dev/null || true  # Delete existing processes
pm2 start ecosystem.config.js
pm2 save
pm2 startup

print_success "Applications started successfully!"

# Display status
print_status "Application Status:"
pm2 status

print_success "🎉 Deployment completed successfully!"
print_status "Frontend: http://localhost:3000"
print_status "Backend: http://localhost:4000"
print_warning "Don't forget to:"
print_warning "1. Configure your reverse proxy (Nginx)"
print_warning "2. Set up SSL certificates"
print_warning "3. Configure your domain DNS"
print_warning "4. Update environment variables with real values"
print_warning "5. Set up MongoDB and Redis"

echo ""
print_status "Useful PM2 commands:"
echo "  pm2 status          - Check application status"
echo "  pm2 logs            - View logs"
echo "  pm2 restart all     - Restart all applications"
echo "  pm2 stop all        - Stop all applications"
echo "  pm2 delete all      - Delete all applications"
echo ""