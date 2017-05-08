'use strict';

const Stream = require('stream');
const Hoek = require('hoek');
const Squeeze = require('good-squeeze').Squeeze;
const validate = require('./validate');
const formatters = require('./formatters');

/**
 * @constant {object} defaults - Default configuration
 */
const defaults = {
  levels: {
    ops: 'trace',
    response: 'trace',
    error: 'error',
    log: 'info',
    request: 'trace'
  },

  formatters
};

/**
 * GoodBunyan class.
 * @extends Stram.Writable
 */
class GoodBunyan extends Stream.Writable {
  /**
   * Create a new GoodBunyan object.
   * @param  {object} events - Good events to which subscribe to
   * @param  {object} config - Instance configuration
   * @return {GoodBunyan} A new GoodBunyan instance
   */
  constructor (events, config) {
    // Validates inputs and throws errors
    validate(events, config);

    super({ objectMode: true });

    this.settings = Hoek.applyToDefaultsWithShallow(defaults, config, ['logger']);
    this.logger = this.settings.logger; // Alias for consistency
    this._subscription = Squeeze.subscription(events);
  }

  /**
   * Gets Bunyan log level based on good event name or provided tags.
   * @param  {string} eventName - Good event name
   * @param  {array}  tags      - Array of string representing any tags associated with the event
   * @return {string} Bunyan log level
   */
  _getLevel (eventName, tags) {
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
   * Writes data stream.
   * @param  {object}   data - Payload
   * @param  {string}   enc  - Encoding type (if data is string) or 'buffer' (if data is buffer)
   * @param  {Function} next - Callback function to be called after data has been processed
   * @return {undefined}
   */
  _write (data, enc, next) {
    if (!Squeeze.filter(this._subscription, data)) {
      return next(null);
    }

    const eventName = data.event;
    const level = this._getLevel(eventName, data.tags);

    if (!level) {
      this.logger.trace(data, `[${eventName}] (unknown event)`);
      return next(null);
    }

    let formatted;

    try {
        formatted = this.settings.formatters[eventName](data);
    } catch (e) {
        console.error(e);
        return next(null);
    }

    const args = Array.isArray(formatted) ? formatted : [formatted];

    if (typeof formatted[0] === 'object' && formatted[0].msg) {
      formatted[formatted.length - 1] = `${formatted[formatted.length - 1]} ${formatted[0].msg}`;
      delete formatted[0].msg;
    }

    this.logger[level].apply(this.logger, args);

    return next(null);
  }
}

module.exports = GoodBunyan;
