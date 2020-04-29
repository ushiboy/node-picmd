import { Response } from './data';

export function formatAtCommand(command: number): string;
export function formatAtCommand(command: number, data: Buffer): string;
export function formatAtCommand(command: number, data?: Buffer): string {
  const buf = Array.from(data || []);
  const size = buf.length;
  const s1 = size & 0x00ff;
  const s2 = (size & 0xff00) >> 8;
  const values = [command, s1, s2].concat(buf);
  const parity = calcParity(values);
  return `AT*PIC=${values.concat([parity]).map(hexlify).join('')}\r\n`;
}

export function parseResponse(data: Buffer): Response {
  const prefix = data.slice(0, 5).toString('utf-8');
  if (prefix !== '*PIC:') {
    return;
  }
  data = data.slice(5);
  const status = data[0];
  const size = data[1] | (data[2] << 8);
  const value = data.slice(3, 3 + size);
  const parity = data.slice(3 + size)[0];
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