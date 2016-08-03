/**
 * @file lib/formatters - Default formatters
 */

'use strict';

/**
 * Converts provided num in a string representing Mb amount.
 * @private
 * @param  {number} num - Number to convert in Mb
 * @return {string} String with number in Mb and "Mb" suffix
 */
const inMb = num => `${Math.round(num / (1024 * 1024))}Mb`;

/**
 * Zips data with provided tag.
 * @private
 * @param  {string} tag  - Log tag
 * @param  {object} data - Data to log
 * @return {array}  Array with data and the provided tag
 */
const withTag = (tag, data) => [data, `[${tag}]`];

/**
 * Formats payload of "ops" events.
 * @see {@link https://github.com/hapijs/good/blob/master/API.md#ops}
 * @public
 * @param  {object} payload - Event payload
 * @return {array}  Array with ops data and "[ops]" tag.
 * Ops data is an object with this interface:
 * {
 *  memory: '<Number>Mb' where <Number> is 'resident set size' - the amount of the process held in memory
 *  uptime: '<Number>s' where <Number> is uptime of the running process in seconds
 *  load: <String> with useful information (requests, concurrents connections, response times, sockets)
 * }
 */
const ops = payload => withTag('ops', {
  memory: inMb(payload.proc.mem.rss),
  uptime: `${payload.proc.uptime}s`,
  load  : payload.os.load.join(', ')
});

/**
 * Formats payload of "response" events.
 * @see {@link https://github.com/hapijs/good/blob/master/API.md#requestsent}
 * @public
 * @param  {object} payload - Event payload
 * @return {array}  Array with response data and "[response]" tag.
 * Response data is an object with this interface:
 * {
 *  instance: <String> maps to request.connection.info.uri
 *  method: <String> method used by the request - Maps to request.method
 *  path: <String> incoming path requested - maps to request.path
 *  statusCode: <Number> the status code of the response
 *  responseTime: `<Number>ms` where <Number> is calculated value of Date.now() - request.info.received
 *  responsePayload: <String> stringified version of responsePayload (if any)
 *  query: <String> stringified version of query object used by request - maps to request.query
 * }
 */
const response = payload => {
  const res = {
    instance    : payload.instance,
    method      : payload.method,
    path        : payload.path,
    statusCode  : payload.statusCode,
    responseTime: `${payload.responseTime}ms`,
    query       : payload.query
  };

  return withTag('response', {res});
};

/**
 * Formats payload of "error" events.
 * @see {@link https://github.com/hapijs/good/blob/master/API.md#requesterror}
 * @public
 * @param  {object} payload - Event payload
 * @return {array}  Array with error data, a "[error]" tag and the error message.
 * Error data is an object with this interface:
 * {
 *  err: <Object> the raw error object
 * }
 */
const error = payload => withTag('error', {err: payload.error}).concat([payload.error.message]);

/**
 * Formats payload of "log" events with simple formatter.
 * @see {@link https://github.com/hapijs/good/blob/master/API.md#serverlog}
 * @see simple
 * @public
 * @param  {object} payload - Event payload
 * @return {array}  Array with log data and a "[log]"
 */
const log = payload => {
  const message = withTag('log', payload.data);

  // Reverse message when payload.data is not an object in order to level out log
  return typeof payload.data !== 'object' ? message.reverse() : message;
}

/**
 * Formats payload of "request" events with simple formatter.
 * @see {@link https://github.com/hapijs/good/blob/master/API.md#requestlog}
 * @see simple
 * @public
 * @param  {object} payload - Event payload
 * @return {array}  Array with request data and a "[request]" tag
 */
const request = payload => withTag('request', {req: payload});

module.exports = {
  ops,
  response,
  error,
  log,
  request
};
