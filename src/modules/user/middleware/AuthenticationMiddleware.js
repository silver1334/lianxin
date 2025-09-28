/**
 * Authentication Middleware
 * Handles JWT token verification and user authentication
 */
class AuthenticationMiddleware {
  constructor(jwtService, authenticationApplicationService) {
    this.jwtService = jwtService;
    this.authService = authenticationApplicationService;
  }

  /**
   * Authenticate user with JWT token
   */
  authenticate(requiredRoles = []) {
    return async (req, res, next) => {
      try {
        // Extract token from Authorization header
        const authHeader = req.get('Authorization');
        if (!authHeader) {
          return res.status(401).json({
            success: false,
            error: { 
              message: 'Authorization header is required',
              code: 'MISSING_AUTH_HEADER'
            }
          });
        }

        const token = this.jwtService.extractToken(authHeader);

        // Verify token and get user info
        const userInfo = await this.authService.verifyToken(token);

        // Check required roles
        if (requiredRoles.length > 0) {
          const userRoles = userInfo.roles || ['user'];
          const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
          
          if (!hasRequiredRole) {
            return res.status(403).json({
              success: false,
              error: { 
                message: 'Insufficient permissions',
                code: 'INSUFFICIENT_PERMISSIONS',
                required_roles: requiredRoles,
                user_roles: userRoles
              }
            });
          }
        }

        // Add user info to request
        req.user = userInfo;
        next();

      } catch (error) {
        let statusCode = 401;
        let errorCode = 'AUTHENTICATION_FAILED';

        if (error.message.includes('expired')) {
          errorCode = 'TOKEN_EXPIRED';
        } else if (error.message.includes('Invalid')) {
          errorCode = 'INVALID_TOKEN';
        } else if (error.message.includes('session')) {
          errorCode = 'INVALID_SESSION';
        }

        return res.status(statusCode).json({
          success: false,
          error: { 
            message: error.message,
            code: errorCode
          }
        });
      }
    };
  }

  /**
   * Optional authentication - doesn't fail if no token provided
   */
  optionalAuthenticate() {
    return async (req, res, next) => {
      try {
        const authHeader = req.get('Authorization');
        if (!authHeader) {
          req.user = null;
          return next();
        }

        const token = this.jwtService.extractToken(authHeader);
        const userInfo = await this.authService.verifyToken(token);
        req.user = userInfo;

      } catch (error) {
        // Ignore authentication errors for optional auth
        req.user = null;
      }

      next();
    };
  }

  /**
   * Check if user owns the resource
   */
  requireOwnership(userIdParam = 'userId') {
    return (req, res, next) => {
      const resourceUserId = req.params[userIdParam];
      const currentUserId = req.user?.userId;

      if (!currentUserId) {
        return res.status(401).json({
          success: false,
          error: { 
            message: 'Authentication required',
            code: 'AUTHENTICATION_REQUIRED'
          }
        });
      }

      if (resourceUserId !== currentUserId.toString()) {
        // Check if user has admin role
        const userRoles = req.user.roles || ['user'];
        if (!userRoles.includes('admin')) {
          return res.status(403).json({
            success: false,
            error: { 
              message: 'Access denied. You can only access your own resources.',
              code: 'ACCESS_DENIED'
            }
          });
        }
      }

      next();
    };
  }

  /**
   * Rate limiting middleware
   */
  rateLimit(maxRequests = 100, windowMs = 60000) {
    const requests = new Map();

    return (req, res, next) => {
      const key = req.user?.userId || req.ip;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean old entries
      if (requests.has(key)) {
        const userRequests = requests.get(key).filter(time => time > windowStart);
        requests.set(key, userRequests);
      }

      const currentRequests = requests.get(key) || [];
      
      if (currentRequests.length >= maxRequests) {
        return res.status(429).json({
          success: false,
          error: { 
            message: 'Too many requests. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            retry_after: Math.ceil(windowMs / 1000)
          }
        });
      }

      currentRequests.push(now);
      requests.set(key, currentRequests);

      next();
    };
  }
}

module.exports = AuthenticationMiddleware;