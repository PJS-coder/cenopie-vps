#!/bin/bash

# Cenopie Monitoring and Health Check Script
# Monitors application health and sends alerts

set -e

# Configuration
APP_NAME="cenopie"
APP_DIR="/opt/$APP_NAME"
LOG_FILE="/var/log/cenopie-monitor.log"
ALERT_EMAIL="admin@yourdomain.com"  # Change this
WEBHOOK_URL=""  # Optional: Slack/Discord webhook

# Health check URLs
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:4000/api/health"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

send_alert() {
    local message="$1"
    local severity="$2"
    
    log_message "ALERT [$severity]: $message"
    
    # Send email alert (requires mailutils)
    if command -v mail &> /dev/null && [ -n "$ALERT_EMAIL" ]; then
        echo "$message" | mail -s "Cenopie Alert [$severity]" "$ALERT_EMAIL"
    fi
    
    # Send webhook alert
    if [ -n "$WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 Cenopie Alert [$severity]: $message\"}" \
            "$WEBHOOK_URL" 2>/dev/null || true
    fi
}

check_service() {
    local service_name="$1"
    local url="$2"
    
    # Check if service is running via PM2
    if pm2 list | grep -q "$service_name.*online"; then
        print_status "$service_name is running"
        
        # Check HTTP response if URL provided
        if [ -n "$url" ]; then
            if curl -f -s "$url" > /dev/null; then
                print_status "$service_name HTTP check passed"
                return 0
            else
                print_error "$service_name HTTP check failed"
                send_alert "$service_name is running but not responding to HTTP requests" "HIGH"
                return 1
            fi
        fi
        return 0
    else
        print_error "$service_name is not running"
        send_alert "$service_name is not running" "CRITICAL"
        
        # Try to restart the service
        print_warning "Attempting to restart $service_name..."
        pm2 restart "$service_name" || true
        sleep 10
        
        # Check again
        if pm2 list | grep -q "$service_name.*online"; then
            print_status "$service_name restarted successfully"
            send_alert "$service_name was restarted automatically" "INFO"
            return 0
        else
            print_error "Failed to restart $service_name"
            send_alert "Failed to restart $service_name - manual intervention required" "CRITICAL"
            return 1
        fi
    fi
}

check_disk_space() {
    local usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$usage" -gt 90 ]; then
        print_error "Disk usage is ${usage}%"
        send_alert "Disk usage is critically high: ${usage}%" "CRITICAL"
        return 1
    elif [ "$usage" -gt 80 ]; then
        print_warning "Disk usage is ${usage}%"
        send_alert "Disk usage is high: ${usage}%" "WARNING"
        return 1
    else
        print_status "Disk usage is ${usage}%"
        return 0
    fi
}

check_memory() {
    local usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    
    if [ "$usage" -gt 90 ]; then
        print_error "Memory usage is ${usage}%"
        send_alert "Memory usage is critically high: ${usage}%" "CRITICAL"
        return 1
    elif [ "$usage" -gt 80 ]; then
        print_warning "Memory usage is ${usage}%"
        send_alert "Memory usage is high: ${usage}%" "WARNING"
        return 1
    else
        print_status "Memory usage is ${usage}%"
        return 0
    fi
}

check_nginx() {
    if systemctl is-active --quiet nginx; then
        print_status "Nginx is running"
        return 0
    else
        print_error "Nginx is not running"
        send_alert "Nginx is not running" "CRITICAL"
        
        # Try to restart nginx
        print_warning "Attempting to restart Nginx..."
        systemctl restart nginx || true
        sleep 5
        
        if systemctl is-active --quiet nginx; then
            print_status "Nginx restarted successfully"
            send_alert "Nginx was restarted automatically" "INFO"
            return 0
        else
            print_error "Failed to restart Nginx"
            send_alert "Failed to restart Nginx - manual intervention required" "CRITICAL"
            return 1
        fi
    fi
}

check_ssl_certificate() {
    local domain="$1"
    
    if [ -z "$domain" ]; then
        print_warning "No domain specified for SSL check"
        return 0
    fi
    
    # Check if certificate expires in less than 30 days
    local expiry_date=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
    local expiry_epoch=$(date -d "$expiry_date" +%s)
    local current_epoch=$(date +%s)
    local days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
    
    if [ "$days_until_expiry" -lt 7 ]; then
        print_error "SSL certificate expires in $days_until_expiry days"
        send_alert "SSL certificate for $domain expires in $days_until_expiry days" "CRITICAL"
        return 1
    elif [ "$days_until_expiry" -lt 30 ]; then
        print_warning "SSL certificate expires in $days_until_expiry days"
        send_alert "SSL certificate for $domain expires in $days_until_expiry days" "WARNING"
        return 1
    else
        print_status "SSL certificate is valid for $days_until_expiry days"
        return 0
    fi
}

generate_report() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "Cenopie Health Report - $timestamp"
    echo "=================================="
    echo ""
    
    echo "System Resources:"
    echo "- CPU Load: $(uptime | awk -F'load average:' '{print $2}')"
    echo "- Memory: $(free -h | awk 'NR==2{printf "%s/%s (%.0f%%)", $3,$2,$3*100/$2}')"
    echo "- Disk: $(df -h / | awk 'NR==2{printf "%s/%s (%s)", $3,$2,$5}')"
    echo ""
    
    echo "Application Status:"
    pm2 status
    echo ""
    
    echo "Recent Logs (last 10 lines):"
    echo "Backend:"
    tail -n 5 /opt/cenopie/logs/backend-error.log 2>/dev/null || echo "No backend logs"
    echo ""
    echo "Frontend:"
    tail -n 5 /opt/cenopie/logs/frontend-error.log 2>/dev/null || echo "No frontend logs"
    echo ""
    
    echo "Network Connections:"
    netstat -tlnp | grep -E ':(3000|4000|80|443)'
}

main() {
    log_message "Starting health check"
    
    local overall_status=0
    
    # Check services
    check_service "cenopie-backend" "$BACKEND_URL" || overall_status=1
    check_service "cenopie-frontend" "$FRONTEND_URL" || overall_status=1
    
    # Check system resources
    check_disk_space || overall_status=1
    check_memory || overall_status=1
    
    # Check nginx
    check_nginx || overall_status=1
    
    # Check SSL certificate (if domain is configured)
    # check_ssl_certificate "yourdomain.com" || overall_status=1
    
    if [ "$overall_status" -eq 0 ]; then
        print_status "All health checks passed"
        log_message "All health checks passed"
    else
        print_error "Some health checks failed"
        log_message "Some health checks failed"
    fi
    
    # Generate detailed report if requested
    if [ "$1" = "--report" ]; then
        generate_report
    fi
    
    log_message "Health check completed"
    return $overall_status
}

# Run main function
main "$@"