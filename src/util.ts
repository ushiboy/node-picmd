import { CommandResponse } from './data';

export function formatAtCommand(command: number): Buffer;
export function formatAtCommand(command: number, data: Buffer): Buffer;
export function formatAtCommand(command: number, data?: Buffer): Buffer {
  const buf = Array.from(data || Buffer.alloc(0));
  const size = buf.length;
  const s1 = size & 0x00ff;
  const s2 = (size & 0xff00) >> 8;
  const values = [command, s1, s2].concat(buf);
  const parity = calcParity(values);
  return Buffer.from(`AT*PIC=${values.concat([parity]).map(hexlify).join('')}\r\n`);
}

export function parseResponse(data: Buffer): CommandResponse {
  const prefix = data.slice(0, 5).toString('utf-8');
  if (prefix !== '*PIC:') {
    return;
  }
  data = data.slice(5);
  const status = data[0];
  const size = data[1] | (data[2] << 8);
  const value = data.slice(3, 3 + size);
  const parity = data.slice(3 + size)[0];
  if (parity !== calcParity(Array.from(data.slice(0, 3 + size)))) {
    throw new Error('Invalid parity');
  }
  return {
    status,
    size,
    value,
    parity
  };
}

export function hexlify(value: number): string {
  return ('00' + (value).toString(16)).slice(-2);
}

export function calcParity(values: number[]): number {
  return values.reduce((p, v) => {
    return p ^ v;
  }, 0x00);
}
