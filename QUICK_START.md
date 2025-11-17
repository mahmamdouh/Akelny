# 🚀 Akelny Quick Start Guide

## One-Command Deployment

```bash
cd /root/Akelny
chmod +x scripts/full-deployment.sh
./scripts/full-deployment.sh
```

This will:
1. ✅ Deploy backend services (API, Database, Redis)
2. ✅ Test all API endpoints
3. ✅ Build and verify mobile app
4. ✅ Provide next steps

---

## Manual Step-by-Step (If Automated Fails)

### 1. Deploy Backend (5 minutes)
```bash
cd /root/Akelny
chmod +x scripts/bulletproof-deploy.sh
./scripts/bulletproof-deploy.sh
```

**Verify:**
```bash
curl http://localhost:3001/health
```

### 2. Test Backend (2 minutes)
```bash
chmod +x scripts/test-backend.sh
./scripts/test-backend.sh
```

### 3. Setup Mobile App (5 minutes)
```bash
cd mobile
npm install
npm run type-check
npm start
```

### 4. Test on Device
1. Install **Expo Go** on your phone
2. Scan QR code from terminal
3. App should load on your device

---

## Quick Testing

### Test Backend API
```bash
# Health check
curl http://localhost:3001/health

# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123!",
    "country": "EG",
    "language": "en"
  }'
```

### Test Mobile App
1. Open Expo Go on phone
2. Scan QR code
3. Test these features:
   - Register/Login
   - Browse meals
   - Search ingredients
   - Add to pantry
   - Get meal suggestions

---

## Troubleshooting

### Backend won't start
```bash
# Check if ports are in use
sudo lsof -i :3001
sudo lsof -i :5433

# Restart services
docker-compose -p akelny restart

# View logs
docker-compose -p akelny logs -f backend
```

### Mobile app won't connect
1. Update API URL in `mobile/src/services/apiClient.ts`
2. Use your machine's IP address (not localhost)
3. Ensure backend is running: `curl http://localhost:3001/health`

### Build errors
```bash
# Backend
cd backend
rm -rf node_modules dist
npm install
npm run build

# Mobile
cd mobile
rm -rf node_modules
npm install
expo start -c
```

---

## Production Deployment

### Backend to Server
```bash
# On your server
git clone <your-repo>
cd Akelny
./scripts/bulletproof-deploy.sh
```

### Mobile to App Stores
```bash
cd mobile

# Install EAS CLI
npm install -g eas-cli

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

---

## Key URLs

- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health
- **Dashboard**: http://localhost:3001/dashboard
- **Database**: localhost:5433
- **Redis**: localhost:6380

---

## Support

For detailed instructions, see:
- `COMPLETE_DEPLOYMENT_PLAN.md` - Full deployment guide
- `FINAL_DEPLOYMENT_GUIDE.md` - Backend deployment details
- `docs/development/SETUP.md` - Development setup

---

**🎉 You're ready to go!**