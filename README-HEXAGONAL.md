# Lianxin Platform - Hexagonal Architecture

This document describes the Modular Monolith architecture implementation using Hexagonal/Ports & Adapters pattern for the Lianxin social media platform.

## Architecture Overview

The platform follows **Hexagonal Architecture** (also known as Ports & Adapters) with a **Modular Monolith** structure organized by **Bounded Contexts**. Each module is completely self-contained with its own database, making it microservice-ready.

### Key Principles

1. **Hexagonal/Ports & Adapters**: Core domain logic is isolated from infrastructure concerns
2. **Dependency Injection**: All dependencies are injected via interfaces/contracts
3. **Modular Monolith**: Each business domain is a completely self-contained module with its own database
4. **Event-Driven Architecture**: Modules communicate via domain events for async side-effects
5. **Contract-Based Design**: All adapters implement well-defined contracts
6. **Database per Module**: Each module has its own dedicated database for true isolation
7. **Module Bootstrap**: Each module manages its own lifecycle and dependencies

## Directory Structure

```
src/
├── core/                           # Core domain layer
│   ├── domain/                     # Domain entities and business logic
│   │   ├── shared/                 # Shared domain concepts
│   │   │   ├── contracts/          # Domain service contracts
│   │   │   │   ├── Repository.js   # Base repository contract
│   │   │   │   ├── CacheService.js # Cache service contract
│   │   │   │   ├── EncryptionService.js # Encryption contract
│   │   │   │   ├── EventPublisher.js # Event publishing contract
│   │   │   │   └── ModuleContract.js # Module lifecycle contract
│   │   │   └── events/
│   │   │       └── DomainEvent.js
│   │   └── user/                   # User bounded context
│   │       ├── contracts/          # User-specific contracts
│   │       │   ├── UserRepository.js # User repository contract
│   │       │   ├── SessionRepository.js # Session repository contract
│   │       │   ├── OtpService.js   # OTP service contract
│   │       │   ├── PasswordService.js # Password service contract
│   │       │   ├── PhoneService.js # Phone service contract
│   │       │   └── JwtService.js   # JWT service contract
│   │       └── entities/           # Domain entities
│   │           ├── User.js
│   │           ├── UserSession.js
│   │           └── UserProfile.js
│   └── application/                # Application services layer
│       └── user/
│           └── services/
│               ├── AuthenticationApplicationService.js
│               └── UserApplicationService.js
├── infrastructure/                 # Infrastructure layer
│   ├── adapters/                   # Concrete implementations
│   │   ├── cache/                  # Cache adapters
│   │   │   └── RedisCacheAdapter.js
│   │   ├── encryption/             # Encryption adapters
│   │   │   └── CryptoEncryptionAdapter.js
│   │   ├── events/                 # Event adapters
│   │   │   └── InMemoryEventAdapter.js
│   │   └── external/               # External service adapters
│   │       └── MockOtpAdapter.js
│   ├── services/                   # Infrastructure services
│   │   ├── PasswordServiceImpl.js
│   │   ├── PhoneServiceImpl.js
│   │   └── JwtServiceImpl.js
│   └── config/                     # Configuration
│       └── DependencyContainer.js  # Dependency injection container
└── modules/                        # Bounded context modules
    ├── user/                       # User module
    │   ├── infrastructure/         # User module infrastructure
    │   │   └── persistence/        # User module persistence
    │   │       ├── db.config.js    # User database configuration
    │   │       ├── models/         # User database models
    │   │       │   ├── index.js    # Database initialization
    │   │       │   ├── User.js     # User model
    │   │       │   ├── UserSession.js # Session model
    │   │       │   └── UserProfile.js # Profile model
    │   │       ├── UserMySQLAdapter.js # User repository adapter
    │   │       └── SessionMySQLAdapter.js # Session repository adapter
    │   ├── controllers/
    │   │   ├── AuthController.js
    │   │   ├── UserController.js
    │   │   ├── SessionController.js
    │   │   └── SettingsController.js
    │   ├── middleware/
    │   │   ├── AuthenticationMiddleware.js
    │   │   └── ValidationMiddleware.js
    │   └── UserModuleBootstrap.js  # User module bootstrap
    ├── location/                   # Location module
    │   └── LocationModuleBootstrap.js # Location module bootstrap
    ├── place/                      # Place module
    │   ├── infrastructure/         # Place module infrastructure
    │   │   └── persistence/        # Place module persistence
    │   │       ├── db.config.js    # Place database configuration
    │   │       ├── models/         # Place database models
    │   │       │   ├── index.js    # Database initialization
    │   │       │   └── Place.js    # Place model
    │   │       └── PlaceMySQLAdapter.js # Place repository adapter
    │   └── PlaceModuleBootstrap.js # Place module bootstrap
    └── media/                      # Media module
        └── MediaModuleBootstrap.js # Media module bootstrap
```

## Core Concepts

### 1. Ports (Contracts/Interfaces)

Ports define the contracts that adapters must implement:

- **Repository Contracts**: Define data persistence operations
- **Service Contracts**: Define business service operations
- **Cache Contracts**: Define caching operations
- **Event Contracts**: Define event publishing operations
- **Module Contracts**: Define module lifecycle operations

### 2. Adapters (Implementations)

Adapters provide concrete implementations of the ports:

- **Persistence Adapters**: Module-specific MySQL implementations
- **Cache Adapters**: Redis, Memcached implementations
- **Event Adapters**: In-memory, Redis Pub/Sub, RabbitMQ implementations
- **External Service Adapters**: SMS, Email, Payment gateway implementations

### 3. Domain Entities

Pure business logic with no infrastructure dependencies:

- **User**: Core user business logic and rules
- **UserSession**: Session management and validation
- **UserProfile**: Profile data and privacy controls

### 4. Application Services

Orchestrate use cases using domain entities and contracts:

- **AuthenticationApplicationService**: Handles auth flows
- **UserApplicationService**: Handles user management flows

### 5. Modules (Bounded Contexts)

Self-contained business domains:

- **User Module**: Authentication, profiles, sessions (with dedicated user database)
- **Location Module**: Geocoding, location services
- **Place Module**: Place management, reviews (with dedicated place database)
- **Media Module**: File uploads, image processing

### 6. **Module Bootstraps**

Each module has its own bootstrap class that manages:

- **Database Initialization**: Module-specific database connection and models
- **Dependency Injection**: Module-specific dependency container
- **Controller/Middleware Setup**: Module-specific request handling
- **Route Configuration**: Module-specific API endpoints
- **Health Monitoring**: Module-specific health checks
- **Lifecycle Management**: Module initialization and shutdown

## Database Architecture

Each module that requires persistence has its own dedicated database:

- **User Module**: `lianxin_user_db` - Contains users, sessions, profiles
- **Place Module**: `lianxin_place_db` - Contains places, reviews, categories
- **Media Module**: No database (uses external storage)
- **Location Module**: No database (uses external geocoding APIs)

### Database Configuration

Each module with a database has its own `db.config.js`:

```javascript
// src/modules/user/infrastructure/persistence/db.config.js
module.exports = {
  development: {
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'password',
    database: 'lianxin_user_db',
    dialect: 'mysql'
  }
};
```

### Database Initialization

Each module initializes its own database:

```javascript
// src/modules/user/infrastructure/persistence/models/index.js
class UserDatabaseSetup {
  async initialize() {
    this.sequelize = new Sequelize(config);
    this.models.User = require('./User')(this.sequelize);
    this.models.UserSession = require('./UserSession')(this.sequelize);
    // ... define associations and sync
  }
}
```

## Dependency Injection

Each module has its own `DependencyContainer` for module-specific dependencies, while shared services are provided via a global container.

## Event-Driven Communication

Modules communicate via domain events for async side-effects:

```javascript
// Domain entity publishes event
const loginEvent = user.recordSuccessfulLogin(ipAddress);
user.addDomainEvent(loginEvent);

// Application service publishes to event bus
await this.eventPublisher.publish(loginEvent);

// Other modules subscribe to events
await eventPublisher.subscribe('UserLoggedIn', async (event) => {
  // Handle side effects like analytics, notifications
});
```

## Benefits

### 1. **Testability**
- Easy to mock dependencies via contracts
- Domain logic can be tested in isolation
- Infrastructure can be tested separately

### 2. **Flexibility**
- Easy to swap implementations (MySQL → PostgreSQL)
- Easy to add new adapters (Redis → Memcached)
- Easy to change external services

### 3. **Maintainability**
- Clear separation of concerns
- Dependencies flow inward toward domain
- Infrastructure changes don't affect business logic

### 4. **Scalability**
- Modules can be extracted to microservices
- Clear boundaries between contexts
- Event-driven communication enables async processing

## Running the Application

### Development Mode

```bash
# Start with modular monolith architecture
node server-hexagonal.js
```

### Docker Mode

```bash
# Development environment
make dev

# Production environment
make prod
```

### Database Setup

Each module's database needs to be created:

```sql
-- Create databases for each module
CREATE DATABASE lianxin_user_db;
CREATE DATABASE lianxin_place_db;
```

## Module Communication

### Synchronous Communication
Core business flows (login, registration, session refresh) remain synchronous for consistency and immediate feedback.

### Asynchronous Communication
Side effects and cross-module communication happen via events:

- User registration → Send welcome email
- User login → Update analytics
- Profile update → Invalidate caches
- Account suspension → Send notifications

## Testing Strategy

### Unit Tests
Test domain entities and application services in isolation:

```javascript
// Test domain entity
const user = User.create({ phone: '+8613800138000', ... });
const loginEvent = user.recordSuccessfulLogin('192.168.1.1');
expect(loginEvent.getType()).toBe('UserLoggedIn');

// Test application service with mocks
const mockUserRepo = new MockUserRepository();
const authService = new AuthenticationApplicationService({
  userRepository: mockUserRepo,
  // ... other mocked dependencies
});
```

### Integration Tests
Test module bootstraps and adapters against real infrastructure:

```javascript
// Test module bootstrap
const userBootstrap = new UserModuleBootstrap();
await userBootstrap.initialize(globalContainer);
expect(userBootstrap.isInitialized).toBe(true);
```

### Contract Tests
Ensure adapters implement contracts correctly:

```javascript
// Test that adapter implements contract
const adapter = new UserMySQLAdapter(...);
expect(adapter).toBeInstanceOf(UserRepository);
```

## Microservice Extraction

Each module is designed to be easily extracted as a microservice:

### 1. **Extract Module**
Copy the entire module directory to a new service:

```bash
# Extract user module as microservice
cp -r src/modules/user/ ../user-microservice/
cp -r src/core/domain/user/ ../user-microservice/src/domain/
cp -r src/core/application/user/ ../user-microservice/src/application/
```

### 2. **Create Microservice Server**
Create a new server file that only initializes the extracted module:

```javascript
// user-microservice/server.js
const UserModuleBootstrap = require('./UserModuleBootstrap');

const userBootstrap = new UserModuleBootstrap();
await userBootstrap.initialize(globalContainer);
app.use('/api/v1', userBootstrap.getRouter());
```

### 3. **Update Database Connection**
The module already has its own database configuration, so no changes needed.

### 4. **Replace with HTTP Client**
In the main application, replace the module with an HTTP client that calls the microservice.

## Future Enhancements

### 1. **Microservices Extraction**
Each module is ready for microservice extraction with minimal changes.

### 2. **Database Migration Tools**
Add module-specific migration tools:

```bash
npm run db:migrate:user    # Migrate user database
npm run db:migrate:place   # Migrate place database
```

### 3. **Inter-Module Communication**
Implement HTTP-based communication for microservice readiness:

```javascript
// Replace direct module calls with HTTP clients
const userServiceClient = new UserServiceClient('http://user-service:3001');
```

### 4. **Service Discovery**
Add service discovery for microservice deployment:

```javascript
// Service registry integration
const serviceRegistry = new ServiceRegistry();
await serviceRegistry.register('user-service', { host, port });
```

This modular monolith architecture provides a solid foundation for building scalable, maintainable, and testable applications while maintaining the flexibility to extract modules as microservices when needed.