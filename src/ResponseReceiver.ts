import { CommandResponse } from './data';
import { parseResponse } from './util';

export const UNINITIALIZED_DATA_SIZE = 0xffff + 1;
export const PREFIX = '*PIC:';
export const POSTFIX_OK = '\r\nOK\r\n';
export const POSTFIX_ERR = '\r\nERROR\r\n';
export const STATUS_NO_ERROR = 0x01;
const RESPONSE_STATIC_SIZE = 8;


export class ResponseReceiver {

  private buffered: Buffer
  private status: number
  private responseSize: number
  private ready: boolean

  constructor() {
    this.buffered = Buffer.alloc(0);
    this.status = 0x00;
    this.responseSize = UNINITIALIZED_DATA_SIZE;
    this.ready = false;
  }

  // for debug
  isReady(): boolean {
    return this.ready;
  }

  // for debug
  getResponseSize(): number {
    return this.responseSize;
  }

  store(buffer: Buffer): void {
    let size = this.buffered.length + buffer.length;
    this.buffered = Buffer.concat([this.buffered, buffer], size);

    if (!this.ready) {
      const p = this.buffered.indexOf(PREFIX);
      if (p < 0) {
        return;
      }
      this.ready = true;
      this.buffered = this.buffered.slice(p);
      size = this.buffered.length;
    }

    if (this.responseSize === UNINITIALIZED_DATA_SIZE &&
      size >= RESPONSE_STATIC_SIZE) {
        const s = this.buffered.slice(5, 8);
        this.status = s[0];
        this.responseSize = s[1] | s[2] << 8;
    }
  }

  pull(): CommandResponse | null {
    const pSize = RESPONSE_STATIC_SIZE + this.responseSize + 1;
    const postfix = this.status === STATUS_NO_ERROR ? POSTFIX_OK : POSTFIX_ERR;
    const size = pSize + postfix.length;
    if (this.buffered.length < size) {
      return null;
    }
    if (this.buffered.slice(pSize, size).toString('utf-8') !== postfix) {
      throw new Error('Invalid data');
    }
    return parseResponse(this.buffered);
  }
}