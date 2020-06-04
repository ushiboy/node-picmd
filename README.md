node-picmd
=====

The node-picmd is a client library for [picmd](https://github.com/ushiboy/picmd).

## Overview

The node-picmd is a client library for picmd, a command handler framework with serial communication for Raspberry PI.

It abstracts the communication specification of picmd and makes it easy to use.

## Example

The sample code for sending the "0x01" command and receiving the response is as follows.

```javascript
const { PiCmd } = require('picmd');

(async function() {
  const pic = PiCmd.connect('/dev/ttyUSB0');

  const r = await pic.request(0x01);
  console.log(r.value.toString('utf-8'));

}());
```

## API

### PiCmd class

The picmd client class.

#### `PiCmd.connect(port: string): PiCmd`

Create an instance of PiCmd by passing the serial port path.

* parameters
  * port
    * The serial port path.
    * type: string
* return
  * The instance of PiCmd.
  * type: PiCmd

#### `ping(timeout?: number): Promise<void>`

Send a ping command.

* optional parameters
  * timeout
    * Timeout waiting for a ping command response.
    * type: number
    * default: `10000` ms

#### `request(command: number, data?: Buffer, timeout?: number): Promise<CommandResponse>`

Send a command and return a response.

* parameters
  * command
    * The command to send.
    * type: number
* optional parameters
  * data
    * The data of the command to be sent.
    * type: Buffer
  * timeout
    * Timeout waiting for a command response.
    * type: number
    * default: `60000` ms
* return
  * The result of the execution of the command.
  * type: CommandResponse

### CommandResponse type

The result of the execution of the command.

* properties
  * status
    * The status of the command execution result.
    * type: number
  * size
    * The response data size of command execution result.
    * type: number
  * value
    * The response data of command execution result.
    * type: Buffer
  * parity
    * The parity value for checking
    * type: number

## Change Log

### 0.1.0

Initial release.

## License

MIT
