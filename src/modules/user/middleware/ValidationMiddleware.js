const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation Middleware
 * Handles request validation for user module endpoints
 */
class ValidationMiddleware {
  /**
   * Handle validation errors
   */
  handleValidationErrors() {
    return (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: errors.array()
          }
        });
      }
      next();
    };
  }

  /**
   * Validate registration OTP request
   */
  validateRegistrationOtpRequest() {
    return [
      body('phone')
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^[0-9]{10,11}$/)
        .withMessage('Phone number must be 10-11 digits'),
      
      body('country_code')
        .notEmpty()
        .withMessage('Country code is required')
        .isIn(['+86', '+852', '+853', '+886'])
        .withMessage('Unsupported country code'),

      this.handleValidationErrors()
    ];
  }

  /**
   * Validate user registration
   */
  validateRegistration() {
    return [
      body('phone')
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^[0-9]{10,11}$/)
        .withMessage('Phone number must be 10-11 digits'),
      
      body('country_code')
        .notEmpty()
        .withMessage('Country code is required')
        .isIn(['+86', '+852', '+853', '+886'])
        .withMessage('Unsupported country code'),

      body('password')
        .isLength({ min: 8, max: 128 })
        .withMessage('Password must be 8-128 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
        .withMessage('Password must contain uppercase, lowercase, number and special character'),

      body('verification_id')
        .notEmpty()
        .withMessage('Verification ID is required'),

      body('otp_code')
        .notEmpty()
        .withMessage('OTP code is required')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP code must be 6 digits')
        .isNumeric()
        .withMessage('OTP code must be numeric'),

      body('device_info')
        .isObject()
        .withMessage('Device info is required'),

      body('device_info.device_id')
        .notEmpty()
        .withMessage('Device ID is required'),

      body('device_info.device_type')
        .isIn(['web', 'mobile', 'tablet'])
        .withMessage('Invalid device type'),

      this.handleValidationErrors()
    ];
  }

  /**
   * Validate login OTP request
   */
  validateLoginOtpRequest() {
    return [
      body('phone')
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^[0-9]{10,11}$/)
        .withMessage('Phone number must be 10-11 digits'),
      
      body('country_code')
        .notEmpty()
        .withMessage('Country code is required')
        .isIn(['+86', '+852', '+853', '+886'])
        .withMessage('Unsupported country code'),

      this.handleValidationErrors()
    ];
  }

  /**
   * Validate user login
   */
  validateLogin() {
    return [
      body('phone')
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^[0-9]{10,11}$/)
        .withMessage('Phone number must be 10-11 digits'),
      
      body('country_code')
        .notEmpty()
        .withMessage('Country code is required')
        .isIn(['+86', '+852', '+853', '+886'])
        .withMessage('Unsupported country code'),

      body('device_info')
        .isObject()
        .withMessage('Device info is required'),

      body('device_info.device_id')
        .notEmpty()
        .withMessage('Device ID is required'),

      // Either password or OTP is required
      body().custom((value, { req }) => {
        const hasPassword = req.body.password;
        const hasOtp = req.body.verification_id && req.body.otp_code;
        
        if (!hasPassword && !hasOtp) {
          throw new Error('Either password or OTP verification is required');
        }
        
        return true;
      }),

      this.handleValidationErrors()
    ];
  }

  /**
   * Validate refresh token request
   */
  validateRefreshToken() {
    return [
      body('refresh_token')
        .notEmpty()
        .withMessage('Refresh token is required'),

      this.handleValidationErrors()
    ];
  }

  /**
   * Validate password reset OTP request
   */
  validatePasswordResetOtpRequest() {
    return [
      body('phone')
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^[0-9]{10,11}$/)
        .withMessage('Phone number must be 10-11 digits'),
      
      body('country_code')
        .notEmpty()
        .withMessage('Country code is required')
        .isIn(['+86', '+852', '+853', '+886'])
        .withMessage('Unsupported country code'),

      this.handleValidationErrors()
    ];
  }

  /**
   * Validate password reset OTP verification
   */
  validatePasswordResetOtpVerification() {
    return [
      body('phone')
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^[0-9]{10,11}$/)
        .withMessage('Phone number must be 10-11 digits'),
      
      body('country_code')
        .notEmpty()
        .withMessage('Country code is required')
        .isIn(['+86', '+852', '+853', '+886'])
        .withMessage('Unsupported country code'),

      body('verification_id')
        .notEmpty()
        .withMessage('Verification ID is required'),

      body('otp_code')
        .notEmpty()
        .withMessage('OTP code is required')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP code must be 6 digits')
        .isNumeric()
        .withMessage('OTP code must be numeric'),

      this.handleValidationErrors()
    ];
  }

  /**
   * Validate password reset
   */
  validatePasswordReset() {
    return [
      body('phone')
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^[0-9]{10,11}$/)
        .withMessage('Phone number must be 10-11 digits'),
      
      body('country_code')
        .notEmpty()
        .withMessage('Country code is required')
        .isIn(['+86', '+852', '+853', '+886'])
        .withMessage('Unsupported country code'),

      body('reset_token')
        .notEmpty()
        .withMessage('Reset token is required'),

      body('new_password')
        .isLength({ min: 8, max: 128 })
        .withMessage('Password must be 8-128 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
        .withMessage('Password must contain uppercase, lowercase, number and special character'),

      this.handleValidationErrors()
    ];
  }

  /**
   * Validate profile update
   */
  validateProfileUpdate() {
    return [
      body('display_name')
        .optional()
        .isLength({ min: 1, max: 50 })
        .withMessage('Display name must be 1-50 characters long'),

      body('first_name')
        .optional()
        .isLength({ min: 1, max: 30 })
        .withMessage('First name must be 1-30 characters long'),

      body('last_name')
        .optional()
        .isLength({ min: 1, max: 30 })
        .withMessage('Last name must be 1-30 characters long'),

      body('bio')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Bio must not exceed 500 characters'),

      body('birth_date')
        .optional()
        .isISO8601()
        .withMessage('Birth date must be a valid date'),

      body('gender')
        .optional()
        .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
        .withMessage('Invalid gender value'),

      this.handleValidationErrors()
    ];
  }

  /**
   * Validate password change
   */
  validatePasswordChange() {
    return [
      body('current_password')
        .notEmpty()
        .withMessage('Current password is required'),

      body('new_password')
        .isLength({ min: 8, max: 128 })
        .withMessage('Password must be 8-128 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
        .withMessage('Password must contain uppercase, lowercase, number and special character'),

      this.handleValidationErrors()
    ];
  }

  /**
   * Validate account deactivation
   */
  validateAccountDeactivation() {
    return [
      body('password')
        .notEmpty()
        .withMessage('Password is required for account deactivation'),

      body('reason')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Reason must not exceed 200 characters'),

      this.handleValidationErrors()
    ];
  }

  /**
   * Validate account deletion
   */
  validateAccountDeletion() {
    return [
      body('password')
        .notEmpty()
        .withMessage('Password is required for account deletion'),

      this.handleValidationErrors()
    ];
  }

  /**
   * Validate settings update
   */
  validateSettingsUpdate() {
    return [
      body('notifications')
        .optional()
        .isObject()
        .withMessage('Notifications must be an object'),

      body('privacy')
        .optional()
        .isObject()
        .withMessage('Privacy settings must be an object'),

      body('preferences.language')
        .optional()
        .isIn(['en', 'zh-CN', 'zh-TW'])
        .withMessage('Invalid language'),

      body('preferences.theme')
        .optional()
        .isIn(['light', 'dark', 'auto'])
        .withMessage('Invalid theme'),

      this.handleValidationErrors()
    ];
  }

  /**
   * Validate user suspension (Admin)
   */
  validateUserSuspension() {
    return [
      param('userId')
        .isInt({ min: 1 })
        .withMessage('Invalid user ID'),

      body('reason')
        .notEmpty()
        .withMessage('Suspension reason is required')
        .isLength({ min: 10, max: 500 })
        .withMessage('Reason must be 10-500 characters long'),

      body('duration_days')
        .isInt({ min: 1, max: 365 })
        .withMessage('Duration must be 1-365 days'),

      this.handleValidationErrors()
    ];
  }

  /**
   * Validate user verification (Admin)
   */
  validateUserVerification() {
    return [
      param('userId')
        .isInt({ min: 1 })
        .withMessage('Invalid user ID'),

      body('verification_type')
        .isIn(['identity', 'phone', 'email', 'business'])
        .withMessage('Invalid verification type'),

      body('verification_data')
        .isObject()
        .withMessage('Verification data is required'),

      this.handleValidationErrors()
    ];
  }
}

module.exports = ValidationMiddleware;