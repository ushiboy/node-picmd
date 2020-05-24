export const PONG_RESPONSE = '\r\nOK\r\n';

export class PongReceiver {

  private buffered: Buffer

  constructor() {
    this.buffered = Buffer.alloc(0);
  }

  store(buffer: Buffer): void {
    const size = this.buffered.length + buffer.length;
    this.buffered = Buffer.concat([this.buffered, buffer], size);
  }

  pull(): boolean | null {
    if (this.buffered.length < PONG_RESPONSE.length) {
      return null;
    }
    return this.buffered.indexOf(PONG_RESPONSE) >= 0;
  }
}
