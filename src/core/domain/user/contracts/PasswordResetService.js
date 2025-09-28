/**
 * Password Reset Service Contract
 * Defines password reset token operations interface
 */
class PasswordResetService {
  /**
   * Generate password reset token
   * @param {Object} payload - Token payload
   * @returns {string}
   */
  generatePasswordResetToken(payload) {
    throw new Error('Method must be implemented by concrete password reset service');
  }

  /**
   * Verify password reset token
   * @param {string} token - Reset token
   * @returns {Object}
   */
  verifyPasswordResetToken(token) {
    throw new Error('Method must be implemented by concrete password reset service');
  }
}

module.exports = PasswordResetService;