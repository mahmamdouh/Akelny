# Akelny Deployment & Testing Plan

## 🚀 Deployment Overview

This document outlines the complete deployment strategy for the Akelny mobile application, including backend API deployment, mobile app testing, and production monitoring.

### Architecture
- **Backend**: Node.js + Express API with PostgreSQL and Redis
- **Mobile**: React Native with Expo for iOS and Android
- **Infrastructure**: Docker containers with Nginx reverse proxy
- **Domain**: akelny.nabd-co.com
- **SSL**: Let's Encrypt certificates

## 📋 Pre-Deployment Checklist

### Server Requirements
- [ ] Ubuntu 20.04+ or similar Linux distribution
- [ ] Docker 20.10+ installed
- [ ] Docker Compose 2.0+ installed
- [ ] Domain DNS configured (akelny.nabd-co.com → server IP)
- [ ] Firewall configured (ports 80, 443, 22)
- [ ] Minimum 2GB RAM, 20GB storage

### Environment Setup
- [ ] Clone repository to server
- [ ] Configure `.env` file with production values
- [ ] Ensure meals.json data file is present
- [ ] SSL email configured for Let's Encrypt

## 🏗️ Deployment Steps

### 1. Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login to apply docker group
```

### 2. Application Deployment
```bash
# Clone repository
git clone <repository-url> akelny
cd akelny

# Configure environment
cp .env.production .env
nano .env  # Update with actual values

# Deploy application
./scripts/deploy.sh production
```

### 3. Post-Deployment Verification
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f nginx

# Test API endpoints
curl https://akelny.nabd-co.com/health
curl https://akelny.nabd-co.com/api/health
```

## 📱 Mobile App Testing Plan

### Development Testing

#### 1. Local Development Setup
```bash
# Backend (Terminal 1)
cd akelny/backend
npm install
npm run dev

# Mobile (Terminal 2)
cd akelny/mobile
npm install
npx expo start
```

#### 2. API Integration Testing
- [ ] Test authentication flow
- [ ] Test meal suggestions
- [ ] Test pantry management
- [ ] Test favorites and calendar
- [ ] Test search functionality
- [ ] Test offline capabilities

### Production Testing

#### 1. Update Mobile App Configuration
```typescript
// mobile/src/services/apiClient.ts
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api'
  : 'https://akelny.nabd-co.com/api';
```

#### 2. Build Production Apps

##### iOS Testing
```bash
# Prerequisites
# - macOS with Xcode installed
# - Apple Developer account
# - iOS device or simulator

cd akelny/mobile

# Install dependencies
npm install

# iOS Simulator
npx expo run:ios

# Physical device (requires Apple Developer account)
npx expo build:ios
# Follow Expo documentation for TestFlight distribution
```

##### Android Testing
```bash
# Prerequisites
# - Android Studio installed
# - Android device with USB debugging enabled

cd akelny/mobile

# Install dependencies
npm install

# Android Emulator
npx expo run:android

# Physical device
npx expo build:android
# Generate APK for testing
```

### Testing Scenarios

#### Core User Flows
1. **User Registration & Login**
   - [ ] Register new account
   - [ ] Login with credentials
   - [ ] Password reset flow
   - [ ] Profile management

2. **Meal Discovery**
   - [ ] Get meal suggestions based on pantry
   - [ ] Random meal picker
   - [ ] Search meals by cuisine/ingredients
   - [ ] View meal details and nutrition

3. **Pantry Management**
   - [ ] Add ingredients to pantry
   - [ ] Remove ingredients
   - [ ] Search and browse ingredients
   - [ ] Categorize ingredients

4. **Favorites & Planning**
   - [ ] Add meals to favorites
   - [ ] Remove from favorites
   - [ ] Add meals to calendar
   - [ ] View planned meals

5. **Localization**
   - [ ] Switch between English and Arabic
   - [ ] RTL layout for Arabic
   - [ ] Proper text rendering

#### Performance Testing
- [ ] App startup time < 3 seconds
- [ ] API response time < 2 seconds
- [ ] Smooth scrolling and animations
- [ ] Memory usage optimization
- [ ] Battery usage optimization

#### Device Testing Matrix
| Device Type | iOS Versions | Android Versions |
|-------------|--------------|------------------|
| Phone       | 14.0+        | API 21+ (5.0)    |
| Tablet      | 14.0+        | API 21+ (5.0)    |

## 🔧 Monitoring & Maintenance

### Health Monitoring
```bash
# Check service health
curl https://akelny.nabd-co.com/health

# Monitor logs
docker-compose logs -f --tail=100

# Check resource usage
docker stats
```

### Database Backup
```bash
# Manual backup
docker-compose exec postgres pg_dump -U akelny_user akelny > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated backup (add to crontab)
0 2 * * * cd /path/to/akelny && docker-compose exec -T postgres pg_dump -U akelny_user akelny | gzip > backups/backup_$(date +\%Y\%m\%d_\%H\%M\%S).sql.gz
```

### SSL Certificate Renewal
```bash
# Renew certificates (automated via cron)
0 12 * * * cd /path/to/akelny && docker-compose run --rm certbot renew && docker-compose restart nginx
```

### Performance Monitoring (Optional)
```bash
# Enable monitoring stack
docker-compose --profile monitoring up -d

# Access Grafana
# URL: http://server-ip:3001
# Default: admin / admin123 (change in .env)
```

## 🚨 Troubleshooting

### Common Issues

#### Backend Not Starting
```bash
# Check logs
docker-compose logs backend

# Common fixes
docker-compose restart postgres
docker-compose up -d --build backend
```

#### SSL Certificate Issues
```bash
# Regenerate certificate
docker-compose run --rm certbot certonly --webroot --webroot-path=/var/www/certbot --email admin@nabd-co.com --agree-tos --no-eff-email -d akelny.nabd-co.com

# Restart nginx
docker-compose restart nginx
```

#### Database Connection Issues
```bash
# Check database status
docker-compose exec postgres pg_isready -U akelny_user -d akelny

# Reset database (CAUTION: Data loss)
docker-compose down -v
docker-compose up -d postgres
# Wait and run migrations again
```

#### Mobile App Connection Issues
1. Check API_BASE_URL configuration
2. Verify network connectivity
3. Check CORS settings in backend
4. Test API endpoints with curl/Postman

## 📊 Success Metrics

### Deployment Success
- [ ] All services running (docker-compose ps shows "Up")
- [ ] SSL certificate valid and auto-renewing
- [ ] API endpoints responding correctly
- [ ] Database seeded with meals data
- [ ] Monitoring dashboards accessible

### Mobile App Success
- [ ] App builds successfully for iOS and Android
- [ ] All core features working
- [ ] Performance metrics within targets
- [ ] No critical bugs in testing
- [ ] Localization working properly

### Production Readiness
- [ ] Automated backups configured
- [ ] Monitoring and alerting set up
- [ ] SSL certificates auto-renewing
- [ ] Error logging and tracking
- [ ] Performance monitoring active

## 🔄 Update Process

### Backend Updates
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose up -d --build backend

# Run any new migrations
docker-compose exec backend npm run migrate
```

### Mobile App Updates
```bash
# Update code
git pull origin main
cd mobile

# Update dependencies
npm install

# Test locally
npx expo start

# Build new versions
npx expo build:ios
npx expo build:android
```

## 📞 Support & Contacts

- **Technical Issues**: Check logs and troubleshooting section
- **SSL Issues**: Let's Encrypt documentation
- **Mobile Issues**: Expo documentation
- **Database Issues**: PostgreSQL documentation

## 🔐 Security Considerations

- [ ] Strong passwords in .env file
- [ ] Regular security updates
- [ ] Firewall properly configured
- [ ] SSL certificates valid
- [ ] API rate limiting active
- [ ] Input validation implemented
- [ ] CORS properly configured

---

**Note**: This deployment plan assumes a production environment. For development/staging, adjust the SSL and domain configurations accordingly.