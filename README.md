good-bunyan
===

`good-bunyan` is a [good](https://github.com/hapijs/good) reporter implementation to write [hapi](http://hapijs.com/) server events to a [bunyan](https://github.com/trentm/node-bunyan/) logger.


## Usage

## `GoodBunyan(events, config)`
Creates a new GoodBunyan object with the following arguments:

- `events` - an object of key value pairs.
  - `key` - one of the supported [good events](https://github.com/hapijs/good) indicating the hapi event to subscribe to
  - `value` - a single string or an array of strings to filter incoming events. "\*" indicates no filtering. `null` and `undefined` are assumed to be "\*"
- `config` - configuration object with the following available keys
  - `logger` (required) - [bunyan](https://github.com/trentm/node-bunyan/) logger instance.
  - `levels` - object used to set the default bunyan level for each good event type. Each key is a [good event](https://github.com/hapijs/good) (`ops`, `repsonse`, `log`, `error` and `request`), and the values must be a [bunyan level](https://github.com/trentm/node-bunyan#levels) (`trace`, `debug`, `info`, `error` or `fatal`). Please note that `good-bunyan` will first try to look for a valid bunyan level within the event tags (e.g. using the tag ['error', 'handler'] will result in using the bunyan 'error' level).
  - `formatters` - object used to override the message passed to buyan. Each key is a [good event](https://github.com/hapijs/good) (`ops`, `repsonse`, `log`, `error` and `request`), and the values must be functions which take an object `data` as the argument and output, either a `string`, or an array of arguments to be passed for the bunyan log.

## Good Bunyan Methods
### `goodBunyan.init(stream, emitter, callback)`
Initializes the reporter with the following arguments:

- `stream` - a Node readable stream that will be the source of data for this reporter. It is assumed that `stream` is in `objectMode`.
- `emitter` - an event emitter object.
- `callback` - a callback to execute when the start function has complete all the necessary set up steps and is ready to receive data.

## Install

```
npm install good-bunyan --save
```

## Example Usage

```javascript
var Hapi = require('hapi');
var bunyan = require('bunyan');

var logger = bunyan.createLogger({ name: 'myapp' });
var server = new Hapi.Server();
server.connection({ host: 'localhost' });

var options = {
  opsInterval: 1000,
  responsePayload: true, // enable this to log response payloads
  reporters: [{
    reporter: require('good-bunyan'),
    config: {
      logger: logger,
      levels: {
        ops: 'debug'
      },
      formatters: {
        response: function (data) {
          return 'Response for' + data.path;
        }
      }
    }
  }]
};

server.register({
  register: require('good'),
  options: options
}, function (err) {

    if (err) {
      console.error(err);
    }
    else {
      server.start(function () {

        console.info('Server started at ' + server.info.uri);
      });
    }
});
```

## Credits

Inspired by [good-console](https://github.com/hapijs/good-console/).
