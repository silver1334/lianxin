const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const { v4: uuidv4 } = require("uuid");

// Configuration
const securityConfig = require("./shared/config/security.config");
const logger = require("./shared/utils/logger.util");
const ApiResponse = require("./shared/utils/api.response");

// Dependency Container for shared services
const DependencyContainer = require("./src/infrastructure/config/DependencyContainer");

// Shared Infrastructure Adapters
const RedisCacheAdapter = require("./src/infrastructure/adapters/cache/RedisCacheAdapter");
const CryptoEncryptionAdapter = require("./src/infrastructure/adapters/encryption/CryptoEncryptionAdapter");
const InMemoryEventAdapter = require("./src/infrastructure/adapters/events/InMemoryEventAdapter");

// Module Bootstraps
const UserModuleBootstrap = require("./src/modules/user/UserModuleBootstrap");
const MediaModuleBootstrap = require("./src/modules/media/MediaModuleBootstrap");
const LocationModuleBootstrap = require("./src/modules/location/LocationModuleBootstrap");
const PlaceModuleBootstrap = require("./src/modules/place/PlaceModuleBootstrap");

// Legacy Redis client for backward compatibility
const redisClient = require("./shared/libraries/cache/redis.client");

/**
 * Hexagonal Architecture Application
 * Main application using Ports & Adapters pattern with modular monolith
 */
class HexagonalApp {
  constructor() {
    this.app = express();
    this.port = securityConfig.app.port;
    this.app.set("trust proxy", 1);

    // Global container for shared services
    this.globalContainer = new DependencyContainer();
    
    // Module bootstraps
    this.moduleBootstraps = [];
    this.userModuleBootstrap = new UserModuleBootstrap();
    this.mediaModuleBootstrap = new MediaModuleBootstrap();
    this.locationModuleBootstrap = new LocationModuleBootstrap();
    this.placeModuleBootstrap = new PlaceModuleBootstrap();
    
    this.moduleBootstraps = [
      this.userModuleBootstrap,
      this.mediaModuleBootstrap,
      this.locationModuleBootstrap,
      this.placeModuleBootstrap
    ];

    this.setupBasicMiddleware();
  }

  setupBasicMiddleware() {
    // Request ID middleware
    this.app.use((req, res, next) => {
      req.requestId = req.headers["x-request-id"] || uuidv4();
      req.startTime = Date.now();
      next();
    });

    // Security middleware
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
          },
        },
        crossOriginEmbedderPolicy: false,
      })
    );

    // CORS configuration
    this.app.use(
      cors({
        origin: securityConfig.cors.origin,
        credentials: true,
        optionsSuccessStatus: 200,
        methods: securityConfig.cors.methods,
        allowedHeaders: securityConfig.cors.allowedHeaders,
      })
    );

    // Body parsing middleware
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Compression middleware
    this.app.use(compression());

    // Request logging middleware
    this.app.use((req, res, next) => {
      logger.info("Incoming request", {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        userAgent: req.get("User-Agent"),
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });

      next();
    });
  }

  /**
   * Initialize shared infrastructure and modules
   */
  async initializeArchitecture() {
    try {
      logger.info("Initializing Modular Monolith Architecture...");

      // Initialize Redis connection
      await redisClient.connect();
      if (!redisClient.isReady()) {
        throw new Error("Redis connection failed");
      }

      // Initialize shared infrastructure
      await this._initializeSharedInfrastructure();

      // Initialize all modules
      for (const moduleBootstrap of this.moduleBootstraps) {
        await moduleBootstrap.initialize(this.globalContainer);
      }

      logger.info("Modular Monolith Architecture initialized successfully", {
        modules: this.moduleBootstraps.map(m => m.name),
        sharedServices: this.globalContainer.getDependencyInfo(),
      });

    } catch (error) {
      logger.error("Modular Monolith Architecture initialization failed", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Initialize shared infrastructure services
   */
  async _initializeSharedInfrastructure() {
    // Register shared configuration and clients
    this.globalContainer
      .registerInstance('config', securityConfig)
      .registerInstance('redisClient', redisClient);

    // Register shared adapters
    this.globalContainer
      .registerSingleton('cacheService', async (container) => {
        const redis = await container.resolve('redisClient');
        const config = await container.resolve('config');
        return new RedisCacheAdapter(redis, config);
      })

      .registerSingleton('encryptionService', async (container) => {
        const config = await container.resolve('config');
        return new CryptoEncryptionAdapter(config);
      })

      .registerSingleton('eventPublisher', async (container) => {
        const eventAdapter = new InMemoryEventAdapter();
        eventAdapter.setupDefaultHandlers();
        return eventAdapter;
      });

    logger.info("Shared infrastructure initialized");
  }

  /**
   * Setup application routes using modules
   */
  setupRoutes() {
    // Health check endpoints
    this.setupHealthRoutes();

    // Mount module routes
    for (const moduleBootstrap of this.moduleBootstraps) {
      this.app.use("/api/v1", moduleBootstrap.getRouter());
    }

    // 404 handler
    this.app.use("*", (req, res) => {
      ApiResponse.notFound(`Route ${req.method} ${req.originalUrl} not found`)
        .setRequestId(req.requestId)
        .send(res);
    });

    // Error handling middleware
    this.app.use(this.errorHandler.bind(this));
  }

  /**
   * Setup health check routes
   */
  setupHealthRoutes() {
    // Comprehensive health check
    this.app.get("/health", async (req, res) => {
      try {
        const moduleHealthPromises = this.moduleBootstraps.map(async (moduleBootstrap) => {
          return {
            name: moduleBootstrap.name,
            health: await moduleBootstrap.getHealthStatus()
          };
        });

        const moduleHealthResults = await Promise.all(moduleHealthPromises);
        const moduleHealth = {};
        
        for (const result of moduleHealthResults) {
          moduleHealth[result.name] = result.health;
        }

        const overallHealthy = Object.values(moduleHealth).every(
          health => health.status === 'healthy'
        );

        const statusCode = overallHealthy ? 200 : 503;

        ApiResponse.healthCheck(moduleHealth)
          .addMetadata("architecture", "modular-monolith")
          .addMetadata("sharedServices", this.globalContainer.getDependencyInfo())
          .setStatusCode(statusCode)
          .setRequestId(req.requestId)
          .send(res);

      } catch (error) {
        logger.error("Health check failed", { error: error.message });
        ApiResponse.serviceUnavailable("Health check failed")
          .setRequestId(req.requestId)
          .send(res);
      }
    });

    // Readiness probe
    this.app.get("/ready", async (req, res) => {
      try {
        const moduleHealthPromises = this.moduleBootstraps.map(async (moduleBootstrap) => {
          return {
            name: moduleBootstrap.name,
            health: await moduleBootstrap.getHealthStatus()
          };
        });

        const moduleHealthResults = await Promise.all(moduleHealthPromises);
        const moduleHealth = {};
        
        for (const result of moduleHealthResults) {
          moduleHealth[result.name] = result.health;
        }

        const allReady = Object.values(moduleHealth).every(
          health => health.status === "healthy"
        );

        if (allReady) {
          ApiResponse.success("Service is ready", {
            ready: true,
            modules: moduleHealth
          })
            .setRequestId(req.requestId)
            .send(res);
        } else {
          ApiResponse.serviceUnavailable("Service not ready", {
            ready: false,
            modules: moduleHealth
          })
            .setRequestId(req.requestId)
            .send(res);
        }
      } catch (error) {
        ApiResponse.serviceUnavailable("Readiness check failed")
          .setRequestId(req.requestId)
          .send(res);
      }
    });

    // Liveness probe
    this.app.get("/live", (req, res) => {
      ApiResponse.success("Service is alive", {
        alive: true,
        uptime: process.uptime(),
        architecture: "hexagonal"
      })
        .setRequestId(req.requestId)
        .send(res);
    });
  }

  /**
   * Error handling middleware
   */
  errorHandler(err, req, res, next) {
    logger.error("Request error", {
      error: err.message,
      stack: err.stack,
      requestId: req.requestId,
      method: req.method,
      url: req.url,
    });

    // Handle different error types
    if (err.name === 'ValidationError') {
      return ApiResponse.validationError(err.message, err.errors || [])
        .setRequestId(req.requestId)
        .send(res);
    }

    if (err.name === 'AuthError') {
      return ApiResponse.unauthorized(err.message)
        .setRequestId(req.requestId)
        .send(res);
    }

    // Default error response
    ApiResponse.internalServerError(
      process.env.NODE_ENV === 'production' 
        ? 'Something went wrong' 
      architecture: "modular-monolith"
    )
      .setRequestId(req.requestId)
      .send(res);
  }

  /**
   * Start the application
   */
  async start() {
    try {
      logger.info("Starting Modular Monolith Application...");

      // Initialize architecture
      await this.initializeArchitecture();

      // Setup routes after modules are initialized
      this.setupRoutes();

      // Start HTTP server
      this.app.listen(this.port, "0.0.0.0", () => {
        logger.info(`Modular Monolith Server running on port ${this.port}`, {
          environment: process.env.NODE_ENV || "development",
          nodeVersion: process.version,
          architecture: "modular-monolith",
          modules: this.moduleBootstraps.map(m => m.name),
          sharedServices: this.globalContainer.getDependencyInfo(),
          timestamp: new Date().toISOString(),
        });
      });

    } catch (error) {
      logger.error("Failed to start Modular Monolith Application", {
        error: error.message,
        stack: error.stack,
      });
      await this.shutdown();
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info("Shutting down Modular Monolith Application...");

    try {
      // Shutdown modules in reverse order
      const shutdownOrder = [...this.moduleBootstraps].reverse();
      for (const moduleBootstrap of shutdownOrder) {
        await moduleBootstrap.shutdown();
      }

      // Close shared connections
      if (redisClient.isReady && redisClient.isReady()) {
        await redisClient.quit();
        logger.info("Redis connection closed");
      }

      // Clear global container
      this.globalContainer.clear();

      logger.info("Modular Monolith Application shut down successfully");
      process.exit(0);
    } catch (error) {
      logger.error("Error during shutdown", {
        error: error.message,
        stack: error.stack,
      });
      process.exit(1);
    }
  }
}

// Create application instance
const app = new HexagonalApp();

// Graceful shutdown handling
process.on("SIGTERM", () => {
  logger.info("Received SIGTERM signal");
  app.shutdown();
});

process.on("SIGINT", () => {
  logger.info("Received SIGINT signal");
  app.shutdown();
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", { promise, reason });
  app.shutdown();
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", {
    error: error.message,
    stack: error.stack,
  });
  app.shutdown();
});

// Start the application
if (require.main === module) {
  app.start();
}

module.exports = app;