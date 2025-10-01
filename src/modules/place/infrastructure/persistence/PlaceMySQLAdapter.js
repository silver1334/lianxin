const Repository = require('../../../core/domain/shared/contracts/Repository');

/**
 * MySQL Place Repository Adapter
 * Implements Repository contract using MySQL/Sequelize for Place module
 */
class PlaceMySQLAdapter extends Repository {
  constructor(sequelize, models, cacheService) {
    super();
    this.sequelize = sequelize;
    this.PlaceModel = models.Place;
    this.cacheService = cacheService;
  }

  async findById(id) {
    // Try cache first
    const cacheKey = `place:${id}`;
    let place = await this.cacheService.get(cacheKey);
    
    if (!place) {
      const placeData = await this.PlaceModel.findByPk(id);
      if (placeData) {
        place = placeData.toJSON();
        // Cache for 1 hour
        await this.cacheService.set(cacheKey, place, 3600);
      }
    }

    return place;
  }

  async findByUuid(uuid) {
    const placeData = await this.PlaceModel.findOne({
      where: { uuid }
    });

    return placeData ? placeData.toJSON() : null;
  }

  async search(query, filters = {}) {
    const { 
      category, 
      latitude, 
      longitude, 
      radius = 1000, 
      limit = 20, 
      offset = 0 
    } = filters;

    let whereClause = {
      status: 'active'
    };

    if (query) {
      whereClause[this.sequelize.Op.or] = [
        { name: { [this.sequelize.Op.like]: `%${query}%` } },
        { description: { [this.sequelize.Op.like]: `%${query}%` } },
        { address: { [this.sequelize.Op.like]: `%${query}%` } }
      ];
    }

    if (category) {
      whereClause.category = category;
    }

    // If location-based search
    if (latitude && longitude) {
      // Using Haversine formula for distance calculation
      const havesineDistance = this.sequelize.literal(`
        (6371 * acos(cos(radians(${latitude})) 
        * cos(radians(latitude)) 
        * cos(radians(longitude) - radians(${longitude})) 
        + sin(radians(${latitude})) 
        * sin(radians(latitude))))
      `);

      whereClause = {
        ...whereClause,
        [this.sequelize.Op.and]: this.sequelize.where(
          havesineDistance,
          { [this.sequelize.Op.lte]: radius / 1000 } // Convert meters to kilometers
        )
      };
    }

    const { count, rows } = await this.PlaceModel.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [
        ['rating', 'DESC'],
        ['review_count', 'DESC']
      ]
    });

    return {
      places: rows.map(row => row.toJSON()),
      total: count
    };
  }

  async save(place) {
    if (place.id) {
      return await this._update(place);
    } else {
      return await this._create(place);
    }
  }

  async delete(id) {
    // Soft delete by changing status
    const result = await this.PlaceModel.update(
      { status: 'inactive' },
      { where: { id } }
    );

    // Clear cache
    await this.cacheService.delete(`place:${id}`);

    return result[0] > 0;
  }

  async findWithFilters(filters, options = {}) {
    return await this.search('', { ...filters, ...options });
  }

  async beginTransaction() {
    return await this.sequelize.transaction();
  }

  async commitTransaction(transaction) {
    return await transaction.commit();
  }

  async rollbackTransaction(transaction) {
    return await transaction.rollback();
  }

  // Private helper methods
  async _create(place) {
    const createdPlace = await this.PlaceModel.create(place);
    return createdPlace.toJSON();
  }

  async _update(place) {
    await this.PlaceModel.update(place, {
      where: { id: place.id }
    });

    // Clear cache
    await this.cacheService.delete(`place:${place.id}`);

    return place;
  }
}

module.exports = PlaceMySQLAdapter;