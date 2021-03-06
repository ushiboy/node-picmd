import assert = require('assert');
import { PiCmd } from './PiCmd';
import { Communicator } from './Communicator';
import { CommandResponse } from './data';

type SendCommand = {
  command: number,
  data?: Buffer
};

type MockCommState = {
  connected?: boolean,
  sendCommands?: SendCommand[]
  responses?: CommandResponse[],
  responseError?: Error,
  pongError?: Error
};

class MockCommunicator implements Communicator {

  private state: MockCommState

  constructor(state: MockCommState) {
    if (state.connected == null) {
      state.connected = false;
    }
    if (state.sendCommands == null) {
      state.sendCommands = [];
    }
    if (state.responses == null) {
      state.responses = [];
    }
    this.state = state;
  }

  async connect(): Promise<void> {
    this.state.connected = true;
  }

  async ping(timeout: number): Promise<void> {
    if (this.state.pongError != null) {
      return new Promise((_, reject) => {
        reject(this.state.pongError);
      });
    }
  }

  async send(command: number): Promise<void>;
  async send(command: number, data: Buffer): Promise<void>;
  async send(command: any, data?: Buffer) {
    this.state.sendCommands.push({
      command,
      data
    });
  }

  async receive(timeout: number = 60000): Promise<CommandResponse> {
    if (this.state.responseError) {
      throw this.state.responseError;
    }
    if (this.state.responses.length > 0) {
      return this.state.responses.shift();
    }
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Timeout'));
      }, timeout);
    });
  }

  async disconnect(): Promise<void> {
    this.state.connected = false;
  }
}

describe('PiCmd', () => {
  describe('waitReady', () => {
    it('should wait until the PING command succeeds', async () => {
      const state = {
        connected: false
      };
      const pi = new PiCmd(new MockCommunicator(state));
      await assert.doesNotReject(async () => {
        await pi.waitReady();
      });
    });
    it('should be an error if the PING command times out without success', async () => {
      const state = {
        pongError: new Error('Timeout')
      };
      const pi = new PiCmd(new MockCommunicator(state));
      await assert.rejects(async () => {
        await pi.waitReady(1);
      }, {
        message: 'Over the time limit'
      });
    });
  });
  describe('ping', () => {
    it('should end with sending a PING request and receiving a PONG response', async () => {
      const state = {
        connected: false
      };
      const pi = new PiCmd(new MockCommunicator(state));
      await assert.doesNotReject(async () => {
        await pi.ping();
      });
    });
    it('should be an error if the PONG response could not be received', async () => {
      const state = {
        pongError: new Error('Timeout')
      };
      const pi = new PiCmd(new MockCommunicator(state));
      await assert.rejects(async () => {
        await pi.ping(1);
      }, {
        message: 'Timeout'
      });
    });
  });
  describe('request', () => {
    it('should send a command and return a command response', async () => {
      const state = {
        connected: false,
        sendCommands: [],
        responses: [{
          status: 0x01,
          size: 0x00,
          value: Buffer.alloc(0),
          parity: 0x01
        }]
      };
      const pi = new PiCmd(new MockCommunicator(state));
      const r = await pi.request(0x01);
      assert(state.sendCommands[0].command === 0x01);
      assert(r.status === 0x01);
      assert(r.size === 0x00);
      assert(r.value.length === 0);
      assert(r.parity === 0x01);
    });
    it('should send a command and data and return a response', async () => {
      const state = {
        connected: false,
        sendCommands: [],
        responses: [{
          status: 0x01,
          size: 0x00,
          value: Buffer.alloc(0),
          parity: 0x01
        }]
      };
      const pi = new PiCmd(new MockCommunicator(state));
      const r = await pi.request(0x01, Buffer.from([0x02]));
      assert(state.sendCommands[0].command === 0x01);
      assert(state.sendCommands[0].data.equals(Buffer.from([0x02])));
      assert(r.status === 0x01);
      assert(r.size === 0x00);
      assert(r.value.length === 0);
      assert(r.parity === 0x01);
    });
    it('should be an error if it times out', async () => {
      const state = {
        sendCommands: []
      };
      const pi = new PiCmd(new MockCommunicator(state));
      await assert.rejects(async () => {
        await pi.request(0x01, 10);
      }, {
        message: 'Timeout'
      });
      assert(state.sendCommands[0].command === 0x01);

      await assert.rejects(async () => {
        await pi.request(0x02, Buffer.from([0x01]), 10);
      }, {
        message: 'Timeout'
      });
      assert(state.sendCommands[1].command === 0x02);
      assert(state.sendCommands[1].data.equals(Buffer.from([0x01])));
    });
    it('should close the connection in case of an error', async () => {
      const state = {
        connected: false,
        responseError: new Error('Any Error')
      };
      const pi = new PiCmd(new MockCommunicator(state));
      await assert.rejects(async () => {
        await pi.request(0x01);
      }, {
        message: 'Any Error'
      });
      assert(state.connected === false);
    });
  });
});
