/**
 * User Controller
 * Handles HTTP requests for user management operations
 */
class UserController {
  constructor(userApplicationService) {
    this.userService = userApplicationService;
  }

  /**
   * Get current user's profile
   */
  async getMyProfile(req, res, next) {
    try {
      const userId = req.user.userId;

      const profile = await this.userService.getUserProfile(userId, userId);

      res.status(200).json({
        success: true,
        data: { profile },
        message: 'Profile retrieved successfully'
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(req, res, next) {
    try {
      const { userId } = req.params;
      const requestingUserId = req.user.userId;

      const profile = await this.userService.getUserProfile(userId, requestingUserId);

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: { message: 'User not found' }
        });
      }

      res.status(200).json({
        success: true,
        data: { profile },
        message: 'Profile retrieved successfully'
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.userId;
      const profileData = req.body;

      const updatedProfile = await this.userService.updateUserProfile(userId, profileData);

      res.status(200).json({
        success: true,
        data: { profile: updatedProfile.toOwnerView() },
        message: 'Profile updated successfully'
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Change user password
   */
  async changePassword(req, res, next) {
    try {
      const userId = req.user.userId;
      const sessionId = req.user.sessionId;
      const { current_password, new_password } = req.body;

      await this.userService.changePassword(
        userId, 
        current_password, 
        new_password, 
        sessionId
      );

      res.status(200).json({
        success: true,
        data: null,
        message: 'Password changed successfully'
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Deactivate user account
   */
  async deactivateAccount(req, res, next) {
    try {
      const userId = req.user.userId;
      const { password, reason } = req.body;

      await this.userService.deactivateAccount(userId, password, reason);

      res.status(200).json({
        success: true,
        data: null,
        message: 'Account deactivated successfully'
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Schedule account for deletion
   */
  async scheduleAccountDeletion(req, res, next) {
    try {
      const userId = req.user.userId;
      const { password } = req.body;

      await this.userService.scheduleAccountDeletion(userId, password);

      res.status(200).json({
        success: true,
        data: null,
        message: 'Account scheduled for deletion successfully'
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Search users (Admin)
   */
  async searchUsers(req, res, next) {
    try {
      const { query, limit = 20, offset = 0 } = req.query;

      const result = await this.userService.searchUsers(query, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.status(200).json({
        success: true,
        data: {
          users: result.users.map(user => user.toSafeView()),
          total: result.total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        },
        message: 'Users retrieved successfully'
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user statistics (Admin)
   */
  async getUserStatistics(req, res, next) {
    try {
      const stats = await this.userService.getUserStatistics();

      res.status(200).json({
        success: true,
        data: { statistics: stats },
        message: 'User statistics retrieved successfully'
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Suspend user (Admin)
   */
  async suspendUser(req, res, next) {
    try {
      const { userId } = req.params;
      const { reason, duration_days } = req.body;
      const suspendedBy = req.user.userId;

      const suspensionEvent = await this.userService.suspendUser(
        userId, 
        reason, 
        duration_days, 
        suspendedBy
      );

      res.status(200).json({
        success: true,
        data: { suspension: suspensionEvent.getData() },
        message: 'User suspended successfully'
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify user (Admin)
   */
  async verifyUser(req, res, next) {
    try {
      const { userId } = req.params;
      const { verification_type, verification_data } = req.body;
      const verifiedBy = req.user.userId;

      const verificationEvent = await this.userService.verifyUser(
        userId, 
        verification_type, 
        verification_data, 
        verifiedBy
      );

      res.status(200).json({
        success: true,
        data: { verification: verificationEvent.getData() },
        message: 'User verified successfully'
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;