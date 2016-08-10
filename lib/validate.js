'use strict';

const bunyan = require('bunyan');
const Hoek = require('hoek');
const Joi = require('joi');

/**
 * @constant {array} availableLevels - List of available Bunyan log levels
 * @private
 */
const availableLevels = Object.keys(bunyan.levelFromName);
/**
 * @constant {object} schema - Validation schema
 * @private
 */
const schema = {
  levels: {
    ops: Joi.string().valid(availableLevels),
    response: Joi.string().valid(availableLevels),
    error: Joi.string().valid(availableLevels),
    log: Joi.string().valid(availableLevels),
    request: Joi.string().valid(availableLevels)
  },
  logger: Joi.object().required()
};

/**
 * Gets error messages joined in a single string if error is not null. Otherwise gets an empty string.
 * @private
 * @param  {[object|null} error - Error object
 * @return {string}       Error messages or empty string
 */
const errMsg = error => error ? error.details.map(d => d.message).join('; ') : '';

/**
 * Validates provided inputs.
 * @public
 * @param  {object}  events - Good events to which subscribe to
 * @param  {object}  config - Configuration
 * @return {boolean} True if everything is ok
 * @throws Will throw an error if arguments don't pass validation.
 */
const validate = (events, config) => {
  Hoek.assert(typeof events === 'object', 'events must be an object');
  Hoek.assert(typeof config === 'object', 'config must be an object');

  const result = Joi.validate(config, schema);

  Hoek.assert(result.error === null, errMsg(result.error));

  return true;
};

module.exports = validate;
