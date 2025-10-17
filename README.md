# Akelny (أكلني) - Smart Meal Suggestion App

Akelny is a bilingual mobile application that helps users discover and plan meals based on available ingredients, dietary preferences, and cultural kitchen choices.

## 🌟 Features

- **Smart Meal Suggestions**: Get personalized meal recommendations based on your pantry ingredients
- **Bilingual Support**: Full English and Arabic support with RTL layout
- **Cultural Diversity**: Recipes from Egyptian, Gulf, Asian, Indian, European, and Mexican cuisines
- **Pantry Management**: Track your ingredients and their availability
- **Meal Planning**: Calendar integration for meal planning
- **Favorites**: Save and organize your favorite recipes
- **Search & Discovery**: Find meals by cuisine, ingredients, or dietary preferences

## 🏗️ Architecture

### Backend
- **Node.js + Express**: RESTful API server
- **PostgreSQL**: Primary database for structured data
- **Redis**: Caching and session management
- **JWT**: Authentication and authorization

### Mobile App
- **React Native + Expo**: Cross-platform mobile development
- **TypeScript**: Type safety and better developer experience
- **Redux Toolkit**: State management with RTK Query
- **i18next**: Internationalization with RTL support

### Infrastructure
- **Docker**: Containerized deployment
- **Nginx**: Reverse proxy and SSL termination
- **Let's Encrypt**: SSL certificates

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Git

### Backend Setup
```bash
# Clone repository
git clone <repository-url> akelny
cd akelny

# Deploy with Docker
cp .env.production .env
# Edit .env with your configuration
./scripts/deploy.sh production
```

### Mobile App Setup
```bash
# Navigate to mobile directory
cd mobile

# Setup for production
node scripts/setup-production.js

# Install dependencies
npm install

# Start development server
npx expo start
```

## 📱 Mobile App Testing

### iOS Testing
```bash
# iOS Simulator
npx expo run:ios

# Physical device
# Scan QR code with Camera app or Expo Go
```

### Android Testing
```bash
# Android Emulator
npx expo run:android

# Physical device
# Scan QR code with Expo Go app
```

### Production Testing
```bash
# Run comprehensive tests
./scripts/test-production.sh
```

## 🌐 Deployment

### Production Deployment
1. **Server Setup**: Ubuntu 20.04+ with Docker installed
2. **Domain Configuration**: Point `akelny.nabd-co.com` to your server
3. **Environment Setup**: Configure `.env` file with production values
4. **Deploy**: Run `./scripts/deploy.sh production`

### Services
- **API**: https://akelny.nabd-co.com/api
- **Health Check**: https://akelny.nabd-co.com/health
- **Monitoring**: http://server-ip:3001 (Grafana, optional)

## 📊 Database

The application uses a comprehensive meals database with:
- **22,000+ recipes** from various cuisines
- **Nutritional information** for each meal
- **Ingredient relationships** with status indicators
- **Multilingual content** (English/Arabic)

### Data Seeding
```bash
# Seed meals data (automatically done during deployment)
docker-compose exec backend npm run seed:meals
```

## 🔧 Development

### Backend Development
```bash
cd backend
npm install
npm run dev
```

### Mobile Development
```bash
cd mobile
npm install
npx expo start
```

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Mobile tests
cd mobile
npm test
```

## 📚 Documentation

- [Deployment Plan](docs/DEPLOYMENT_PLAN.md) - Complete deployment guide
- [Testing Checklist](docs/TESTING_CHECKLIST.md) - Comprehensive testing guide
- [Integration Summary](docs/INTEGRATION_SUMMARY.md) - System integration details
- [Setup Guide](docs/development/SETUP.md) - Development setup instructions

## 🔒 Security

- JWT-based authentication
- HTTPS/SSL encryption
- Input validation and sanitization
- Rate limiting
- CORS configuration
- Secure password hashing

## 🌍 Localization

- **English**: Full LTR support
- **Arabic**: Full RTL support with proper text rendering
- **Dynamic switching**: Change language without app restart
- **Cultural adaptation**: Cuisine names and descriptions in both languages

## 📈 Monitoring

Optional monitoring stack includes:
- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboards
- **Health checks**: Automated service monitoring
- **Log aggregation**: Centralized logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Common Issues
- **API Connection**: Check API_BASE_URL in mobile app
- **SSL Issues**: Verify domain DNS and certificate
- **Database Issues**: Check PostgreSQL connection and seeding

### Getting Help
1. Check the documentation in `/docs`
2. Review the troubleshooting section in deployment plan
3. Check service logs: `docker-compose logs [service]`

## 🎯 Roadmap

- [ ] Push notifications
- [ ] Social sharing features
- [ ] Recipe ratings and reviews
- [ ] Shopping list generation
- [ ] Nutritional goal tracking
- [ ] Voice search
- [ ] Offline mode improvements

---

**Akelny** - Making meal planning delicious and effortless! 🍽️