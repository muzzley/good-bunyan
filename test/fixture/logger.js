'use strict';

const bunyan = require('bunyan');
const stream = require('stream');

exports = module.exports = function () {
  const writableStream = stream.Writable();
  const logger = bunyan.createLogger({
    name: 'good-bunyan-tests',
    level: 'trace',
    stream: writableStream
  });

  return {
    outStream: writableStream,
    logger: logger
  };
};
