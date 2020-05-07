import assert = require('assert');
import { ResponseReceiver, UNINITIALIZED_DATA_SIZE } from './ResponseReceiver';

describe('ResponseReceiver', () => {
  describe('store', () => {
    it('should be in an accepting state when it detects a prefix', () => {
      const r = new ResponseReceiver();
      r.store(Buffer.from('*PIC'));
      assert(r.isReady() === false);
      r.store(Buffer.from(':'));
      assert(r.isReady() === true);
    });
    it('should determine the size of the response data once it reaches a fixed size', () => {
      const r = new ResponseReceiver();
      r.store(Buffer.from('*PIC:\x01'));
      assert(r.getResponseSize() === UNINITIALIZED_DATA_SIZE);
      r.store(Buffer.from('\x02\x03'));
      assert(r.getResponseSize() === (0x02 | 0x03 << 8));
    });
  });
  describe('pull', () => {
    it('should return null if the buffer is not ready', () => {
      const r = new ResponseReceiver();
      assert(r.pull() === null);
      r.store(Buffer.from('*PIC:\x01\x00\x00\x01\r\nOK\r'));
      assert(r.pull() === null);
    });
    it('should return a command response if the buffer is prepared correctly', () => {
      const r = new ResponseReceiver();
      r.store(Buffer.from('*PIC:\x01\x00\x00\x01\r\nOK\r\n'));
      const res = r.pull();
      assert(res.status === 0x01);
      assert(res.value.length === 0);
      assert(res.size === 0x00);
      assert(res.parity === 0x01);
    });
    it('should be an error if the postfix is not correct', () => {
      const r = new ResponseReceiver();
      r.store(Buffer.from('*PIC:\x01\x00\x00\x01\r\nOK\r0'));
      assert.throws(() => {
        r.pull();
      }, {
          message: 'Invalid data'
      })
    });
    it('should be an error if the parity is wrong', () => {
      const r = new ResponseReceiver();
      r.store(Buffer.from('*PIC:\x01\x00\x00\x02\r\nOK\r\n'));
      assert.throws(() => {
        r.pull();
      }, {
          message: 'Invalid parity'
      })
    });
  });
});