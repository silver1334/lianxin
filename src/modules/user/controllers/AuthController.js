/**
 * Authentication Controller
 * Handles HTTP requests for authentication operations
 */
class AuthController {
  constructor(authenticationApplicationService) {
    this.authService = authenticationApplicationService;
  }

  /**
   * Request registration OTP
   */
  async requestRegistrationOtp(req, res, next) {
    try {
      const { phone, country_code } = req.body;

      const result = await this.authService.requestRegistrationOtp(phone, country_code);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Registration OTP sent successfully'
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Register new user
   */
  async register(req, res, next) {
    try {
      const {
        phone,
        country_code,
        password,
        verification_id,
        otp_code,
        device_info
      } = req.body;

      const result = await this.authService.registerUser({
        phone,
        countryCode: country_code,
        password,
        verificationId: verification_id,
        otpCode: otp_code,
        deviceInfo: device_info,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(201).json({
        success: true,
        data: {
          user: result.user.toSafeView(),
          tokens: {
            access_token: result.session.access_token,
            refresh_token: result.session.refresh_token,
            token_type: result.session.token_type,
            expires_at: result.session.expires_at
          }
        },
        message: 'User registered successfully'
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Request login OTP
   */
  async requestLoginOtp(req, res, next) {
    try {
      const { phone, country_code } = req.body;

      const result = await this.authService.requestLoginOtp(phone, country_code);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Login OTP sent successfully'
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   */
  async login(req, res, next) {
    try {
      const {
        phone,
        country_code,
        password,
        verification_id,
        otp_code,
        device_info
      } = req.body;

      const result = await this.authService.loginUser({
        phone,
        countryCode: country_code,
        password,
        verificationId: verification_id,
        otpCode: otp_code,
        deviceInfo: device_info,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(200).json({
        success: true,
        data: {
          user: result.user.toSafeView(),
          tokens: {
            access_token: result.session.access_token,
            refresh_token: result.session.refresh_token,
            token_type: result.session.token_type,
            expires_at: result.session.expires_at
          },
          login_method: result.loginMethod
        },
        message: 'Login successful'
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req, res, next) {
    try {
      const { refresh_token } = req.body;

      const result = await this.authService.refreshToken(refresh_token);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Token refreshed successfully'
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   */
  async logout(req, res, next) {
    try {
      const authHeader = req.get('Authorization');
      const token = authHeader?.replace('Bearer ', '');

      await this.authService.logout(token);

      res.status(200).json({
        success: true,
        data: null,
        message: 'Logout successful'
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Request password reset OTP
   */
  async requestPasswordResetOtp(req, res, next) {
    try {
      const { phone, country_code } = req.body;

      const result = await this.authService.requestPasswordResetOtp(phone, country_code);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Password reset OTP sent successfully'
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify reset OTP and get reset token
   */
  async verifyResetOtp(req, res, next) {
    try {
      const { phone, country_code, verification_id, otp_code } = req.body;

      const resetToken = await this.authService.verifyResetOtp(
        phone, 
        country_code, 
        verification_id, 
        otp_code
      );

      res.status(200).json({
        success: true,
        data: { reset_token: resetToken },
        message: 'OTP verified successfully'
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password
   */
  async resetPassword(req, res, next) {
    try {
      const { phone, country_code, reset_token, new_password } = req.body;

      await this.authService.resetPassword(
        phone, 
        country_code, 
        reset_token, 
        new_password
      );

      res.status(200).json({
        success: true,
        data: null,
        message: 'Password reset successfully'
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;