import assert = require('assert');
import { ResponseReceiver, UNINITIALIZED_DATA_SIZE } from './ResponseReceiver';

describe('ResponseReceiver', () => {
  describe('store', () => {
    it('should store buffer', () => {
      const r = new ResponseReceiver();
      assert(r.isReady() === false);
      assert(r.getResponseSize() === UNINITIALIZED_DATA_SIZE);
      r.store(Buffer.from('*PIC'));
      assert(r.isReady() === false);
      assert(r.getResponseSize() === UNINITIALIZED_DATA_SIZE);
      r.store(Buffer.concat([Buffer.from(':'), Buffer.from([0x01])], 2));
      assert(r.isReady() === true);
      assert(r.getResponseSize() === UNINITIALIZED_DATA_SIZE);
      r.store(Buffer.from([0x02]));
      assert(r.isReady() === true);
      assert(r.getResponseSize() === UNINITIALIZED_DATA_SIZE);
      r.store(Buffer.from([0x03]));
      assert(r.isReady() === true);
      assert(r.getResponseSize() === (0x02 | 0x03 << 8));
    });
  });
  describe('pull', () => {
    it('should return response', () => {
      const r = new ResponseReceiver();
      r.store(Buffer.from('*PIC:'));
      r.store(Buffer.from([0x01, 0x00, 0x00, 0x01]));
      assert(r.pull() === null);
      r.store(Buffer.from('\r\nOK\r\n'));
      const res = r.pull();
      assert(res.status === 0x01);
      assert(res.size === 0x00);
      assert(res.parity === 0x01);
    });
  });
});