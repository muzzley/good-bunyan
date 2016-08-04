var Stream = require('stream');

exports = module.exports = {};

exports.readStream = function (done) {
  var result = new Stream.Readable({ objectMode: true });
  result._read = function () {};

  if (typeof done === 'function') {
    result.once('end', done);
  }

  return result;
};
