import assert = require('assert');
import { PongReceiver, PONG_RESPONSE } from './PongReceiver';

describe('PongReceiver', () => {
  describe('pull', () => {
    it('should return null if the buffer is not ready', () => {
      const r = new PongReceiver();
      assert(r.pull() === null);
    });
    it('should return true when a PONG response is received by the buffer', () => {
      const r = new PongReceiver();
      r.store(Buffer.from(PONG_RESPONSE));
      assert(r.pull() === true);
    });
    it('should return false when the buffer receives a false response', () => {
      const r = new PongReceiver();
      r.store(Buffer.from('\r\nERROR\r\n'));
      assert(r.pull() === false);
    });
  });
});
