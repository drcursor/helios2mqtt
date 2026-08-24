const { CMD_STATUS_REQUEST, CMD_WRITE } = require('./registers');

/**
 * Builds the binary frame required to request full status from the Helios unit.
 * @returns {Uint16Array}
 */
function buildReadFrame() {
  const data = new Uint16Array(4);
  data[0] = 3;                  // Payload word count
  data[1] = CMD_STATUS_REQUEST; // 246 (0x00F6)
  data[2] = 0;                  // Parameter 0
  data[3] = (data[0] + data[1] + data[2]) & 0xFFFF; // Checksum: 249
  return data;
}

/**
 * Builds the binary frame to write one or more register-value pairs.
 *
 * Frame layout (16-bit little-endian words, as produced by the unit's own
 * web UI in VlxDataBuffer.convertDataToBuffer):
 *   [0]            length = total word count - 1 (command + pairs + checksum)
 *   [1]            command (249 / 0x00F9)
 *   [2..2n+1]      register/value pairs
 *   [2n+2]         checksum = sum of all preceding words, masked to 16 bits
 *
 * @param {Array<[number, number]>} pairs Array of [registerAddress, value] tuples
 * @returns {Uint16Array}
 */
function buildWriteFrame(pairs) {
  if (!Array.isArray(pairs) || pairs.length === 0) {
    throw new Error('buildWriteFrame requires at least one register/value pair');
  }

  // The unit expects the pairs in ascending register order
  const sorted = [...pairs].sort((a, b) => a[0] - b[0]);

  const totalWords = 3 + sorted.length * 2;
  const data = new Uint16Array(totalWords);

  data[0] = totalWords - 1; // Length: command + pairs + checksum
  data[1] = CMD_WRITE;      // 249 (0x00F9)

  let idx = 2;
  for (const [reg, val] of sorted) {
    data[idx++] = reg;
    data[idx++] = val;
  }

  let sum = 0;
  for (let i = 0; i < totalWords - 1; i++) {
    sum += data[i];
  }
  data[totalWords - 1] = sum & 0xFFFF;
  return data;
}

module.exports = {
  buildReadFrame,
  buildWriteFrame,
};
