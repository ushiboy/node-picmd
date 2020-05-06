import assert = require('assert');
import { calcParity, formatAtCommand, parseResponse } from './util';

describe('formatAtCommand', () => {
  it('should return a command buffer', () => {
    assert(formatAtCommand(0x01)
      .equals(Buffer.from('AT*PIC=\x01\x00\x00\x01\r\n')));
    assert(formatAtCommand(0x02, Buffer.from([1, 2]))
      .equals(Buffer.from('AT*PIC=\x02\x02\x00\x01\x02\x03\r\n')));
    const b = formatAtCommand(0x03, Buffer.alloc(0xffff)).slice(0, 10);
    const e = Buffer.concat([Buffer.from('AT*PIC=\x03'), Buffer.from([0xff, 0xff])], 10);
    assert(b.equals(e));
  });
});

describe('parseResponse', () => {
  it('should return a parsed response', () => {
    const b = Buffer.from('*PIC:\x01\x02\x00\x03\x04\x04\r\n');
    const r = parseResponse(b);
    assert(r.status === 0x01);
    assert(r.size === 0x0002);
    assert(r.value.equals(Buffer.from([0x03, 0x04])));
    assert(r.parity === 0x04);
  });
  it('should raise an error if the parity is incorrect', () => {
    const b = Buffer.from('*PIC:\x01\x00\x00\x02\r\n');
    assert.throws(() => {
      parseResponse(b);
    }, {
      message: 'Invalid parity'
    });
  });
});

describe('calcParity', () => {
  it('should return parity', () => {
    assert(calcParity([0x01, 0x00, 0x00]) === 0x01);
    assert(calcParity([0x01, 0x01, 0x00, 0x00]) === 0x00);
    assert(calcParity([0x01, 0x01, 0x00, 0x01]) === 0x01);
    assert(calcParity([0x01, 0x02, 0x00, 0x01, 0x00]) === 0x02);
  });
});
