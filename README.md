# Lianxin Platform - Hexagonal Architecture Implementation

A modern social media platform built with **Modular Monolith** using **Hexagonal Architecture** (Ports & Adapters) pattern with Node.js, Express, and MySQL.

## 🏗️ Architecture Overview

This project implements a **Modular Monolith** using **Hexagonal Architecture** (Ports & Adapters) pattern organized by **Bounded Contexts**. Each business domain is completely self-contained with its own database, making it microservice-ready.

### Key Principles

- **Hexagonal/Ports & Adapters**: Core domain logic is isolated from infrastructure concerns
- **Dependency Injection**: All dependencies are injected via interfaces/contracts
- **Modular Monolith**: Each business domain is a completely self-contained module with its own database
- **Event-Driven Architecture**: Modules communicate via domain events
- **Contract-Based Design**: All adapters implement well-defined contracts
- **Database per Module**: Each module has its own dedicated database for true isolation
- **Module Bootstrap**: Each module manages its own lifecycle and dependencies

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
│   │   ├── cache/                  # Cache adapters
│   │   ├── encryption/             # Encryption adapters
│   │   ├── events/                 # Event adapters
│   │   └── external/               # External service adapters
│   ├── services/                   # Infrastructure services
│   └── config/                     # Configuration
└── modules/                        # Bounded context modules
    ├── user/                       # User module
     │   ├── infrastructure/         # User module infrastructure
     │   │   └── persistence/        # User module persistence
     │   │       ├── db.config.js    # User database configuration
     │   │       ├── models/         # User database models
     │   │       ├── UserMySQLAdapter.js # User repository adapter
     │   │       └── SessionMySQLAdapter.js # Session repository adapter
     │   ├── controllers/            # User controllers
     │   ├── middleware/             # User middleware
     │   └── UserModuleBootstrap.js  # User module bootstrap
    ├── location/                   # Location module
     │   └── LocationModuleBootstrap.js # Location module bootstrap
    ├── place/                      # Place module
     │   ├── infrastructure/         # Place module infrastructure
     │   │   └── persistence/        # Place module persistence
     │   │       ├── db.config.js    # Place database configuration
     │   │       ├── models/         # Place database models
     │   │       └── PlaceMySQLAdapter.js # Place repository adapter
     │   └── PlaceModuleBootstrap.js # Place module bootstrap
    └── media/                      # Media module
         └── MediaModuleBootstrap.js # Media module bootstrap
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

4. **Set up the databases**
   ```bash
   # Create databases for each module
   mysql -u root -p -e "CREATE DATABASE lianxin_user_db;"
   mysql -u root -p -e "CREATE DATABASE lianxin_place_db;"
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

#### Using Docker
```bash
# Development
make dev

# Production
make prod
```

## 🔧 Configuration

### Global Configuration

Shared configuration is managed in `shared/config/security.config.js`:

- **Database**: MySQL connection settings
- **Redis**: Cache and session storage
- **JWT**: Token signing and validation
- **Encryption**: Data encryption keys
- **OTP**: SMS/OTP service configuration

### Module-Specific Configuration

Each module with a database has its own `db.config.js`:

- **User Module**: `src/modules/user/infrastructure/persistence/db.config.js`
- **Place Module**: `src/modules/place/infrastructure/persistence/db.config.js`

This allows each module to:
- Connect to its own dedicated database
- Use different database servers if needed
- Be easily extracted as a microservice

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

### Module Health Endpoints

- `GET /api/v1/user/health` - User module health
- `GET /api/v1/place/health` - Place module health

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
- `RedisCacheAdapter` - Redis caching
- `CryptoEncryptionAdapter` - Node.js crypto encryption
- `InMemoryEventAdapter` - In-memory event publishing

### Module Infrastructure

Each module has its own infrastructure layer:
- `UserMySQLAdapter` - MySQL user repository (in user module)
- `SessionMySQLAdapter` - MySQL session repository (in user module)
- `PlaceMySQLAdapter` - MySQL place repository (in place module)

### Module Bootstraps

Each module has its own bootstrap class:
- `UserModuleBootstrap` - User module lifecycle management
- `RedisCacheAdapter` - Redis caching
- `CryptoEncryptionAdapter` - Node.js crypto encryption

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

### Module-Specific Tests
```bash
npm run test:user     # Test user module
npm run test:place    # Test place module
```

## 📊 Monitoring & Health Checks

The application provides comprehensive health monitoring:

- **Module Health**: Individual module status
- **Database Health**: Connection and query performance
- **Cache Health**: Redis connectivity and performance
- **Shared Services Health**: Global dependency status

Access health information at:
- `GET /health` - Full system health
- `GET /api/v1/user/health` - User module health
- `GET /api/v1/place/health` - Place module health

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

## 🚀 Microservice Extraction

Each module is designed to be easily extracted as a microservice:

1. **Copy Module**: Copy the entire module directory
2. **Extract Dependencies**: Copy related domain and application layers
3. **Create Microservice Server**: Create a new server that only initializes the module
4. **Database**: Module already has its own database configuration
5. **Replace with HTTP Client**: Replace module calls with HTTP requests

The modular design ensures minimal changes are needed for microservice extraction.

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

# Database settings (shared host, different databases per module)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=password

# Shared services
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

### Module Development

When adding a new module:
1. Create module directory under `src/modules/`
2. Create module bootstrap class
3. Add database configuration if needed
4. Register module in `server-hexagonal.js`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Hexagonal Architecture pattern by Alistair Cockburn
- Domain-Driven Design principles by Eric Evans
- Clean Architecture concepts by Robert C. Martin
- Modular Monolith patterns by Simon Brown