import assert = require('assert');
import { hexlify, calcParity, formatAtCommand, parseResponse } from './util';

describe('formatAtCommand', () => {
  it('return at command string', () => {
    assert(formatAtCommand(0x01) === 'AT*PIC=01000001\r\n');
    assert(formatAtCommand(0x02, Buffer.from([1, 2])) === 'AT*PIC=020200010203\r\n');
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

describe('parseResponse', () => {
  it('return parsed response', () => {
    const b = Buffer.concat([
      Buffer.from('*PIC:'),
      Buffer.from('010200030400', 'hex'),
      Buffer.from('\r\n')
    ]);
    const r = parseResponse(b);
    assert(r.status === 0x01);
  });
});