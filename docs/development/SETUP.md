# Development Setup Guide

## Prerequisites

Before setting up the Akelny development environment, ensure you have the following installed:

### Required Software

1. **Node.js** (v18 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **PostgreSQL** (v13 or higher)
   - Download from [postgresql.org](https://www.postgresql.org/download/)
   - Create a database named `akelny_dev`
   - Note your connection details (host, port, username, password)

3. **Redis** (v6 or higher)
   - Download from [redis.io](https://redis.io/download)
   - Or use Docker: `docker run -d -p 6379:6379 redis:alpine`

4. **Expo CLI** (for mobile development)
   - Install globally: `npm install -g @expo/cli`

### Optional Tools

- **Docker** (for containerized databases)
- **Postman** or **Insomnia** (for API testing)
- **VS Code** with recommended extensions:
  - TypeScript and JavaScript Language Features
  - ESLint
  - Prettier
  - React Native Tools

## Quick Setup

1. **Clone and setup the project:**
   ```bash
   git clone <repository-url>
   cd akelny
   npm run setup
   ```

2. **Configure environment variables:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your database and Redis configuration
   ```

3. **Run database migrations:**
   ```bash
   cd backend
   npm run migrate
   ```

4. **Start development servers:**
   ```bash
   # From project root
   npm run dev
   ```

## Manual Setup

If you prefer to set up manually:

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install mobile dependencies
cd mobile && npm install && cd ..

# Install backend dependencies
cd backend && npm install && cd ..

# Install shared dependencies
cd shared && npm install && npm run build && cd ..
```

### 2. Environment Configuration

Create `backend/.env` from the example:

```bash
cd backend
cp .env.example .env
```

Update the `.env` file with your configuration:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=akelny_dev
DB_USER=your_username
DB_PASSWORD=your_password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration
JWT_SECRET=your_very_secure_secret_key_here
JWT_REFRESH_SECRET=your_very_secure_refresh_secret_key_here
```

### 3. Database Setup

```bash
cd backend

# Run migrations to create tables
npm run migrate

# (Optional) Seed with initial data
npm run seed
```

### 4. Start Development

```bash
# Start both mobile and backend (from project root)
npm run dev

# Or start individually:
npm run dev:mobile   # Mobile app only
npm run dev:backend  # Backend API only
```

## Development Workflow

### Mobile Development

The mobile app runs on Expo. After starting with `npm run dev:mobile`:

1. Install Expo Go app on your phone
2. Scan the QR code displayed in terminal
3. Or press `i` for iOS simulator, `a` for Android emulator

### Backend Development

The backend API runs on `http://localhost:3000` by default.

- Health check: `GET http://localhost:3000/health`
- API base: `http://localhost:3000/api`

### Database Operations

```bash
cd backend

# Create new migration
npm run migrate:create add_new_table

# Run migrations
npm run migrate

# Rollback last migration
npm run migrate:down

# Reset database (careful!)
npm run db:reset
```

### Testing

```bash
# Run all tests
npm test

# Run backend tests only
npm run test:backend

# Run mobile tests only
npm run test:mobile

# Run tests in watch mode
cd backend && npm run test:watch
```

### Code Quality

```bash
# Run linting
npm run lint

# Run type checking
cd mobile && npm run type-check
cd backend && tsc --noEmit
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Backend: Change `PORT` in `backend/.env`
   - Mobile: Expo will automatically find available port

2. **Database connection failed**
   - Verify PostgreSQL is running
   - Check connection details in `backend/.env`
   - Ensure database `akelny_dev` exists

3. **Redis connection failed**
   - Verify Redis is running: `redis-cli ping`
   - Check Redis configuration in `backend/.env`

4. **Module not found errors**
   - Run `npm run install:all` to reinstall dependencies
   - Rebuild shared package: `cd shared && npm run build`

### Getting Help

- Check the logs in terminal for detailed error messages
- Verify all prerequisites are installed and running
- Ensure environment variables are correctly configured
- Try restarting the development servers

## Project Structure

```
akelny/
├── mobile/          # React Native Expo app
├── backend/         # Node.js Express API
├── shared/          # Shared TypeScript types
├── docs/            # Documentation
└── scripts/         # Setup and utility scripts
```

For detailed information about each component, see the respective README files in each directory.