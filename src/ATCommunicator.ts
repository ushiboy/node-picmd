import { Communicator } from "./Communicator";
import { Connection } from "./Connection";
import { ResponseReceiver } from './ResponseReceiver';
import { SerialConnection } from "./SerialConnection";
import { CommandResponse } from './data';

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

  async send(buffer: Buffer): Promise<void> {
    await this.conn.write(buffer);
  }

  async receive(timeout: number = 60000): Promise<CommandResponse> {
    return new Promise((resolve, reject) => {
      const receiver = new ResponseReceiver();
      const timer = setTimeout(() => {
        reject(new Error('Timeout'));
      }, timeout);
      const unsubscribe = this.conn.subscribe((buf: Buffer) => {
        receiver.store(buf);
        const res = receiver.pull();
        if (res) {
          clearTimeout(timer);  // cancel reject
          unsubscribe();
          resolve(res);
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