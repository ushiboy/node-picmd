import assert = require('assert');
import { ATCommunicator } from './ATCommunicator';
import { Connection, Unsubscribe } from './Connection';

type MockConnectionState = {
  opened?: boolean,
  openError?: Error,
  sendBuffers?: Buffer[],
  receiveBuffers?: Buffer[]
};

class MockConnection implements Connection {

  private state: MockConnectionState

  private subscriber: (buf: Buffer) => void

  constructor(state: MockConnectionState) {
    if (state.opened == null) {
      state.opened = false;
    }
    if (state.sendBuffers == null) {
      state.sendBuffers = [];
    }
    if (state.receiveBuffers == null) {
      state.receiveBuffers = [];
    }
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
    it('should open the connection', async () => {
      const at = new ATCommunicator(new MockConnection({
        opened: false
      }));
      await assert.doesNotReject(async () => {
        await at.connect();
      });
    });
    it('should not be an error if the isOpen property is true', async () => {
      const at = new ATCommunicator(new MockConnection({
        opened: true
      }));
      await assert.doesNotReject(async () => {
        await at.connect();
      });
    });
    it('should not be an error if you get a "Port opening error"', async () => {
      const at = new ATCommunicator(new MockConnection({
        opened: false,
        openError: Error('Port is opening')
      }));
      await assert.doesNotReject(async () => {
        await at.connect();
      });
    });
    it('should be an error if an unintended error occurs', async () => {
      const at = new ATCommunicator(new MockConnection({
        opened: false,
        openError: Error('Other')
      }));
      await assert.rejects(async () => {
        await at.connect();
      }, {
        name: 'Error',
        message: 'Other'
      });
    });
  });
  describe('ping', () => {
    it('should not result in an error if it receives a PONG response', async () => {
      const state = {
        opened: true,
        sendBuffers: [],
        receiveBuffers: [
          Buffer.from('\r\nOK\r\n')
        ]
      };
      const at = new ATCommunicator(new MockConnection(state));
      await assert.doesNotReject(async () => {
        await at.ping(10);
      });
      assert(state.sendBuffers[0]
        .equals(Buffer.from('AT\r\n')));
    });
    it('should result in an error if the PONG response could not be received', async () => {
      const state = {
        opened: true,
        sendBuffers: [],
        receiveBuffers: [
          Buffer.from('\r\nERROR\r\n')
        ]
      };
      const at = new ATCommunicator(new MockConnection(state));
      await assert.rejects(async () => {
        await at.ping(1);
      }, {
        name: 'Error',
        message: 'Invalid Response'
      });
      assert(state.sendBuffers[0]
        .equals(Buffer.from('AT\r\n')));
    });
    it('should be an error if it times out', async () => {
      const state = {
        opened: true,
        sendBuffers: []
      };
      const at = new ATCommunicator(new MockConnection(state));
      await assert.rejects(async () => {
        await at.ping(1);
      }, {
        name: 'Error',
        message: 'Timeout'
      });
      assert(state.sendBuffers[0]
        .equals(Buffer.from('AT\r\n')));
    });
  });
  describe('send', () => {
    it('should write a buffer of AT commands', async () => {
      const state = {
        sendBuffers: []
      };
      const at = new ATCommunicator(new MockConnection(state));
      await at.send(0x01);
      assert(state.sendBuffers[0]
        .equals(Buffer.from('AT*PIC=\x01\x00\x00\x01\r\n')));
    });
    it('should write a buffer of AT commands, including data', async () => {
      const state = {
        sendBuffers: []
      };
      const at = new ATCommunicator(new MockConnection(state));
      await at.send(0x01, Buffer.from([0x02]));
      assert(state.sendBuffers[0]
        .equals(Buffer.from('AT*PIC=\x01\x01\x00\x02\x02\r\n')));
    });
  });
  describe('receive', () => {
    it('should receive a buffer and return a command response', async () => {
      const at = new ATCommunicator(new MockConnection({
        receiveBuffers: [
          Buffer.from('*PIC:\x01\x00\x00\x01\r\n'),
          Buffer.from('OK\r\n')
        ]
      }));
      const r1 = await at.receive();
      assert(r1.status === 0x01);
      assert(r1.size === 0x00);
      assert(r1.parity === 0x01);
    });
    it('should be an error if the buffer times out during reception', async () => {
      const at = new ATCommunicator(new MockConnection({
        receiveBuffers: [
          Buffer.from('*PIC:\x01\x00\x00\x01\r\n'),
          Buffer.from('OK\r')
        ]
      }));
      await assert.rejects(async () => {
        await at.receive(10);
      }, {
        name: 'Error',
        message: 'Timeout'
      });
    });
    it('should be an error if the format of the received buffer is incorrect', async () => {
      const at = new ATCommunicator(new MockConnection({
        receiveBuffers: [
          Buffer.from('*PIC:\x01\x00\x00\x01\r\n'),
          Buffer.from('OK\r0')
        ]
      }));
      await assert.rejects(async () => {
        await at.receive();
      }, {
        name: 'Error',
        message: 'Invalid data'
      });
    });
    it('should be an error if the parity is incorrect', async () => {
      const at = new ATCommunicator(new MockConnection({
        receiveBuffers: [
          Buffer.from('*PIC:\x01\x00\x00\x02\r\n'),
          Buffer.from('OK\r\n')
        ]
      }));
      await assert.rejects(async () => {
        await at.receive();
      }, {
        name: 'Error',
        message: 'Invalid parity'
      });
    });
  });
  describe('disconnect', () => {
    it('should close the connection', async () => {
        const state = {
          opened: true
        };
        const at = new ATCommunicator(new MockConnection(state));
        await at.disconnect();
        assert(state.opened == false);
    });
  });
});
