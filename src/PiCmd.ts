import * as SerialPort from 'serialport';

class PiCmd {

    private serialPort: SerialPort

    constructor(serialPort: SerialPort) {
        this.serialPort = serialPort;
    }
}

export function formatAtCommand(command: number): string;
export function formatAtCommand(command: number, data: Buffer): string;
export function formatAtCommand(command: number, data?: Buffer): string {
  const buf = Array.from(data || []);
  const size = buf.length;
  const s1 = size & 0x00ff;
  const s2 = (size & 0xff00) >> 8;
  const values = [command, s1, s2].concat(buf);
  const parity = calcParity(values);
  return `AT*CMD=${values.concat([parity]).map(hexlify).join('')}\r\n`;
}

export function hexlify(value: number): string {
  return ('00' + (value).toString(16)).slice(-2);
}

export function calcParity(values: number[]): number {
  return values.reduce((p, v) => {
    return p ^ v;
  }, 0x00);
}
