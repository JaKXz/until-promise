/* global sandbox:false*/
import until, { setup } from '../../src';
// only to test `setup({promise})` function
import Bluebird from 'bluebird';

describe('#until', function () {
  let func;
  let condition;
  let attempts;

  beforeEach(() => {
    attempts = 0;
    func = sandbox.spy(() => {
      attempts++;
      return attempts;
    });
    condition = (res) => res === 6;
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
      return until(func, condition, { wait: 100, duration: 400 })
      .then(() => {
        throw new Error('should have failed');
      }, (err) => {
        err.message.should.match(/after \d+ms/);
        // it sometimes take a little more time than expected
        // the goal is to prove that it fails at ~300ms, so before 400ms
        err.nbAttempts.should.eq(4);
        err.duration.should.be.below(450);
      });
    });

    it('should succeeded if the condition is  satistied before Y ms', function () {
      return until(func, condition, { wait: 10, duration: 80 }).should.become(6);
    });

    describe('when `duration` is not a multiple of `wait`', function () {
      it('should fail as soon as possible', function () {
        return until(func, condition, { wait: 100, duration: 150 })
          .then(() => {
            throw new Error('should have failed');
          }, (err) => {
            err.message.should.match(/after \d+ms/);
            // it sometimes take a little more time than expected
            // the goal is to prove that it fails at ~150ms, so before 200ms
            err.nbAttempts.should.eq(2);
            err.duration.should.be.below(185);
          });
      });
    });
  });

  // for documentation purposes
  describe('when the function returns a promise generated by another library', function () {
    it('will not return a promise from that library', function () {
      const promise = until(() => Bluebird.resolve(), () => true);
      promise.should.not.respondTo('map');
      return promise;
    });
    it('can be wrapped using `promiseLib.resolve()`', function () {
      const promise = Bluebird.resolve(until(() => Bluebird.resolve(), () => true));
      promise.should.respondTo('map');
      return promise;
    });
  });

  describe('#setup()', function () {
    it('should allow to configure `until-promise` so it uses a custom promise library', function () {
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
