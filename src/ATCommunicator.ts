import { Communicator } from "./Communicator";
import { Connection } from "./Connection";
import { ResponseReceiver } from './ResponseReceiver';
import { SerialConnection } from "./SerialConnection";
import { CommandResponse } from './data';
import { formatAtCommand } from './util';

export class ATCommunicator implements Communicator {

  private conn: Connection

  constructor(conn: Connection) {
    this.conn = conn;
  }

  async connect(): Promise<void> {
    if (this.conn.isOpen()) {
      return;
    }
    try {
      await this.conn.open();
    } catch (err) {
      if (err.message !== 'Port is opening') {
        throw err;
      }
    }
  }

  async send(command: number): Promise<void>
  async send(command: number, data: Buffer): Promise<void>
  async send(command: number, data?: Buffer): Promise<void> {
    await this.conn.write(formatAtCommand(command, data));
  }

  async receive(timeout: number = 60000): Promise<CommandResponse> {
    return new Promise((resolve, reject) => {
      const receiver = new ResponseReceiver();
      const timer = setTimeout(() => {
        reject(new Error('Timeout'));
      }, timeout);
      const unsubscribe = this.conn.subscribe((buf: Buffer) => {
        receiver.store(buf);
        try {
          const res = receiver.pull();
          if (res) {
            clearTimeout(timer);  // cancel timeout reject
            unsubscribe();
            resolve(res);
          }
        } catch (e) {
          clearTimeout(timer);  // cancel timeout reject
          unsubscribe();
          reject(e);
        }
      });
    });
  }

  async disconnect(): Promise<void> {
    if (this.conn.isOpen()) {
      await this.conn.close();
    }
  }

  static create(port: string): ATCommunicator {
    return new ATCommunicator(SerialConnection.create(port));
  }

}
