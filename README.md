# Lianxin Platform - Hexagonal Architecture Implementation

A modern social media platform built with **Hexagonal Architecture** (Ports & Adapters) using Node.js, Express, and MySQL.

## 🏗️ Architecture Overview

This project implements **Hexagonal Architecture** with a **Modular Monolith** structure organized by **Bounded Contexts**. Each business domain is encapsulated in its own module with clear boundaries and contracts.

### Key Principles

- **Hexagonal/Ports & Adapters**: Core domain logic is isolated from infrastructure concerns
- **Dependency Injection**: All dependencies are injected via interfaces/contracts
- **Modular Monolith**: Each business domain is a self-contained module
- **Event-Driven Architecture**: Modules communicate via domain events
- **Contract-Based Design**: All adapters implement well-defined contracts

## 📁 Project Structure

```
src/
├── core/                           # Core domain layer
│   ├── domain/                     # Domain entities and business logic
│   │   ├── shared/                 # Shared domain concepts
│   │   │   ├── contracts/          # Domain service contracts
│   │   │   └── events/             # Domain events
│   │   └── user/                   # User bounded context
│   │       ├── contracts/          # User-specific contracts
│   │       └── entities/           # Domain entities
│   └── application/                # Application services layer
│       └── user/
│           └── services/           # Application services
├── infrastructure/                 # Infrastructure layer
│   ├── adapters/                   # Concrete implementations
│   │   ├── persistence/            # Database adapters
│   │   ├── cache/                  # Cache adapters
│   │   ├── encryption/             # Encryption adapters
│   │   ├── events/                 # Event adapters
│   │   └── external/               # External service adapters
│   ├── services/                   # Infrastructure services
│   └── config/                     # Configuration
└── modules/                        # Bounded context modules
    ├── user/                       # User module
    ├── location/                   # Location module
    ├── place/                      # Place module
    └── media/                      # Media module
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- Redis 6.0+

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lianxin-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Create database and run migrations
   npm run db:migrate
   ```

5. **Start Redis server**
   ```bash
   redis-server
   ```

### Running the Application

#### Development Mode (Hexagonal Architecture)
```bash
node server-hexagonal.js
```

#### Legacy Mode (for comparison)
```bash
node server.js
```

#### Using Docker
```bash
# Development
make dev

# Production
make prod
```

## 🔧 Configuration

The application uses environment variables for configuration. Key settings include:

- **Database**: MySQL connection settings
- **Redis**: Cache and session storage
- **JWT**: Token signing and validation
- **Encryption**: Data encryption keys
- **OTP**: SMS/OTP service configuration

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/v1/auth/register/request-otp` - Request registration OTP
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login/request-otp` - Request login OTP  
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout

### User Management Endpoints

- `GET /api/v1/users/me` - Get current user profile
- `GET /api/v1/users/:userId` - Get user profile by ID
- `PUT /api/v1/users/me` - Update user profile
- `POST /api/v1/users/me/change-password` - Change password

### Health Check Endpoints

- `GET /health` - Comprehensive health check
- `GET /ready` - Readiness probe
- `GET /live` - Liveness probe

## 🏛️ Architecture Components

### Domain Layer

**Entities**: Core business objects with behavior
- `User` - User aggregate with business rules
- `UserSession` - Session management
- `UserProfile` - Profile information with privacy controls

**Contracts**: Define interfaces for external dependencies
- `UserRepository` - User data persistence
- `CacheService` - Caching operations
- `EncryptionService` - Data encryption/decryption

### Application Layer

**Application Services**: Orchestrate use cases
- `AuthenticationApplicationService` - Authentication flows
- `UserApplicationService` - User management operations

### Infrastructure Layer

**Adapters**: Concrete implementations of contracts
- `UserMySQLAdapter` - MySQL user repository
- `RedisCacheAdapter` - Redis caching
- `CryptoEncryptionAdapter` - Node.js crypto encryption

### Module Layer

**Modules**: Self-contained bounded contexts
- `UserModule` - Authentication and user management
- `LocationModule` - Location services
- `PlaceModule` - Place management
- `MediaModule` - File upload and processing

## 🔒 Security Features

- **JWT Authentication** with access/refresh tokens
- **Data Encryption** for sensitive user information
- **Password Hashing** with bcrypt
- **Rate Limiting** on API endpoints
- **Input Validation** with express-validator
- **CORS Protection** with configurable origins
- **Helmet Security** headers

## 🧪 Testing

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### Contract Tests
```bash
npm run test:contracts
```

## 📊 Monitoring & Health Checks

The application provides comprehensive health monitoring:

- **Module Health**: Individual module status
- **Database Health**: Connection and query performance
- **Cache Health**: Redis connectivity and performance
- **Dependency Health**: All injected dependencies

Access health information at:
- `GET /health` - Full system health
- `GET /api/v1/user/health` - User module health
- `GET /api/v1/location/health` - Location module health

## 🔄 Event-Driven Architecture

The system uses domain events for loose coupling:

### User Events
- `UserRegistered` - New user registration
- `UserLoggedIn` - Successful login
- `UserAccountLocked` - Account locked due to failed attempts
- `UserSuspended` - Account suspended by admin

### Session Events
- `SessionRevoked` - Session terminated
- `SessionRefreshTokenUpdated` - Token refreshed

## 🚀 Deployment

### Docker Deployment
```bash
# Build image
docker build -t lianxin-platform .

# Run with docker-compose
docker-compose up -d
```

### Environment Variables
```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=lianxin
DB_USER=root
DB_PASS=password
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
ENCRYPTION_MASTER_KEY=your-encryption-key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Hexagonal Architecture pattern by Alistair Cockburn
- Domain-Driven Design principles by Eric Evans
- Clean Architecture concepts by Robert C. Martin