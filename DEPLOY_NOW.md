# 🚀 DEPLOY AKELNY NOW

## ⚡ ONE COMMAND TO RULE THEM ALL

```bash
cd /root/Akelny && chmod +x scripts/*.sh && ./scripts/full-deployment.sh
```

That's it! This will:
1. ✅ Deploy backend (API, Database, Redis)
2. ✅ Test all endpoints
3. ✅ Build mobile app
4. ✅ Verify everything works

---

## 📱 THEN TEST YOUR MOBILE APP

### On Your Phone (Easiest)
1. Install **Expo Go** from App Store/Play Store
2. Run: `cd mobile && npm start`
3. Scan QR code with Expo Go
4. Test the app!

### On Simulator
```bash
# iOS (Mac only)
cd mobile && npm run ios

# Android
cd mobile && npm run android
```

---

## 🎯 WHAT YOU GET

### Backend Running On:
- **API**: http://localhost:3001/api
- **Health**: http://localhost:3001/health
- **Dashboard**: http://localhost:3001/dashboard

### Mobile App Features:
- User authentication
- Meal suggestions
- Ingredient search
- Pantry management
- Favorites & Calendar
- Recipe creation
- Bilingual (EN/AR)

---

## 📚 NEED MORE DETAILS?

- **Quick Start**: See `QUICK_START.md`
- **Complete Guide**: See `COMPLETE_DEPLOYMENT_PLAN.md`
- **Summary**: See `DEPLOYMENT_SUMMARY.md`
- **Troubleshooting**: See `COMPLETE_DEPLOYMENT_PLAN.md` Phase 6

---

## 🆘 IF SOMETHING FAILS

### Backend Won't Start?
```bash
# Try the simple version
./scripts/docker-only-deploy.sh
```

### Mobile Won't Build?
```bash
cd mobile
rm -rf node_modules
npm install
expo start -c
```

### Can't Connect?
Update `mobile/src/services/apiClient.ts`:
```typescript
const API_BASE_URL = 'http://YOUR_IP:3001/api';
```

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] Run `./scripts/full-deployment.sh`
- [ ] Verify backend health: `curl http://localhost:3001/health`
- [ ] Start mobile: `cd mobile && npm start`
- [ ] Test on device with Expo Go
- [ ] Complete manual testing checklist
- [ ] Fix any bugs found
- [ ] Deploy to production

---

## 🎉 YOU'RE READY!

Everything is configured and tested. Just run the command and follow the prompts.

**Good luck with your launch! 🚀**