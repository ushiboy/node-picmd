import assert = require('assert');
import { ATCommunicator } from './ATCommunicator';
import { Connection, Unsubscribe } from './Connection';

type MockConnectionState = {
  opened: boolean,
  openError?: Error,
  sendBuffers: Buffer[],
  receiveBuffers: Buffer[]
};

class MockConnection implements Connection {

  private state: MockConnectionState

  private subscriber: (buf: Buffer) => void

  constructor(state: MockConnectionState) {
    this.state = state;
    this.subscriber = (buf: Buffer) => {};
  }

  isOpen(): boolean {
    return this.state.opened;
  }

  async open(): Promise<void> {
    if (this.state.openError) {
      throw this.state.openError;
    }
  }

  async write(buffer: Buffer): Promise<void> {
    this.state.sendBuffers.push(buffer);
  }

  subscribe(fn: (buffer: Buffer) => void): Unsubscribe {
    this.subscriber = fn;
    let unsubscribe = false;
    const p = () => {
      if (!unsubscribe && this.state.receiveBuffers.length > 0) {
        const b = this.state.receiveBuffers.shift();
        this.subscriber(b);
        process.nextTick(() => {
          p();
        });
      }
    };
    process.nextTick(() => {
      p();
    });
    return () => {
      unsubscribe = true;
    };
  }

  async close(): Promise<void> {
    this.state.opened = false;
  }

}

describe('ATCommunicator', () => {
  describe('connect', () => {
    it('should open connection', async () => {
      const at = new ATCommunicator(new MockConnection({
        opened: false,
        sendBuffers: [],
        receiveBuffers: []
      }));

      await assert.doesNotReject(async () => {
        await at.connect();
      });
    });
    context('case of already open', () => {
      context('if the isOpen property is true', () => {
        it('should not be an error', async () => {
          const at = new ATCommunicator(new MockConnection({
            opened: true,
            sendBuffers: [],
            receiveBuffers: []
          }));
          await assert.doesNotReject(async () => {
            await at.connect();
          });
        });
      });
      context('when a "Port opening error" error occurs', () => {
        it('should not be an error', async () => {
          const at = new ATCommunicator(new MockConnection({
            opened: false,
            openError: Error('Port is opening'),
            sendBuffers: [],
            receiveBuffers: []
          }));
          await assert.doesNotReject(async () => {
            await at.connect();
          });
        });
      });
    })
    context('case of other errors', () => {
      it('should be an error', async () => {
        const at = new ATCommunicator(new MockConnection({
          opened: false,
          openError: Error('Other'),
          sendBuffers: [],
          receiveBuffers: []
        }));
        await assert.rejects(async () => {
          await at.connect();
        }, {
          name: 'Error',
          message: 'Other'
        });
      });
    });
  });
  describe('write', () => {
    it('should write a buffer to the connection', async () => {
      const state = {
        opened: true,
        sendBuffers: [],
        receiveBuffers: []
      };
      const at = new ATCommunicator(new MockConnection(state));
      await at.send(0x01);
      assert(state.sendBuffers[0].equals(Buffer.from('AT*PIC=01000001\r\n')));
    });
  });
  describe('receive', () => {
    it('should receive command buffer from connection', async () => {
      const at = new ATCommunicator(new MockConnection({
        opened: true,
        sendBuffers: [],
        receiveBuffers: [
          Buffer.from('*PIC:\x01\x00\x00\x01\r\nOK\r\n'),
          Buffer.from('*PIC:\x02\x00\x00\x02\r\nERROR\r\n'),
          Buffer.from('*PIC:\x01\x00\x00\x01'),
          Buffer.from('\r\nOK\r\n'),
          Buffer.from('*PIC:\x02\x00\x00\x02'),
          Buffer.from('\r\nERROR\r\n'),
          Buffer.from('*PIC:\x01\x00\x00\x01\r\n'),
          Buffer.from('OK\r\n'),
          Buffer.from('*PIC:\x03\x00\x00\x03\r\n'),
          Buffer.from('ERROR\r\n')
        ]
      }));
      const r1 = await at.receive();
      assert(r1.status === 0x01);
      assert(r1.size === 0x00);
      assert(r1.parity === 0x01);
      const r2 = await at.receive();
      assert(r2.status === 0x02);
      assert(r2.size === 0x00);
      assert(r2.parity === 0x02);
      const r3 = await at.receive();
      assert(r3.status === 0x01);
      assert(r3.size === 0x00);
      assert(r3.parity === 0x01);
      const r4 = await at.receive();
      assert(r4.status === 0x02);
      assert(r4.size === 0x00);
      assert(r4.parity === 0x02);
      const r5 = await at.receive();
      assert(r5.status === 0x01);
      assert(r5.size === 0x00);
      assert(r5.parity === 0x01);
      const r6 = await at.receive();
      assert(r6.status === 0x03);
      assert(r6.size === 0x00);
      assert(r6.parity === 0x03);
    });
    context('timeout case', () => {
      it('should get a timeout error', async () => {
        const at = new ATCommunicator(new MockConnection({
          opened: true,
          sendBuffers: [],
          receiveBuffers: [
            Buffer.from('*PIC:01000001\r\nOK\r')
          ]
        }));
        await assert.rejects(async () => {
          await at.receive(10);
        }, {
            name: 'Error',
            message: 'Timeout'
        });
      });
    });
  });
  describe('disconnect', () => {
    it('should close connection', async () => {
        const state = {
          opened: true,
          sendBuffers: [],
          receiveBuffers: []
        };
        const at = new ATCommunicator(new MockConnection(state));
        await at.disconnect();
        assert(state.opened == false);
    });
  });
});