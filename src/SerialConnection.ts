import * as SerialPort from 'serialport';
import { Connection, Unsubscribe } from './Connection';

export class SerialConnection implements Connection {

  private serialPort: SerialPort

  constructor(serialPort: SerialPort) {
    this.serialPort = serialPort;
  }

  isOpen(): boolean {
    return this.serialPort.isOpen;
  }

  open(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.serialPort.open(err => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  write(buffer: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      this.serialPort.write(buffer, err => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  subscribe(fn: (buffer: Buffer) => void): Unsubscribe {
    this.serialPort.on('data', fn);
    return (): void => {
      this.serialPort.off('data', fn);
    };
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.serialPort.close(err => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  static create(port: string): SerialConnection {
    return new SerialConnection(new SerialPort(port, {
      baudRate: 115200
    }));
  }

}