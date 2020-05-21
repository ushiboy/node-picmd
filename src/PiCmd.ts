import { Communicator } from './Communicator';
import { ATCommunicator } from './ATCommunicator';
import { CommandResponse } from './data';

export interface PiCmdInterface {

  ping(timeout?: number): Promise<boolean>;

  request(command: number, timeout?: number): Promise<CommandResponse>;
  request(command: number, data: Buffer, timeout?: number): Promise<CommandResponse>;

}

export class PiCmd implements PiCmdInterface {

  private comm: Communicator

  constructor(comm: Communicator) {
    this.comm = comm;
  }

  async ping(timeout?: number): Promise<boolean> {
    timeout = timeout || 10000;
    await this.comm.connect();
    try {
      const res = await this.comm.ping(timeout);
      return res;
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
