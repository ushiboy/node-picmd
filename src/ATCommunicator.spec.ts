import assert = require('assert');
import { ATCommunicator } from './ATCommunicator';
import { Connection, Unsubscribe } from './Connection';

type MockConnectionState = {
  opened: boolean,
  openError?: Error,
  sendBuffers: Buffer[]
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
    return () => {};
  }

  close(): Promise<void> {
    throw new Error("Method not implemented.");
  }

}

describe('ATCommunicator', () => {
  describe('connect', () => {
    it('should open connection', async () => {
      const at = new ATCommunicator(new MockConnection({
        opened: false,
        sendBuffers: []
      }));

      try {
        await at.connect();
        assert.ok('Success open');
      } catch (e) {
        assert.fail('Fail open');
      }
    });
    context('case of already open', () => {
      context('if the isOpen property is true', () => {
        it('should not be an error', async () => {
          const at = new ATCommunicator(new MockConnection({
            opened: true,
            sendBuffers: []
          }));
          try {
            await at.connect();
            assert.ok('Success open');
          } catch (e) {
            assert.fail('Fail open');
          }
        });
      });
      context('when a "Port opening error" error occurs', () => {
        it('should not be an error', async () => {
          const at = new ATCommunicator(new MockConnection({
            opened: false,
            openError: Error('Port is opening'),
            sendBuffers: []
          }));
          try {
            await at.connect();
            assert.ok('Success open');
          } catch (e) {
            assert.fail('Fail open');
          }
        });
      });
    })
    context('case of other errors', () => {
      it('should be an error', async () => {
        const at = new ATCommunicator(new MockConnection({
          opened: false,
          openError: Error('Other'),
          sendBuffers: []
        }));
        try {
          await at.connect();
          assert.fail('Success open');
        } catch (e) {
          assert.ok('Fail open');
        }
      });
    });
  });
  describe('write', () => {
    it('should write a buffer to the connection', async () => {
      const state = {
        opened: true,
        sendBuffers: []
      };
      const at = new ATCommunicator(new MockConnection(state));
      const b = Buffer.from('test')
      await at.send(b);
      assert(state.sendBuffers[0] === b);
    });
  });
  // describe('receive', () => {
  //   it('should receive command buffer from connection', async () => {
  //     const state = {
  //       opened: true,
  //       sendBuffers: []
  //     };
  //     const at = new ATCommunicator(new MockConnection(state));
  //   });
  // });
});