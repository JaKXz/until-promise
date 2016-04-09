/* global sandbox:false*/
import until, { setup } from '../../src';
// only to test `setup({promise})` function
import Bluebird from 'bluebird';

describe('#until', function () {
  let func;
  let condition = (res) => res === 6;
  let attempts;

  beforeEach(() => {
    attempts = 0;
    func = sandbox.spy(() => {
      attempts++;
      return attempts;
    });
  });

  it('should return a promise', function () {
    return until(() => 1, (res) => res === 1).should.become(1);
  });

  it('should also work when `func` returns a promise', function () {
    return until(() => Promise.resolve(2), (res) => res === 2).should.become(2);
  });

  describe('when used without options', function () {
    it('should execute the function until the condition is satistied', function () {
      return until(func, condition).then(() => {
        func.should.have.callCount(6);
      });
    });
  });

  describe('when used with `retries` option', function () {
    it('should fail if the condition is not satistied after X retries', function () {
      return until(func, condition, { retries: 5 }).should.be.rejectedWith(/after 5 attempts/);
    });
  });

  describe('when used with `retries` option', function () {
    it('should fail if the condition is not satistied after X retries', function () {
      return until(func, condition, { retries: 5 }).should.be.rejectedWith(/after 5 attempts/);
    });
    it('should succeeded if the condition is  satistied before X retries', function () {
      return until(func, condition, { retries: 7 }).should.become(6);
    });
  });

  describe('when used with `duration` option', function () {
    it('should fail if the condition is not satistied after Y ms', function () {
      return until(func, condition, { wait: 1, duration: 5 }).should.be.rejectedWith(/after \d+ms/);
    });
    it('should succeeded if the condition is  satistied before Y ms', function () {
      return until(func, condition, { wait: 100, duration: 700 }).should.become(6);
    });
  });

  describe('#setup()', function () {
    it('should allow to pass a promise library', function () {
      const regularPromise = until(() => 1, (res) => res === 1);
      // regular `Promise` do not have method `delay`
      regularPromise.should.not.respondTo('delay');

      setup({ promise: Bluebird });
      const bluebirdPromise = until(() => 1, (res) => res === 1);
      // bluebird `Promise` do have method `delay`
      bluebirdPromise.should.respondTo('delay');

      return Promise.all([regularPromise, bluebirdPromise]);
    });

    afterEach(function () {
      // make sure we have regular `Promise`s
      setup();
    });
  });
});
