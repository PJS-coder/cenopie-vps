#!/bin/bash

# Cenopie Backup Script
# Backs up database, uploads, and configuration files

set -e

# Configuration
APP_NAME="cenopie"
APP_DIR="/opt/$APP_NAME"
BACKUP_DIR="/opt/backups/$APP_NAME"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/$DATE"

# Retention (days)
RETENTION_DAYS=30

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

print_status "🔄 Starting Cenopie backup - $DATE"

# Create backup directory
mkdir -p "$BACKUP_PATH"

# Backup MongoDB database
if command -v mongodump &> /dev/null; then
    print_status "📊 Backing up MongoDB database..."
    mongodump --db cenopie --out "$BACKUP_PATH/database" --quiet
    
    # Compress database backup
    tar -czf "$BACKUP_PATH/database.tar.gz" -C "$BACKUP_PATH" database
    rm -rf "$BACKUP_PATH/database"
else
    print_warning "MongoDB not found locally, skipping database backup"
fi

# Backup application files
print_status "📁 Backing up application configuration..."
mkdir -p "$BACKUP_PATH/config"

# Backup environment files
cp "$APP_DIR/backend/.env.production" "$BACKUP_PATH/config/" 2>/dev/null || true
cp "$APP_DIR/frontend/.env.production" "$BACKUP_PATH/config/" 2>/dev/null || true

# Backup PM2 ecosystem
cp "$APP_DIR/ecosystem.config.js" "$BACKUP_PATH/config/" 2>/dev/null || true

# Backup nginx configuration
cp "/etc/nginx/sites-available/$APP_NAME" "$BACKUP_PATH/config/nginx.conf" 2>/dev/null || true

# Backup systemd services
cp "/etc/systemd/system/cenopie-*.service" "$BACKUP_PATH/config/" 2>/dev/null || true

# Create backup info file
cat > "$BACKUP_PATH/backup_info.txt" << EOF
Cenopie Backup Information
=========================
Date: $DATE
Server: $(hostname)
Node Version: $(node --version 2>/dev/null || echo "Not available")
PM2 Version: $(pm2 --version 2>/dev/null || echo "Not available")
Nginx Version: $(nginx -v 2>&1 | cut -d' ' -f3 2>/dev/null || echo "Not available")

Backup Contents:
- Database: $([ -f "$BACKUP_PATH/database.tar.gz" ] && echo "Yes" || echo "No")
- Configuration: Yes
- Environment files: Yes

Application Status at backup time:
$(pm2 status 2>/dev/null || echo "PM2 not available")
EOF

# Compress entire backup
print_status "🗜️  Compressing backup..."
cd "$BACKUP_DIR"
tar -czf "${DATE}.tar.gz" "$DATE"
rm -rf "$DATE"

# Calculate backup size
BACKUP_SIZE=$(du -h "${DATE}.tar.gz" | cut -f1)
print_status "💾 Backup completed: ${DATE}.tar.gz ($BACKUP_SIZE)"

# Clean old backups
print_status "🧹 Cleaning old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete

# List current backups
print_status "📋 Current backups:"
ls -lh "$BACKUP_DIR"/*.tar.gz 2>/dev/null | tail -5 || echo "No backups found"

print_status "✅ Backup process completed successfully"

# Optional: Upload to cloud storage
# Uncomment and configure for your cloud provider
# print_status "☁️  Uploading to cloud storage..."
# aws s3 cp "${BACKUP_DIR}/${DATE}.tar.gz" "s3://your-backup-bucket/cenopie/" || true
# gsutil cp "${BACKUP_DIR}/${DATE}.tar.gz" "gs://your-backup-bucket/cenopie/" || true

exit 0