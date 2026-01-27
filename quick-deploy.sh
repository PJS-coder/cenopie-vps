#!/bin/bash

# Cenopie Quick Deployment Script
# This script helps you deploy Cenopie to your Ubuntu VPS quickly

echo "🚀 Cenopie Quick Deployment Helper"
echo "=================================="

# Check if we're on the VPS or local machine
if [[ -f "/etc/os-release" ]] && grep -q "Ubuntu" /etc/os-release; then
    echo "✅ Detected Ubuntu system - proceeding with VPS deployment"
    
    # Check if we're in the right directory
    if [[ ! -f "deploy-production.sh" ]]; then
        echo "❌ deploy-production.sh not found in current directory"
        echo "💡 Please navigate to your Cenopie project directory first"
        exit 1
    fi
    
    # Run the main deployment script
    echo "🚀 Starting production deployment..."
    ./deploy-production.sh
    
else
    echo "📋 This appears to be your local machine"
    echo ""
    echo "To deploy Cenopie to your VPS, follow these steps:"
    echo ""
    echo "1️⃣  Upload your code to the VPS:"
    echo "   scp -r ./* your-username@your-vps-ip:/var/www/cenopie/"
    echo ""
    echo "2️⃣  SSH into your VPS:"
    echo "   ssh your-username@your-vps-ip"
    echo ""
    echo "3️⃣  Navigate to the project directory:"
    echo "   cd /var/www/cenopie"
    echo ""
    echo "4️⃣  Run the deployment script:"
    echo "   ./deploy-production.sh"
    echo ""
    echo "📖 For detailed instructions, see: DEPLOYMENT-GUIDE.md"
    echo ""
    
    # Ask if user wants to upload files
    read -p "🤔 Do you want to upload files to your VPS now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "🌐 Enter your VPS IP address: " vps_ip
        read -p "👤 Enter your VPS username: " vps_user
        
        echo "📤 Uploading files to $vps_user@$vps_ip:/var/www/cenopie/"
        
        # Create directory on VPS
        ssh $vps_user@$vps_ip "sudo mkdir -p /var/www/cenopie && sudo chown $vps_user:$vps_user /var/www/cenopie"
        
        # Upload files
        scp -r ./* $vps_user@$vps_ip:/var/www/cenopie/
        
        echo "✅ Files uploaded successfully!"
        echo ""
        echo "🔗 Now SSH into your VPS and run the deployment:"
        echo "   ssh $vps_user@$vps_ip"
        echo "   cd /var/www/cenopie"
        echo "   ./deploy-production.sh"
    fi
fi