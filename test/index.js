'use strict';

const Lab = require('lab');
const Code = require('code');
const Hoek = require('hoek');
const logFixture = require('./fixture/logger');

const Streams = require('./fixture/streams');

const GoodBunyan = require('..');
const events = { error: '*', log: '*', response: '*', request: '*', ops: '*' };

const internals = {
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

internals.log = {
  event: 'log',
  timestamp: 1458264810957,
  tags: ['user', 'info'],
  data: 'you made a server log',
  pid: 64291
};

// Test shortcuts

const lab = exports.lab = Lab.script();
const expect = Code.expect;
const describe = lab.describe;
const it = lab.it;

describe('good-bunyan', () => {
  describe('report', () => {
    describe('response events', () => {
      it('returns a formatted object for "response" events', { plan: 7 }, () => {
        const fixture = logFixture();
        const reporter = new GoodBunyan(events, {
          logger: fixture.logger,
          levels: {
            ops: 'debug'
          }
        });

        const reader = new Streams.Reader();

        reader.pipe(reporter);
        reader.push(internals.response);
        reader.push(null);

        return new Promise((resolve) => {
          fixture.outStream._write = function (ev) {
            const logObject = JSON.parse(ev);
            expect(logObject.res.query).to.be.equal('{"name":"adam"}');
            expect(logObject.res.instance).to.be.equal('http://localhost:61253');
            expect(logObject.res.method).to.be.equal('post');
            expect(logObject.res.path).to.be.equal('/data');
            expect(logObject.res.statusCode).to.be.equal(200);
            expect(logObject.res.responseTime).to.be.equal('150ms');
            expect(logObject.msg).to.be.equal('[response]');
            resolve();
          };
        });
      });

      it('returns a formatted object for "response" events without a query', { plan: 7 }, () => {
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

        return new Promise((resolve) => {
          fixture.outStream._write = function (ev) {
            const logObject = JSON.parse(ev);
            expect(logObject.res.query).to.not.exist();
            expect(logObject.res.instance).to.be.equal('http://localhost:61253');
            expect(logObject.res.method).to.be.equal('post');
            expect(logObject.res.path).to.be.equal('/data');
            expect(logObject.res.statusCode).to.be.equal(200);
            expect(logObject.res.responseTime).to.be.equal('150ms');
            expect(logObject.msg).to.be.equal('[response]');
            resolve();
          };
        });
      });

      it('returns a formatted object for "response" events with "head" as method', { plan: 7 }, () => {
        const fixture = logFixture();
        const reporter = new GoodBunyan(events, {
          logger: fixture.logger,
          levels: {
            ops: 'debug'
          }
        });
        const event = Hoek.clone(internals.response);
        event.method = 'head';
        const reader = new Streams.Reader();

        reader.pipe(reporter);
        reader.push(event);
        reader.push(null);

        return new Promise((resolve) => {
          fixture.outStream._write = function (ev) {
            const logObject = JSON.parse(ev);
            expect(logObject.res.query).to.be.equal('{"name":"adam"}');
            expect(logObject.res.instance).to.be.equal('http://localhost:61253');
            expect(logObject.res.method).to.be.equal('head');
            expect(logObject.res.path).to.be.equal('/data');
            expect(logObject.res.statusCode).to.be.equal(200);
            expect(logObject.res.responseTime).to.be.equal('150ms');
            expect(logObject.msg).to.be.equal('[response]');
            resolve();
          };
        });
      });

      it('returns a formatted object for "response" events with a circular data object', { plan: 8 }, () => {
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

        return new Promise((resolve) => {
          fixture.outStream._write = function (ev) {
            const logObject = JSON.parse(ev);
            expect(logObject.res.query).to.be.equal('{"name":"adam"}');
            expect(logObject.res.responsePayload).to.be.equal('{"x":"y","z":"[Circular]"}');
            expect(logObject.res.instance).to.be.equal('http://localhost:61253');
            expect(logObject.res.method).to.be.equal('post');
            expect(logObject.res.path).to.be.equal('/data');
            expect(logObject.res.statusCode).to.be.equal(200);
            expect(logObject.res.responseTime).to.be.equal('150ms');
            expect(logObject.msg).to.be.equal('[response]');
            resolve();
          };
        });
      });
    });

    describe('ops events', () => {
      it('returns an "ops" event', { plan: 4 }, () => {
        const fixture = logFixture();
        const reporter = new GoodBunyan(events, {
          logger: fixture.logger,
          levels: {
            ops: 'debug'
          }
        });
        const reader = new Streams.Reader();

        reader.pipe(reporter);
        reader.push(internals.ops);
        reader.push(null);

        return new Promise((resolve) => {
          fixture.outStream._write = function (ev) {
            const logObject = JSON.parse(ev);
            expect(logObject.memory).to.be.equal('29Mb');
            expect(logObject.uptime).to.be.equal('6s');
            expect(logObject.load).to.be.equal('1.650390625, 1.6162109375, 1.65234375');
            expect(logObject.msg).to.be.equal('[ops]');
            resolve();
          };
        });
      });
    });

    describe('error events', () => {
      it('returns a formatted string for "error" events', { plan: 3 }, () => {
        const fixture = logFixture();
        const reporter = new GoodBunyan(events, {
          logger: fixture.logger,
          levels: {
            ops: 'debug'
          }
        });
        const reader = new Streams.Reader();

        reader.pipe(reporter);
        reader.push(internals.error);
        reader.push(null);

        return new Promise((resolve) => {
          fixture.outStream._write = function (ev) {
            const logObject = JSON.parse(ev);
            expect(logObject.err).to.exist();
            expect(logObject.err.message).to.be.equal('Just a simple error');
            expect(logObject.msg).to.be.equal('[error] Just a simple error');
            resolve();
          };
        });
      });
    });

    describe('request events', () => {
      it('returns a formatted string for "request" events', { plan: 2 }, () => {
        const fixture = logFixture();
        const reporter = new GoodBunyan(events, {
          logger: fixture.logger,
          levels: {
            ops: 'debug'
          }
        });

        const reader = new Streams.Reader();

        reader.pipe(reporter);
        reader.push(internals.request);
        reader.push(null);

        return new Promise((resolve) => {
          fixture.outStream._write = function (ev) {
            const logObject = JSON.parse(ev);
            expect(logObject.req.data).to.be.equal('you made a request');
            expect(logObject.msg).to.be.equal('[request]');
            resolve();
          };
        });
      });
    });

    describe('log and default events', () => {
      it('returns a formatted string for "log" and "default" events', { plan: 2 }, () => {
        const fixture = logFixture();
        const reporter = new GoodBunyan(events, {
          logger: fixture.logger,
          levels: {
            ops: 'debug'
          }
        });

        const reader = new Streams.Reader();

        reader.pipe(reporter);
        reader.push(internals.default);
        reader.push(null);

        return new Promise((resolve) => {
          fixture.outStream._write = function (ev) {
            const logObject = JSON.parse(ev);
            expect(logObject.req.data).to.be.equal('you made a default');
            expect(logObject.msg).to.be.equal('[request]');
            resolve();
          };
        });
      });

      it('returns a formatted string for "default" events without data', { plan: 2 }, () => {
        const fixture = logFixture();
        const reporter = new GoodBunyan(events, {
          logger: fixture.logger,
          levels: {
            ops: 'debug'
          }
        });

        const event = Hoek.clone(internals.default);
        delete event.data;
        const reader = new Streams.Reader();

        reader.pipe(reporter);
        reader.push(event);
        reader.push(null);

        return new Promise((resolve) => {
          fixture.outStream._write = function (ev) {
            const logObject = JSON.parse(ev);
            expect(logObject.req.data).to.be.undefined();
            expect(logObject.msg).to.be.equal('[request]');
            resolve();
          };
        });
      });

      it('returns a formatted string for "default" events with data as object', { plan: 3 }, () => {
        const fixture = logFixture();
        const reporter = new GoodBunyan(events, {
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

        return new Promise((resolve) => {
          fixture.outStream._write = function (ev) {
            const logObject = JSON.parse(ev);
            expect(logObject.req.data).to.be.an.object();
            expect(logObject.req.data).to.only.include({ hello: 'world' });
            expect(logObject.msg).to.be.equal('[request]');
            resolve();
          };
        });
      });
    });

    describe('log events', () => {
      it('returns a formatted string for "log" events with data as string', { plan: 1 }, () => {
        const fixture = logFixture();
        const reporter = new GoodBunyan(events, {
          logger: fixture.logger,
          levels: {
            ops: 'debug'
          }
        });

        const event = Hoek.clone(internals.log);
        const reader = new Streams.Reader();

        reader.pipe(reporter);
        reader.push(event);
        reader.push(null);

        return new Promise((resolve) => {
          fixture.outStream._write = function (ev) {
            const logObject = JSON.parse(ev);
            expect(logObject.msg).to.be.equal('[log] you made a server log');
            resolve();
          };
        });
      });

      it('returns a formatted string for "log" events with data as object', { plan: 4 }, () => {
        const fixture = logFixture();
        const reporter = new GoodBunyan(events, {
          logger: fixture.logger,
          levels: {
            ops: 'debug'
          }
        });

        const event = Hoek.clone(internals.log);
        event.data = { foo: 'bar', baz: { zoo: 100 } };
        const reader = new Streams.Reader();

        reader.pipe(reporter);
        reader.push(event);
        reader.push(null);

        return new Promise((resolve) => {
          fixture.outStream._write = function (ev) {
            const logObject = JSON.parse(ev);
            expect(logObject.foo).to.be.equal('bar');
            expect(logObject.baz).to.be.an.object();
            expect(logObject.baz.zoo).to.be.equal(100);
            expect(logObject.msg).to.be.equal('[log]');
            resolve();
          };
        });
      });

      it('returns a formatted string for "log" events with data as object and a custom `msg`', { plan: 4 }, () => {
        const fixture = logFixture();
        const reporter = new GoodBunyan(events, {
          logger: fixture.logger,
          levels: {
            ops: 'debug'
          }
        });

        const event = Hoek.clone(internals.log);
        event.data = { msg: 'hello world', foo: 'bar', baz: { zoo: 100 } };
        const reader = new Streams.Reader();

        reader.pipe(reporter);
        reader.push(event);
        reader.push(null);

        return new Promise((resolve) => {
          fixture.outStream._write = function (ev) {
            const logObject = JSON.parse(ev);
            expect(logObject.foo).to.be.equal('bar');
            expect(logObject.baz).to.be.an.object();
            expect(logObject.baz.zoo).to.be.equal(100);
            expect(logObject.msg).to.be.equal('[log] hello world');
            resolve();
          };
        });
      });
    });
  });
});
