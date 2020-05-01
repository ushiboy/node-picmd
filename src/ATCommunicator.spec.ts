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
      const b = Buffer.from('test')
      await at.send(b);
      assert(state.sendBuffers[0] === b);
    });
  });
  describe('receive', () => {
    it('should receive command buffer from connection', async () => {
      const at = new ATCommunicator(new MockConnection({
        opened: true,
        sendBuffers: [],
        receiveBuffers: [
          Buffer.from('*PIC:01000001\r\nOK\r\n'),
          Buffer.from('*PIC:01000001\r\nERROR\r\n'),
          Buffer.from('*PIC:02000002'),
          Buffer.from('\r\nOK\r\n'),
          Buffer.from('*PIC:02000002'),
          Buffer.from('\r\nERROR\r\n'),
          Buffer.from('*PIC:03000003\r\n'),
          Buffer.from('OK\r\n'),
          Buffer.from('*PIC:03000003\r\n'),
          Buffer.from('ERROR\r\n')
        ]
      }));
      const r1 = await at.receive();
      assert(r1.toString('utf-8') === '*PIC:01000001\r\nOK\r\n');
      const r2 = await at.receive();
      assert(r2.toString('utf-8') === '*PIC:01000001\r\nERROR\r\n');
      const r3 = await at.receive();
      assert(r3.toString('utf-8') === '*PIC:02000002\r\nOK\r\n');
      const r4 = await at.receive();
      assert(r4.toString('utf-8') === '*PIC:02000002\r\nERROR\r\n');
      const r5 = await at.receive();
      assert(r5.toString('utf-8') === '*PIC:03000003\r\nOK\r\n');
      const r6 = await at.receive();
      assert(r6.toString('utf-8') === '*PIC:03000003\r\nERROR\r\n');
    });
    context('timeout', () => {
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