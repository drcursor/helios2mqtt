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
 * @param {Array<[number, number]>} pairs Array of [registerAddress, value] tuples
 * @returns {Uint16Array}
 */
function buildWriteFrame(pairs) {
  const numPairs = pairs.length;
  const totalWords = 3 + numPairs * 2;
  const data = new Uint16Array(totalWords);

  data[0] = numPairs * 2 + 1; // Length in payload words
  data[1] = CMD_WRITE;        // 249 (0x00F9)

  let idx = 2;
  for (const [reg, val] of pairs) {
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
