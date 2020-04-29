import * as SerialPort from 'serialport';
import { Communicator } from "./Communicator";

export class SerialCommunicator implements Communicator {

  private serialPort: SerialPort

  constructor(serialPort: SerialPort) {
    this.serialPort = serialPort;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.serialPort.isOpen) {
        resolve();
      } else {
        this.serialPort.open((err) => {
          if (err) {
            if (err.message === 'Port is opening') {
              resolve();
            } else {
              reject(err);
            }
          } else {
            resolve();
          }
        });
      }
    });
  }

  async send(buffer: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      this.serialPort.write(buffer, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async receive(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const f = (buf: Buffer) => {
        if (buf.includes('\r\nOK\r\n') || buf.includes('\r\nERROR\r\n')) {
          this.serialPort.off('data', f);
          resolve(buf);
        }
      };
      this.serialPort.on('data', f);
    });
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.serialPort.isOpen) {
        resolve();
      } else {
        this.serialPort.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      }
    });
  }

}