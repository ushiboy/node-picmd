export type Unsubscribe = () => void;

export interface Connection {

  isOpen(): boolean

  open(): Promise<void>

  write(buffer: Buffer): Promise<void>

  subscribe(fn : (buffer: Buffer) => void): Unsubscribe

  close(): Promise<void>
}