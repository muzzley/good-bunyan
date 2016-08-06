# good-bunyan

`good-bunyan` is a [good](https://github.com/hapijs/good) reporter implementation to write [hapi](http://hapijs.com/) server events to a [bunyan](https://github.com/trentm/node-bunyan/) logger.

## Install

```
npm install good-bunyan --save
```

## Usage

### `new GoodBunyan(events, config)`
Creates a new GoodBunyan object with the following arguments:

- `events` - an object of key value pairs.
  - `key` - one of the supported [good events](https://github.com/hapijs/good) indicating the hapi event to subscribe to
  - `value` - a single string or an array of strings to filter incoming events. "\*" indicates no filtering. `null` and `undefined` are assumed to be "\*"
- `config` - configuration object with the following available keys:
  - `logger` **(required)**: [bunyan](https://github.com/trentm/node-bunyan/) logger instance;
  - `levels`: object used to set the default bunyan level for each good event type. Each key is a [good event](https://github.com/hapijs/good) (`ops`, `response`, `log`, `error` and `request`), and the values must be a [bunyan level](https://github.com/trentm/node-bunyan#levels) (`trace`, `debug`, `info`, `error` or `fatal`). Please note that `good-bunyan` will first try to look for a valid bunyan level within the event tags (e.g. using the tag ['error', 'handler'] will result in using the bunyan 'error' level);
  - `formatters`: object used to override the message passed to buyan. Each key is a [good event](https://github.com/hapijs/good) (`ops`, `response`, `log`, `error` and `request`), and the values must be functions which take an object `data` as the argument and output either a `string` or an `array` of arguments to be passed to the bunyan log method. Default formatters functions can be find [here](lib/formatters.js).

### Example

```javascript
const Hapi = require('hapi');
const bunyan = require('bunyan');

const logger = bunyan.createLogger({ name: 'myapp' });
const server = new Hapi.Server();
server.connection({ host: 'localhost' });

const options = {
  reporters: {
    bunyan: [{
      module: 'good-bunyan',
      args: [
        {ops: '*', response: '*', log: '*', error: '*', request: '*'},
        {
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
      ]
    }]
  }
};

server.register({
  register: require('good'),
  options: options
}, (err) => {
    if (err) {
      throw err;
    }

    server.start((err) => {
      if (err) {
        throw err;
      }

      server.log('info', 'Server started at ' + server.info.uri);
    });
});
```

## Compatibility

`good-bunyan` complies with the `good 7.x.x` [API](https://github.com/hapijs/good/blob/master/API.md).

## Credits

Inspired by [good-console](https://github.com/hapijs/good-console/).
