const EventPublisher = require('../../../core/domain/shared/contracts/EventPublisher');

/**
 * In-Memory Event Adapter
 * Implements EventPublisher contract using in-memory event handling
 */
class InMemoryEventAdapter extends EventPublisher {
  constructor() {
    super();
    this.subscribers = new Map();
    this.eventHistory = [];
    this.maxHistorySize = 1000;
  }

  async publish(event) {
    try {
      // Validate event
      if (!event || !event.getType()) {
        throw new Error('Invalid event: missing type');
      }

      const eventType = event.getType();
      
      // Store in history
      this._addToHistory(event);

      // Get subscribers for this event type
      const typeSubscribers = this.subscribers.get(eventType) || [];
      const wildcardSubscribers = this.subscribers.get('*') || [];
      const allSubscribers = [...typeSubscribers, ...wildcardSubscribers];

      // Execute all handlers
      const promises = allSubscribers.map(async (subscriber) => {
        try {
          await subscriber.handler(event);
        } catch (error) {
          console.error(`Event handler error for ${eventType}:`, error);
          // Don't throw - we want other handlers to continue
        }
      });

      await Promise.all(promises);

      console.log(`Event published: ${eventType}`, {
        eventId: event.getId(),
        aggregateId: event.getAggregateId(),
        subscriberCount: allSubscribers.length
      });

    } catch (error) {
      console.error('Failed to publish event:', error);
      throw error;
    }
  }

  async publishBatch(events) {
    const promises = events.map(event => this.publish(event));
    await Promise.all(promises);
  }

  async subscribe(eventType, handler) {
    if (!eventType || typeof handler !== 'function') {
      throw new Error('Invalid subscription: eventType and handler are required');
    }

    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }

    const subscription = {
      id: this._generateSubscriptionId(),
      handler,
      subscribedAt: new Date()
    };

    this.subscribers.get(eventType).push(subscription);

    console.log(`Subscribed to event: ${eventType}`, {
      subscriptionId: subscription.id,
      totalSubscribers: this.subscribers.get(eventType).length
    });

    return subscription.id;
  }

  async unsubscribe(eventType, handler) {
    if (!this.subscribers.has(eventType)) {
      return false;
    }

    const subscribers = this.subscribers.get(eventType);
    const index = subscribers.findIndex(sub => sub.handler === handler);

    if (index !== -1) {
      subscribers.splice(index, 1);
      
      // Clean up empty subscriber lists
      if (subscribers.length === 0) {
        this.subscribers.delete(eventType);
      }

      console.log(`Unsubscribed from event: ${eventType}`);
      return true;
    }

    return false;
  }

  // Additional methods for in-memory implementation
  getSubscriberCount(eventType = null) {
    if (eventType) {
      return this.subscribers.get(eventType)?.length || 0;
    }

    let total = 0;
    for (const subscribers of this.subscribers.values()) {
      total += subscribers.length;
    }
    return total;
  }

  getEventHistory(limit = 100) {
    return this.eventHistory.slice(-limit);
  }

  getEventsByType(eventType, limit = 100) {
    return this.eventHistory
      .filter(event => event.getType() === eventType)
      .slice(-limit);
  }

  getEventsByAggregateId(aggregateId, limit = 100) {
    return this.eventHistory
      .filter(event => event.getAggregateId() === aggregateId)
      .slice(-limit);
  }

  clearHistory() {
    this.eventHistory = [];
  }

  clearSubscribers() {
    this.subscribers.clear();
  }

  // Setup default event handlers for common events
  setupDefaultHandlers() {
    // User events
    this.subscribe('UserRegistered', async (event) => {
      console.log('User registered:', {
        userId: event.getAggregateId(),
        timestamp: event.getMetadata().occurredAt
      });
    });

    this.subscribe('UserLoggedIn', async (event) => {
      console.log('User logged in:', {
        userId: event.getAggregateId(),
        ipAddress: event.getData().ipAddress,
        timestamp: event.getMetadata().occurredAt
      });
    });

    this.subscribe('UserAccountLocked', async (event) => {
      console.warn('User account locked:', {
        userId: event.getAggregateId(),
        failedAttempts: event.getData().failedAttempts,
        timestamp: event.getMetadata().occurredAt
      });
    });

    this.subscribe('UserSuspended', async (event) => {
      console.warn('User suspended:', {
        userId: event.getAggregateId(),
        reason: event.getData().reason,
        suspensionUntil: event.getData().suspensionUntil,
        timestamp: event.getMetadata().occurredAt
      });
    });

    // Session events
    this.subscribe('SessionRevoked', async (event) => {
      console.log('Session revoked:', {
        sessionId: event.getAggregateId(),
        userId: event.getData().userId,
        reason: event.getData().reason,
        timestamp: event.getMetadata().occurredAt
      });
    });

    // Profile events
    this.subscribe('UserProfileUpdated', async (event) => {
      console.log('User profile updated:', {
        userId: event.getAggregateId(),
        changes: Object.keys(event.getData().changes),
        timestamp: event.getMetadata().occurredAt
      });
    });
  }

  // Private helper methods
  _addToHistory(event) {
    this.eventHistory.push(event);
    
    // Maintain history size limit
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  _generateSubscriptionId() {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Statistics and monitoring
  getStats() {
    const eventTypeStats = {};
    
    for (const event of this.eventHistory) {
      const type = event.getType();
      eventTypeStats[type] = (eventTypeStats[type] || 0) + 1;
    }

    return {
      totalEvents: this.eventHistory.length,
      totalSubscribers: this.getSubscriberCount(),
      eventTypes: Object.keys(this.subscribers).length,
      eventTypeStats,
      subscribersByType: Object.fromEntries(
        Array.from(this.subscribers.entries()).map(([type, subs]) => [type, subs.length])
      )
    };
  }
}

module.exports = InMemoryEventAdapter;