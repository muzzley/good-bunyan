var Lab = require('lab');
var Code = require('code');
var Hoek = require('hoek');
var logFixture = require('./fixture/logger');

var Streams = require('./fixture/streams');

var GoodBunyan = require('..');
var events = { error: '*', log: '*', response: '*', request: '*', ops: '*' };

var internals = {
  defaults: {
    format: 'YYMMDD/HHmmss.SSS'
  }
};

internals.ops = {
  event: 'ops',
  timestamp: 1458264810957,
  host: 'localhost',
  pid: 64291,
  os: {
    load: [1.650390625, 1.6162109375, 1.65234375],
    mem: { total: 17179869184, free: 8190681088 },
    uptime: 704891
  },
  proc: {
    uptime: 6,
    mem: {
      rss: 30019584,
      heapTotal: 18635008,
      heapUsed: 9989304
    },
    delay: 0.03084501624107361
  },
  load: {
    requests: {},
    concurrents: {},
    responseTimes: {},
    listener: {},
    sockets: { http: {}, https: {} }
  }
};

internals.response = {
  event: 'response',
  timestamp: 1458264810957,
  id: '1458264811279:localhost:16014:ilx17kv4:10001',
  instance: 'http://localhost:61253',
  labels: [],
  method: 'post',
  path: '/data',
  query: {
    name: 'adam'
  },
  responsePayload: {
    hello: 'world'
  },
  responseTime: 150,
  statusCode: 200,
  pid: 16014,
  httpVersion: '1.1',
  source: {
    remoteAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.87 Safari/537.36',
    referer: 'http://localhost:61253/'
  }
};

internals.request = {
  event: 'request',
  timestamp: 1458264810957,
  tags: ['user', 'info'],
  data: 'you made a request',
  pid: 64291,
  id: '1419005623332:new-host.local:48767:i3vrb3z7:10000',
  method: 'get',
  path: '/'
};

internals.error = {
  event: 'error',
  timestamp: 1458264810957,
  id: '1419005623332:new-host.local:48767:i3vrb3z7:10000',
  tags: ['user', 'info'],
  url: 'http://localhost/test',
  method: 'get',
  pid: 64291,
  error: {
    message: 'Just a simple error',
    stack: 'Error: Just a simple Error'
  }
};

internals.default = {
  event: 'request',
  timestamp: 1458264810957,
  tags: ['user', 'info'],
  data: 'you made a default',
  pid: 64291
};

// Test shortcuts

var lab = exports.lab = Lab.script();
var expect = Code.expect;
var describe = lab.describe;
var it = lab.it;

describe('good-bunyan', function () {
  describe('report', function () {
    describe('response events', function () {
      it('returns a formatted object for "response" events', { plan: 7 }, function (done) {

        const fixture = logFixture();
        const reporter = new GoodBunyan(events, {
          logger: fixture.logger,
          levels: {
            ops: 'debug'
          }
        });
        const event = Hoek.clone(internals.response);
        const reader = new Streams.Reader();

        reader.pipe(reporter);
        reader.push(internals.response);
        reader.push(null);

        fixture.outStream._write = function (ev) {
          var logObject = JSON.parse(ev);
          expect(logObject.res.query).to.be.equal('{"name":"adam"}');
          expect(logObject.res.instance).to.be.equal('http://localhost:61253');
          expect(logObject.res.method).to.be.equal('post');
          expect(logObject.res.path).to.be.equal('/data');
          expect(logObject.res.statusCode).to.be.equal(200);
          expect(logObject.res.responseTime).to.be.equal('150ms');
          expect(logObject.msg).to.be.equal('[response]');
          done();
        };
      });

      it('returns a formatted object for "response" events without a query', { plan: 7 }, function (done) {
        const fixture = logFixture();
        const reporter = new GoodBunyan(events, {
          logger: fixture.logger,
          levels: {
            ops: 'debug'
          }
        });
        const event = Hoek.clone(internals.response);
        delete event.query;
        const reader = new Streams.Reader();

        reader.pipe(reporter);
        reader.push(event);
        reader.push(null);

        fixture.outStream._write = function (ev) {
          var logObject = JSON.parse(ev);
          expect(logObject.res.query).to.not.exist();
          expect(logObject.res.instance).to.be.equal('http://localhost:61253');
          expect(logObject.res.method).to.be.equal('post');
          expect(logObject.res.path).to.be.equal('/data');
          expect(logObject.res.statusCode).to.be.equal(200);
          expect(logObject.res.responseTime).to.be.equal('150ms');
          expect(logObject.msg).to.be.equal('[response]');
          done();
        };
      });

      it('returns a formatted object for "response" events with "head" as method', { plan: 7 }, function (done) {
        var fixture = logFixture();
        var reporter = new GoodBunyan(events, {
          logger: fixture.logger,
          levels: {
            ops: 'debug'
          }
        });
        var event = Hoek.clone(internals.response);
        event.method = 'head';
        const reader = new Streams.Reader();

        reader.pipe(reporter);
        reader.push(event);
        reader.push(null);

        fixture.outStream._write = function (ev) {
          var logObject = JSON.parse(ev);
          expect(logObject.res.query).to.be.equal('{"name":"adam"}');
          expect(logObject.res.instance).to.be.equal('http://localhost:61253');
          expect(logObject.res.method).to.be.equal('head');
          expect(logObject.res.path).to.be.equal('/data');
          expect(logObject.res.statusCode).to.be.equal(200);
          expect(logObject.res.responseTime).to.be.equal('150ms');
          expect(logObject.msg).to.be.equal('[response]');
          done();
        };
      });

      it('returns a formatted object for "response" events with a circular data object', { plan: 8 }, function (done) {
        const fixture = logFixture();
        const reporter = new GoodBunyan(events, {
          logger: fixture.logger,
          levels: {
            ops: 'debug'
          }
        });
        const event = Hoek.clone(internals.response);
        event.responsePayload = {
          x: 'y'
        };
        event.responsePayload.z = event.responsePayload;
        const reader = new Streams.Reader();

        reader.pipe(reporter);
        reader.push(event);
        reader.push(null);

        fixture.outStream._write = function (ev) {
          var logObject = JSON.parse(ev);
          expect(logObject.res.query).to.be.equal('{"name":"adam"}');
          expect(logObject.res.responsePayload).to.be.equal('{"x":"y","z":"[Circular]"}');
          expect(logObject.res.instance).to.be.equal('http://localhost:61253');
          expect(logObject.res.method).to.be.equal('post');
          expect(logObject.res.path).to.be.equal('/data');
          expect(logObject.res.statusCode).to.be.equal(200);
          expect(logObject.res.responseTime).to.be.equal('150ms');
          expect(logObject.msg).to.be.equal('[response]');
          done();
        };
      });
    });

    describe('ops events', function () {
      it('returns an "ops" event', { plan: 4 }, function (done) {
        var fixture = logFixture();
        var reporter = new GoodBunyan(events, {
          logger: fixture.logger,
          levels: {
            ops: 'debug'
          }
        });
        const reader = new Streams.Reader();

        reader.pipe(reporter);
        reader.push(internals.ops);
        reader.push(null);

        fixture.outStream._write = function (ev) {
          var logObject = JSON.parse(ev);
          expect(logObject.memory).to.be.equal('29Mb');
          expect(logObject.uptime).to.be.equal('6s');
          expect(logObject.load).to.be.equal('1.650390625, 1.6162109375, 1.65234375');
          expect(logObject.msg).to.be.equal('[ops]');
          done();
        };
      });
    });

    describe('error events', function () {
      it('returns a formatted string for "error" events', { plan: 3 }, function (done) {
        var fixture = logFixture();
        var reporter = new GoodBunyan(events, {
          logger: fixture.logger,
          levels: {
            ops: 'debug'
          }
        });
        const reader = new Streams.Reader();

        reader.pipe(reporter);
        reader.push(internals.error);
        reader.push(null);

        fixture.outStream._write = function (ev) {
          var logObject = JSON.parse(ev);
          expect(logObject.err).to.exist();
          expect(logObject.err.message).to.be.equal('Just a simple error');
          expect(logObject.msg).to.be.equal('[error] Just a simple error');
          done();
        };
      });
    });

    describe('request events', function () {
      it('returns a formatted string for "request" events', { plan: 2 }, function (done) {
        var fixture = logFixture();
        var reporter = new GoodBunyan(events, {
          logger: fixture.logger,
          levels: {
            ops: 'debug'
          }
        });

        const reader = new Streams.Reader();

        reader.pipe(reporter);
        reader.push(internals.request);
        reader.push(null);

        fixture.outStream._write = function (ev) {
          var logObject = JSON.parse(ev);
          expect(logObject.req.data).to.be.equal('you made a request');
          expect(logObject.msg).to.be.equal('[request]');
          done();
        };
      });
    });

    describe('log and default events', function () {
      it('returns a formatted string for "log" and "default" events', { plan: 2 }, function (done) {
        var fixture = logFixture();
        var reporter = new GoodBunyan(events, {
          logger: fixture.logger,
          levels: {
            ops: 'debug'
          }
        });

        const reader = new Streams.Reader();

        reader.pipe(reporter);
        reader.push(internals.default);
        reader.push(null);

        fixture.outStream._write = function (ev) {
          var logObject = JSON.parse(ev);
          expect(logObject.req.data).to.be.equal('you made a default');
          expect(logObject.msg).to.be.equal('[request]');
          done();
        };
      });

      it('returns a formatted string for "default" events without data', { plan: 2 }, function (done) {
        var fixture = logFixture();
        var reporter = new GoodBunyan(events, {
          logger: fixture.logger,
          levels: {
            ops: 'debug'
          }
        });

        var event = Hoek.clone(internals.default);
        delete event.data;
        const reader = new Streams.Reader();

        reader.pipe(reporter);
        reader.push(event);
        reader.push(null);

        fixture.outStream._write = function (ev) {
          var logObject = JSON.parse(ev);
          expect(logObject.req.data).to.be.undefined();
          expect(logObject.msg).to.be.equal("[request]");
          done();
        };
      });

      it('returns a formatted string for "default" events with data as object', { plan: 3 }, function (done) {
        var fixture = logFixture();
        var reporter = new GoodBunyan(events, {
          logger: fixture.logger,
          levels: {
            ops: 'debug'
          }
        });

        const event = Hoek.clone(internals.default);
        event.data = { hello: 'world' };
        const reader = new Streams.Reader();

        reader.pipe(reporter);
        reader.push(event);
        reader.push(null);

        fixture.outStream._write = function (ev) {
          var logObject = JSON.parse(ev);
          expect(logObject.req.data).to.be.an.object();
          expect(logObject.req.data).to.only.include({ hello: 'world' });
          expect(logObject.msg).to.be.equal('[request]');
          done();
        };
      });
    });
  });
});
