import { Communicator } from './Communicator';
import { ATCommunicator } from './ATCommunicator';
import { CommandResponse } from './data';
import { formatAtCommand, parseResponse } from './util';

export class PiCmd {

  private comm: Communicator

  constructor(comm: Communicator) {
    this.comm = comm;
  }

  async request(command: number): Promise<CommandResponse>
  async request(command: number, data: Buffer): Promise<CommandResponse>
  async request(command: number, data?: Buffer): Promise<CommandResponse> {
    const c = formatAtCommand(command, data);
    await this.comm.connect();
    await this.comm.send(Buffer.from(c));
    const res = await this.comm.receive();
    await this.comm.disconnect();
    return res;
  }

  static connect(port: string): PiCmd {
    return new PiCmd(ATCommunicator.create(port));
  }
}
