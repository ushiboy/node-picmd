import assert = require('assert');
import { hexlify, calcParity, formatAtCommand, parseResponse } from './util';

describe('formatAtCommand', () => {
  it('return at command string', () => {
    assert(formatAtCommand(0x01).equals(Buffer.from('AT*PIC=01000001\r\n')));
    assert(formatAtCommand(0x02, Buffer.from([1, 2])).equals(Buffer.from('AT*PIC=020200010203\r\n')));
  });
});

describe('parseResponse', () => {
  it('return parsed response', () => {
    const b = Buffer.from('*PIC:\x01\x02\x00\x03\x04\x04\r\n');
    const r = parseResponse(b);
    assert(r.status === 0x01);
    assert(r.size === 0x0002);
    assert(r.value.equals(Buffer.from([0x03, 0x04])));
    assert(r.parity === 0x04);
  });
});

describe('hexlify', () => {
  it('return hex string', () => {
    assert(hexlify(0x00) === '00');
    assert(hexlify(0x01) === '01');
    assert(hexlify(0x0f) === '0f');
    assert(hexlify(0x10) === '10');
    assert(hexlify(0xf0) === 'f0');
    assert(hexlify(0xff) === 'ff');
  });
});

describe('calcParity', () => {
  it('return parity', () => {
    assert(calcParity([0x01, 0x00, 0x00]) === 0x01);
    assert(calcParity([0x01, 0x01, 0x00, 0x00]) === 0x00);
    assert(calcParity([0x01, 0x01, 0x00, 0x01]) === 0x01);
    assert(calcParity([0x01, 0x02, 0x00, 0x01, 0x00]) === 0x02);
  });
});
