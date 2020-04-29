export interface Communicator {

  connect(): Promise<void>

  send(buffer: Buffer): Promise<void>

  receive(): Promise<Buffer>

  disconnect(): Promise<void>
}