import { Communicator } from './Communicator';
import { ATCommunicator } from './ATCommunicator';
import { CommandResponse } from './data';

export interface PiCmdInterface {

  request(command: number): Promise<CommandResponse>;
  request(command: number, data: Buffer): Promise<CommandResponse>;

}

export class PiCmd implements PiCmdInterface {

  private comm: Communicator

  constructor(comm: Communicator) {
    this.comm = comm;
  }

  async request(command: number): Promise<CommandResponse>
  async request(command: number, data: Buffer): Promise<CommandResponse>
  async request(command: number, data?: Buffer): Promise<CommandResponse> {
    await this.comm.connect();
    await this.comm.send(command, data);
    try {
      const res = await this.comm.receive();
      return res;
    } finally {
      await this.comm.disconnect();
    }
  }

  static connect(port: string): PiCmd {
    return new PiCmd(ATCommunicator.create(port));
  }
}
