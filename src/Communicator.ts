export interface Communicator {

  connect(): Promise<void>

  send(buffer: Buffer): Promise<void>

  receive(): Promise<Buffer>
  receive(timeout: number): Promise<Buffer>

  disconnect(): Promise<void>
}