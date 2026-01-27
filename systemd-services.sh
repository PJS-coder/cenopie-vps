#!/bin/bash

# Create systemd services for Cenopie (alternative to PM2)
# This script creates systemd service files for running Cenopie as system services

echo "🔧 Creating systemd services for Cenopie..."

# Create cenopie-backend service
sudo tee /etc/systemd/system/cenopie-backend.service > /dev/null << 'EOF'
[Unit]
Description=Cenopie Backend Service
After=network.target
Wants=network.target

[Service]
Type=simple
User=cenopie
Group=cenopie
WorkingDirectory=/var/www/cenopie/backend
Environment=NODE_ENV=production
Environment=PORT=4000
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=cenopie-backend
KillMode=mixed
KillSignal=SIGINT
TimeoutStopSec=5

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/www/cenopie
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true

[Install]
WantedBy=multi-user.target
EOF

# Create cenopie-frontend service
sudo tee /etc/systemd/system/cenopie-frontend.service > /dev/null << 'EOF'
[Unit]
Description=Cenopie Frontend Service
After=network.target cenopie-backend.service
Wants=network.target
Requires=cenopie-backend.service

[Service]
Type=simple
User=cenopie
Group=cenopie
WorkingDirectory=/var/www/cenopie/frontend
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=cenopie-frontend
KillMode=mixed
KillSignal=SIGINT
TimeoutStopSec=5

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/www/cenopie
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable services
sudo systemctl daemon-reload
sudo systemctl enable cenopie-backend
sudo systemctl enable cenopie-frontend

echo "✅ Systemd services created and enabled"
echo ""
echo "📊 Service management commands:"
echo "  - Start services: sudo systemctl start cenopie-backend cenopie-frontend"
echo "  - Stop services: sudo systemctl stop cenopie-backend cenopie-frontend"
echo "  - Restart services: sudo systemctl restart cenopie-backend cenopie-frontend"
echo "  - Check status: sudo systemctl status cenopie-backend cenopie-frontend"
echo "  - View logs: sudo journalctl -u cenopie-backend -f"
echo "  - View logs: sudo journalctl -u cenopie-frontend -f"