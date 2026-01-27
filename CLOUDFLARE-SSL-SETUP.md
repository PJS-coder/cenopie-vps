# Cloudflare SSL Setup Guide for Cenopie

This guide walks you through setting up Cloudflare SSL for your Cenopie application.

## Prerequisites

- Domain pointing to Cloudflare nameservers
- Cloudflare account with your domain added
- Server access with sudo privileges

## Step 1: Cloudflare Dashboard Configuration

### DNS Settings
1. Go to **DNS** tab in Cloudflare dashboard
2. Ensure these records are set to **Proxied** (🟠 orange cloud):
   - `cenopie.com` A record → Your server IP (185.27.135.185)
   - `www.cenopie.com` A record → Your server IP (185.27.135.185)

### SSL/TLS Settings
1. Go to **SSL/TLS** → **Overview**
2. Set encryption mode to **"Full (strict)"**

### Edge Certificates
1. Go to **SSL/TLS** → **Edge Certificates**
2. Enable **"Always Use HTTPS"**
3. Verify **"Universal SSL"** is **Active**

## Step 2: Generate Origin Certificate

1. Go to **SSL/TLS** → **Origin Server**
2. Click **"Create Certificate"**
3. Select:
   - **Let Cloudflare generate a private key and a CSR**
   - **RSA (2048)**
   - Hostnames: `cenopie.com`, `*.cenopie.com`, `www.cenopie.com`
   - Certificate Validity: **15 years**
4. Click **"Next"**

## Step 3: Install Origin Certificate on Server

### Save Certificate
```bash
# Create SSL directory
sudo mkdir -p /etc/ssl/cloudflare

# Save the certificate
sudo nano /etc/ssl/cloudflare/cenopie.com.pem
# Paste the Origin Certificate (including -----BEGIN CERTIFICATE----- and -----END CERTIFICATE-----)

# Save the private key
sudo nano /etc/ssl/cloudflare/cenopie.com.key
# Paste the Private Key (including -----BEGIN PRIVATE KEY----- and -----END PRIVATE KEY-----)

# Set proper permissions
sudo chmod 600 /etc/ssl/cloudflare/cenopie.com.key
sudo chmod 644 /etc/ssl/cloudflare/cenopie.com.pem
sudo chown root:root /etc/ssl/cloudflare/*
```

## Step 4: Deploy Application

Run the deployment script:

```bash
cd /var/www/cenopie-vps
chmod +x deploy-production.sh
./deploy-production.sh
```

Or use the quick deployment:

```bash
chmod +x quick-deploy.sh
./quick-deploy.sh
```

## Step 5: Verify SSL Setup

### Test Commands
```bash
# Test HTTPS
curl -I https://cenopie.com

# Check certificate details
openssl s_client -connect cenopie.com:443 -servername cenopie.com < /dev/null

# Test redirect
curl -I http://cenopie.com
```

### Expected Results
- HTTPS should return `200 OK`
- HTTP should redirect to HTTPS (`301 Moved Permanently`)
- Certificate should be issued by Google Trust Services (Cloudflare's CA)

## Step 6: Additional Security (Optional)

### HSTS (HTTP Strict Transport Security)
1. Go to **SSL/TLS** → **Edge Certificates**
2. Enable **"HTTP Strict Transport Security (HSTS)"**
3. Configure:
   - **Max Age Header**: 6 months
   - **Include Subdomains**: Yes
   - **Preload**: Yes (optional)

### Minimum TLS Version
1. Go to **SSL/TLS** → **Edge Certificates**
2. Set **"Minimum TLS Version"** to **TLS 1.2**

## Troubleshooting

### Common Issues

#### 1. "This site can't be reached" Error
- Check DNS propagation: `dig cenopie.com A`
- Ensure A records are **Proxied** (🟠)
- Wait 5-10 minutes for DNS propagation

#### 2. "Your connection isn't private" Error
- Verify Origin certificates are correctly installed
- Check file permissions on certificate files
- Ensure nginx configuration is correct

#### 3. "ERR_ECH_FALLBACK_CERTIFICATE_INVALID"
- Disable **"Encrypted Client Hello (ECH)"** in Cloudflare temporarily
- Clear browser cache
- Try incognito/private browsing mode

#### 4. Port 3000 Already in Use
- Run: `sudo fuser -k 3000/tcp`
- Clean PM2: `pm2 kill`
- Restart deployment

### Verification Commands

```bash
# Check nginx configuration
sudo nginx -t

# Check PM2 status
pm2 status

# Check SSL certificate expiry
echo | openssl s_client -connect cenopie.com:443 2>/dev/null | openssl x509 -noout -dates

# Check Cloudflare IPs
dig cenopie.com A
```

## Security Best Practices

1. **Keep certificates secure**: Never share private keys
2. **Regular updates**: Keep nginx and system updated
3. **Monitor logs**: Check PM2 and nginx logs regularly
4. **Backup certificates**: Store certificates securely
5. **Use strong ciphers**: Current nginx config uses secure ciphers

## Support

If you encounter issues:

1. Check PM2 logs: `pm2 logs`
2. Check nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify Cloudflare settings in dashboard
4. Test from different networks/devices

## Certificate Renewal

Cloudflare Origin certificates are valid for 15 years and don't need manual renewal. However, if you need to renew:

1. Generate new certificate in Cloudflare dashboard
2. Replace files in `/etc/ssl/cloudflare/`
3. Reload nginx: `sudo systemctl reload nginx`