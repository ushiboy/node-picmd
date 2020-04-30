import { Communicator } from "./Communicator";
import { Connection } from "./Connection";
import { SerialConnection } from "./SerialConnection";

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

  async receive(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const buffers = [];
      let size = 0;
      const unsubscribe = this.conn.subscribe((buf: Buffer) => {
        buffers.push(buf);
        size += buf.length;
        if (buf.includes('\r\nOK\r\n') || buf.includes('\r\nERROR\r\n')) {
          unsubscribe();
          resolve(Buffer.concat(buffers, size));
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