var bunyan = require('bunyan');
var stream = require('stream');

exports = module.exports = function () {
  var writableStream = stream.Writable();
  var logger = bunyan.createLogger({
    name: 'good-bunyan-tests',
    level: 'trace',
    stream: writableStream
  });

  return {
    outStream: writableStream,
    logger: logger
  };
};
