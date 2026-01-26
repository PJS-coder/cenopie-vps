#!/bin/bash

# Cenopie Ultra-Performance Deployment Script v2.0
# Latest deployment practices with enhanced error handling

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/var/www/cenopie/cenopie-cpanel-vercel"
BACKUP_DIR="/var/backups/cenopie"
LOG_FILE="/var/log/cenopie-deploy.log"
MAX_DEPLOY_TIME=600  # 10 minutes timeout

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR $(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARN $(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO $(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

# Deployment timeout
timeout_deploy() {
    timeout $MAX_DEPLOY_TIME "$@" || error "Deployment timed out after ${MAX_DEPLOY_TIME} seconds"
}

# Health check function
health_check() {
    local service=$1
    local port=$2
    local max_attempts=30
    local attempt=1
    
    info "Health checking $service on port $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "http://localhost:$port/api/health" > /dev/null 2>&1 || 
           curl -f -s "http://localhost:$port" > /dev/null 2>&1; then
            log "✅ $service is healthy on port $port"
            return 0
        fi
        
        info "Attempt $attempt/$max_attempts: $service not ready yet..."
        sleep 2
        ((attempt++))
    done
    
    error "❌ $service failed health check on port $port"
}

# Backup function
create_backup() {
    info "Creating backup..."
    mkdir -p "$BACKUP_DIR"
    
    local backup_name="cenopie-backup-$(date +%Y%m%d-%H%M%S)"
    
    if [ -d "$PROJECT_DIR" ]; then
        tar -czf "$BACKUP_DIR/$backup_name.tar.gz" \
            --exclude="node_modules" \
            --exclude=".git" \
            --exclude="*.log" \
            -C "$(dirname "$PROJECT_DIR")" \
            "$(basename "$PROJECT_DIR")" || warn "Backup creation failed"
        
        log "✅ Backup created: $backup_name.tar.gz"
    fi
}

# Cleanup old backups (keep last 5)
cleanup_backups() {
    info "Cleaning up old backups..."
    find "$BACKUP_DIR" -name "cenopie-backup-*.tar.gz" -type f | 
        sort -r | tail -n +6 | xargs -r rm -f
}

# System requirements check
check_system() {
    info "Checking system requirements..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
    fi
    
    local node_version=$(node -v | cut -d'v' -f2)
    local required_version="18.0.0"
    
    if ! printf '%s\n%s\n' "$required_version" "$node_version" | sort -V -C; then
        error "Node.js version $node_version is too old. Required: $required_version+"
    fi
    
    # Check available disk space (require at least 2GB)
    local available_space=$(df "$PROJECT_DIR" | awk 'NR==2 {print $4}')
    if [ "$available_space" -lt 2097152 ]; then  # 2GB in KB
        error "Insufficient disk space. Available: $(($available_space/1024))MB, Required: 2GB"
    fi
    
    # Check memory
    local available_memory=$(free -m | awk 'NR==2{print $7}')
    if [ "$available_memory" -lt 512 ]; then
        warn "Low available memory: ${available_memory}MB. Deployment may be slow."
    fi
    
    log "✅ System requirements check passed"
}

# Main deployment function
main() {
    local start_time=$(date +%s)
    
    log "🚀 Starting Cenopie Ultra-Performance Deployment v2.0"
    log "📊 Deployment started at $(date)"
    
    # Pre-deployment checks
    check_system
    create_backup
    
    # Navigate to project directory
    cd "$PROJECT_DIR" || error "Failed to navigate to project directory"
    
    # Stop existing services gracefully
    info "Stopping existing services..."
    pm2 stop all || warn "No PM2 processes to stop"
    
    # Git operations with timeout
    info "Updating codebase..."
    timeout_deploy git fetch origin
    timeout_deploy git reset --hard origin/main
    timeout_deploy git clean -fd
    
    # Backend deployment
    info "🔧 Deploying backend..."
    cd "$PROJECT_DIR/backend"
    
    # Install dependencies with latest npm features
    timeout_deploy npm ci --production --no-audit --no-fund
    
    # Frontend deployment
    info "🎨 Deploying frontend..."
    cd "$PROJECT_DIR/frontend"
    
    # Install dependencies
    timeout_deploy npm ci --no-audit --no-fund
    
    # Build with latest optimizations
    info "Building frontend with latest optimizations..."
    timeout_deploy npm run build
    
    # Database optimizations
    info "🗄️ Running database optimizations..."
    cd "$PROJECT_DIR/backend"
    timeout_deploy node scripts/ultra-db-optimize.js || warn "Database optimization failed"
    
    # Start services with enhanced configuration
    info "🚀 Starting services..."
    cd "$PROJECT_DIR"
    pm2 start ecosystem.config.js --env production
    
    # Wait for services to start
    sleep 10
    
    # Health checks
    health_check "Backend" "5000"
    health_check "Frontend" "3000"
    
    # Performance verification
    info "🔍 Running performance verification..."
    
    # Check response times
    backend_response=$(curl -w "%{time_total}" -s -o /dev/null "http://localhost:5000/api/health" || echo "999")
    frontend_response=$(curl -w "%{time_total}" -s -o /dev/null "http://localhost:3000" || echo "999")
    
    if (( $(echo "$backend_response < 2.0" | bc -l) )); then
        log "✅ Backend response time: ${backend_response}s"
    else
        warn "⚠️ Backend response time slow: ${backend_response}s"
    fi
    
    if (( $(echo "$frontend_response < 3.0" | bc -l) )); then
        log "✅ Frontend response time: ${frontend_response}s"
    else
        warn "⚠️ Frontend response time slow: ${frontend_response}s"
    fi
    
    # Cleanup
    cleanup_backups
    
    # Final status
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log "🎉 Deployment completed successfully!"
    log "⏱️ Total deployment time: ${duration} seconds"
    log "📊 System status:"
    pm2 status
    
    info "🌐 Services are now available:"
    info "   Frontend: http://localhost:3000"
    info "   Backend:  http://localhost:5000"
    info "   API Docs: http://localhost:5000/api-docs"
    
    log "✅ Cenopie Ultra-Performance Deployment v2.0 completed at $(date)"
}

# Error handling
trap 'error "Deployment failed at line $LINENO"' ERR

# Run main function
main "$@"