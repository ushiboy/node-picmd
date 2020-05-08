import { CommandResponse } from './data';

export interface Communicator {

  connect(): Promise<void>;

  send(command: number): Promise<void>;
  send(command: number, data: Buffer): Promise<void>;

  receive(): Promise<CommandResponse>;
  receive(timeout: number): Promise<CommandResponse>;

  disconnect(): Promise<void>;
}