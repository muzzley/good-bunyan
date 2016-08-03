/**
 * @file lib/index - GoodBunyan class
 */

'use strict';

const Stream   = require('stream');
const Hoek     = require('hoek');
const Squeeze  = require('good-squeeze').Squeeze;
const validate = require('./validate');
const formatters = require('./formatters');

/**
 * @constant {object} defaults - Default configuration
 */
const defaults = {
  levels: {
    ops     : 'trace',
    response: 'trace',
    error   : 'error',
    log     : 'info',
    request : 'trace'
  },

  formatters
};

/**
 * GoodBunyan class.
 * @extends Stram.Transform
 */
class GoodBunyan extends Stream.Transform {
  /**
   * Create a new GoodBunyan object.
   * @param  {object} events - Good events to which subscribe to
   * @param  {object} config - Instance configuration
   * @return {GoodBunyan} A new GoodBunyan instance
   */
  constructor(events, config) {
    // Validates inputs and throws errors
    validate(events, config);

    super({ objectMode: true });

    this.settings = Hoek.applyToDefaultsWithShallow(defaults, config, ['logger']);
    this.logger   = this.settings.logger; // Alias for consistency
    this._filter  = new Squeeze(events);
  }

  /**
   * Gets Bunyan log level based on good event name or provided tags.
   * @param  {string} eventName - Good event name
   * @param  {array}  tags      - Array of string representing any tags associated with the event
   * @return {string} Bunyan log level
   */
  _getLevel(eventName, tags) {
    if (Array.isArray(tags)) {
      if (tags.indexOf('fatal') !== -1) {
        return 'fatal';
      } else if (tags.indexOf('error') !== -1) {
        return 'error';
      } else if (tags.indexOf('warn') !== -1) {
        return 'warn';
      } else if (tags.indexOf('info') !== -1) {
        return 'info';
      } else if (tags.indexOf('debug') !== -1) {
        return 'debug';
      } else if (tags.indexOf('trace') !== -1) {
        return 'trace';
      }
    }

    // Default level
    return this.settings.levels[eventName];
  }

  /**
   * Transforms data stream.
   * @param  {object}   data - Payload
   * @param  {string}   enc  - Encoding type (if data is string) or 'buffer' (if data is buffer)
   * @param  {Function} next - Callback function to be called after data has been processed
   * @return {undefined}
   */
  _transform(data, enc, next) {
    if (!Squeeze.filter(this._filter._subscription, data)) {
      next(null);
    }

    const eventName = data.event;
    const level     = this._getLevel(eventName, data.tags);

    if (!level) {
      this.logger.trace(data, `[${eventName}] (unknown event)`);

      return next(null);
    }

    const formatted = this.settings.formatters[eventName](data);
    const args      = Array.isArray(formatted) ? formatted : [formatted];

    this.logger[level].apply(this.logger, args);

    return next(null);
  }
}

module.exports = GoodBunyan;
