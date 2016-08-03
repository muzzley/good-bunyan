/**
 * @file Constructor inputs validation
 */

'use strict';

const bunyan = require('bunyan');
const Hoek   = require('hoek');
const Joi    = require('joi');

const availableLevels = Object.keys(bunyan.levelFromName);

const schema = {
  levels: {
    ops     : Joi.string().valid(availableLevels),
    response: Joi.string().valid(availableLevels),
    error   : Joi.string().valid(availableLevels),
    log     : Joi.string().valid(availableLevels),
    request : Joi.string().valid(availableLevels)
  },
  logger: Joi.object().required()
};

const validate = (events, config) => {
  Hoek.assert(typeof events === 'object', 'events must be an object');
  Hoek.assert(typeof config === 'object', 'config must be an object');

  const result = Joi.validate(config, schema);

  Hoek.assert(result.error === null, result.error.details.map(d => d.message).join('; '));

  return true;
};

module.exports = validate;
