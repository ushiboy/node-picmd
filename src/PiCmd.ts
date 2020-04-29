import { Communicator } from './Communicator';
import { SerialCommunicator } from './SerialCommunicator';
import { Response } from './data';
import { formatAtCommand, parseResponse } from './util';

export class PiCmd {

  private comm: Communicator

  constructor(comm: Communicator) {
    this.comm = comm;
  }

  async request(command: number): Promise<Response>
  async request(command: number, data: Buffer): Promise<Response>
  async request(command: number, data?: Buffer): Promise<Response> {
    const c = formatAtCommand(command, data);
    await this.comm.connect();
    await this.comm.send(Buffer.from(c));
    const buf = await this.comm.receive();
    const res = parseResponse(buf);
    await this.comm.disconnect();
    return res;
  }

  static connect(port: string): PiCmd {
    return new PiCmd(SerialCommunicator.create(port));
  }
}
