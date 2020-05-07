node-picmd
=====

node-picmd is a client library for [picmd](https://github.com/ushiboy/pi-cmd).

# Example

```javascript
const { PiCmd } = require('picmd');

(async function() {
  const pic = PiCmd.connect('/dev/ttyUSB0');

  const r1 = await pic.request(0x01);
  console.log(r1.value.toString('utf-8'));

  const r2 = await pic.request(0x02, Buffer.from(
      JSON.stringify({message:'hello'})));
  console.log(r2.value.toString('utf-8'));
}());j
```

# API

## PiCmd class

### `PiCmd.connect(port: string): PiCmd`

### `request(command: number): Promise<CommandResponse>`
### `request(command: number, data: Buffer): Promise<CommandResponse>`

## CommandResponse type

* status: number
* size: number
* value: Buffer
* parity: number

# Change Log

## 0.1.0

Initial release.

# License

MIT