var Squeeze = require('good-squeeze').Squeeze;
var Through = require('through2');
var bunyan = require('bunyan');
var Joi = require('joi');
var util = require('./util');

var availableLevels = Object.keys(bunyan.levelFromName);

var defaultFormatters = {
  ops: function (data) {
    return [{
      memory: Math.round(data.proc.mem.rss / (1024 * 1024)) + 'Mb',
      uptime: data.proc.uptime + 's',
      load: data.os.load.join(', ')
    }, '[ops]'];
  },
  response: function (data) {
    var payload = {};

    if (util.isObject(data.responsePayload) || util.isArray(data.responsePayload)) {
      payload.responsePayload = JSON.stringify(data.responsePayload);
    }

    if (!util.isEmptyObject(data.query)) {
      payload.query = JSON.stringify(data.query);
    }

    payload.instance = data.instance;
    payload.method = data.method;
    payload.path = data.path;
    payload.statusCode = data.statusCode;
    payload.responseTime = data.responseTime + 'ms';

    return [payload, '[response]'];
  },
  error: function (data) {
    return [{
      err: data.error
    }, '[error]', data.error.message];
  },
  log: function (data) {
    return [data.data, '[log]'];
  },
  request: function (data) {
    return [data.data, '[request]'];
  }
};

var settingsSchema = Joi.object().keys({
  levels: Joi.object().keys({
    ops: Joi.string().valid(availableLevels).default('trace'),
    response: Joi.string().valid(availableLevels).default('trace'),
    error: Joi.string().valid(availableLevels).default('error'),
    log: Joi.string().valid(availableLevels).default('info'),
    request: Joi.string().valid(availableLevels).default('trace')
  }),
  formatters: Joi.object().keys({
    ops: Joi.func().default(defaultFormatters.ops),
    response: Joi.func().default(defaultFormatters.response),
    log: Joi.func().default(defaultFormatters.log),
    error: Joi.func().default(defaultFormatters.error),
    request: Joi.func().default(defaultFormatters.request)
  }),
  logger: Joi.object().required()
});

var GoodBunyan = function GoodBunyan (events, config) {
  var self = this;
  this.logger = config.logger;

  if (!(this instanceof GoodBunyan)) {
    return new GoodBunyan(events, config);
  }

  config.levels = config.levels || {};
  config.formatters = config.formatters || {};

  Joi.validate(config, settingsSchema, function (err, value) {
    if (err) {
      throw err;
    }

    self.settings = value;
  });

  this._filter = new Squeeze(events);
};


GoodBunyan.prototype._getLevel = function(eventName, tags) {
  if(Array.isArray(tags)) {
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

  //return default level
  return this.settings.levels[eventName];
}

GoodBunyan.prototype.init = function (stream, emitter, callback) {
  var self = this;

  if (!stream._readableState.objectMode) {
    return callback(new Error('stream must be in object mode'));
  }

  stream.pipe(this._filter).pipe(Through.obj(function goodBunyanTransform (data, enc, next) {
    var eventName = data.event;

    var level = self._getLevel(eventName, data.tags)
    if (level) {
      var formatted = self.settings.formatters[eventName](data);

      if (formatted instanceof Array) {
        self.logger[level].apply(self.logger, formatted);
        return next();
      }

      self.logger[level](formatted);
      return next();
    }

    self.logger.trace(data, '[' + eventName + '] (unknown event)');

    return next();
  }));

  callback();
};

module.exports = GoodBunyan;
