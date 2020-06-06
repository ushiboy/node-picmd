import { Communicator } from './Communicator';
import { ATCommunicator } from './ATCommunicator';
import { CommandResponse } from './data';

export interface PiCmdInterface {

  waitReady(): Promise<void>;
  waitReady(retry: number): Promise<void>;

  ping(): Promise<void>;
  ping(timeout: number): Promise<void>;

  request(command: number, timeout?: number): Promise<CommandResponse>;
  request(command: number, data: Buffer, timeout?: number): Promise<CommandResponse>;

}

export class PiCmd implements PiCmdInterface {

  private comm: Communicator

  constructor(comm: Communicator) {
    this.comm = comm;
  }

  async waitReady(retry = 20): Promise<void> {
    let count = 0;
    const waitFor = async (): Promise<void> => {
      try {
        await this.ping();
      } catch {
        if (count < retry) {
          count++;
          await waitFor();
        } else {
          throw new Error('Over the time limit');
        }
      }
    };
    await waitFor();
  }

  async ping(timeout = 2000): Promise<void> {
    await this.comm.connect();
    try {
      await this.comm.ping(timeout);
    } finally {
      await this.comm.disconnect();
    }
  }

  async request(command: number, timeout?: number): Promise<CommandResponse>;
  async request(command: number, data: Buffer, timeout?: number): Promise<CommandResponse>;
  async request(command: number, data?: Buffer | number, timeout?: number): Promise<CommandResponse> {
    if (!Buffer.isBuffer(data)) {
      if (typeof(data) === 'number') {
        timeout = data;
      }
      data = Buffer.alloc(0);
    }
    if (timeout == null) {
      timeout = 60000;
    }
    await this.comm.connect();
    await this.comm.send(command, data);
    try {
      const res = await this.comm.receive(timeout);
      return res;
    } finally {
      await this.comm.disconnect();
    }
  }

  static connect(port: string): PiCmd {
    return new PiCmd(ATCommunicator.create(port));
  }
}
