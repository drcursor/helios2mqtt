const WebSocket = require('ws');
const { buildReadFrame, buildWriteFrame } = require('./protocol');
const { parseHeliosStatus } = require('./parser');
const {
  REG_STATE,
  REG_BOOST_TIMER,
  REG_FIREPLACE_TIMER,
  REG_FAN_SPEED,
  REPLY_ERRORS,
  MODES,
} = require('./registers');

class HeliosClient {
  constructor(options = {}) {
    this.host = options.host || 'YOUR_HELIOS_IP';
    this.port = options.port || 80;
    this.timeout = options.timeout || 5000;
  }

  get url() {
    return `ws://${this.host}:${this.port}/`;
  }

  /**
   * Fetches full status from the ventilation unit.
   * @returns {Promise<object>} Parsed device status
   */
  getStatus() {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.url);
      let timer;

      const cleanup = () => {
        clearTimeout(timer);
        try { ws.close(); } catch (e) { /* ignore */ }
      };

      timer = setTimeout(() => {
        cleanup();
        reject(new Error(`Helios getStatus timed out after ${this.timeout}ms`));
      }, this.timeout);

      ws.on('error', (err) => {
        cleanup();
        reject(err);
      });

      ws.on('open', () => {
        const req = buildReadFrame();
        ws.send(req.buffer);
      });

      ws.on('message', (data) => {
        cleanup();
        const parsed = parseHeliosStatus(data);
        if (!parsed) {
          return reject(new Error(`Invalid response length received: ${data.byteLength}`));
        }
        resolve(parsed);
      });
    });
  }

  /**
   * Writes raw register/value pairs over WebSocket.
   * @param {Array<[number, number]>} pairs
   * @returns {Promise<void>}
   */
  writeRegisters(pairs) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.url);
      let timer;

      const cleanup = () => {
        clearTimeout(timer);
        try { ws.close(); } catch (e) { /* ignore */ }
      };

      timer = setTimeout(() => {
        cleanup();
        reject(new Error(`Helios writeRegisters timed out after ${this.timeout}ms`));
      }, this.timeout);

      ws.on('error', (err) => {
        cleanup();
        reject(err);
      });

      ws.on('open', () => {
        const payload = buildWriteFrame(pairs);
        ws.send(payload.buffer);
      });

      ws.on('message', (data) => {
        cleanup();
        // The unit answers a write with a short frame whose second word (little
        // endian) is either an acknowledgement or one of the documented error
        // codes. Without this check a rejected frame looks like a success.
        const reply = Buffer.from(data);
        const status = reply.byteLength >= 4 ? reply.readUInt16LE(2) : null;
        const failure = status === null ? null : REPLY_ERRORS[status];
        if (failure) {
          return reject(new Error(`Helios rejected write: ${failure} (code ${status})`));
        }
        resolve();
      });
    });
  }

  /**
   * Changes the operation mode.
   * @param {string} mode 'At home', 'Away', 'Boost', or 'Fireplace'
   */
  async setMode(mode) {
    const m = (mode || '').toLowerCase();
    if (m === 'at home' || m === 'home') {
      return this.writeRegisters([
        [REG_STATE, 0],
        [REG_BOOST_TIMER, 0],
        [REG_FIREPLACE_TIMER, 0],
      ]);
    } else if (m === 'away') {
      return this.writeRegisters([
        [REG_STATE, 1],
        [REG_BOOST_TIMER, 0],
        [REG_FIREPLACE_TIMER, 0],
      ]);
    } else if (m === 'boost') {
      return this.setBoost(30);
    } else if (m === 'fireplace') {
      return this.setFireplace(15);
    }
    throw new Error(`Unknown mode: ${mode}`);
  }

  /**
   * Sets Boost / Party mode for a specific duration in minutes.
   * @param {number} minutes
   */
  async setBoost(minutes = 30) {
    const mins = parseInt(minutes, 10);
    if (isNaN(mins)) throw new Error('Invalid minutes for boost');
    // The fireplace timer takes precedence over boost in the unit's own state
    // calculation, so it has to be cleared for the switch to take effect.
    return this.writeRegisters([
      [REG_BOOST_TIMER, mins],
      [REG_FIREPLACE_TIMER, 0],
    ]);
  }

  /**
   * Sets Fireplace mode for a specific duration in minutes.
   * @param {number} minutes
   */
  async setFireplace(minutes = 15) {
    const mins = parseInt(minutes, 10);
    if (isNaN(mins)) throw new Error('Invalid minutes for fireplace');
    return this.writeRegisters([
      [REG_BOOST_TIMER, 0],
      [REG_FIREPLACE_TIMER, mins],
    ]);
  }

  /**
   * Sets the fan speed percentage.
   * @param {number} speed 0-100%
   */
  async setFanSpeed(speed) {
    const val = parseInt(speed, 10);
    if (isNaN(val)) throw new Error('Invalid fan speed');
    return this.writeRegisters([[REG_FAN_SPEED, val]]);
  }
}

module.exports = HeliosClient;
