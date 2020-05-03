import { CommandResponse } from './data';

export interface Communicator {

  connect(): Promise<void>

  send(buffer: Buffer): Promise<void>

  receive(): Promise<CommandResponse>
  receive(timeout: number): Promise<CommandResponse>

  disconnect(): Promise<void>
}