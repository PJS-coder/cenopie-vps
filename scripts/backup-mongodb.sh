#!/bin/bash

# MongoDB Backup Script for Cenopie
# Run daily via cron: 0 2 * * * /path/to/backup-mongodb.sh

# Configuration
BACKUP_DIR="/var/backups/mongodb"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_NAME="cenopie_backup_$DATE"
RETENTION_DAYS=7

# MongoDB credentials (from .env)
MONGO_USER="pjs89079_db_user"
MONGO_PASS="adO1gs2LZryrCKbM"
MONGO_HOST="cenopie.ae8q9xo.mongodb.net"
MONGO_DB="Cenopie"

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
echo "🔄 Starting MongoDB backup: $BACKUP_NAME"
mongodump \
  --uri="mongodb+srv://$MONGO_USER:$MONGO_PASS@$MONGO_HOST/$MONGO_DB?retryWrites=true&w=majority" \
  --out="$BACKUP_DIR/$BACKUP_NAME" \
  --gzip

# Check if backup was successful
if [ $? -eq 0 ]; then
  echo "✅ Backup completed successfully"
  
  # Compress backup
  cd $BACKUP_DIR
  tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME"
  rm -rf "$BACKUP_NAME"
  
  echo "📦 Backup compressed: $BACKUP_NAME.tar.gz"
  
  # Calculate backup size
  SIZE=$(du -h "$BACKUP_NAME.tar.gz" | cut -f1)
  echo "💾 Backup size: $SIZE"
  
  # Remove old backups (older than RETENTION_DAYS)
  find $BACKUP_DIR -name "cenopie_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete
  echo "🗑️  Old backups removed (retention: $RETENTION_DAYS days)"
  
  # Optional: Upload to cloud storage (uncomment if needed)
  # aws s3 cp "$BACKUP_DIR/$BACKUP_NAME.tar.gz" s3://your-bucket/backups/
  # rclone copy "$BACKUP_DIR/$BACKUP_NAME.tar.gz" remote:backups/
  
else
  echo "❌ Backup failed!"
  exit 1
fi

echo "✨ Backup process completed"
