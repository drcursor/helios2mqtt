const {
  OFFSET_SERIAL_MSW,
  OFFSET_SERIAL_LSW,
  OFFSET_DEVICE_MODEL,
  OFFSET_DEVICE_TYPE,
  OFFSET_FAN_SPEED_BYTE,
  OFFSET_TEMP_OUTDOOR,
  OFFSET_TEMP_SUPPLY,
  OFFSET_TEMP_INDOOR,
  OFFSET_TEMP_EXHAUST,
  OFFSET_FILTER_CHANGED_YEAR,
  OFFSET_FILTER_CHANGED_MONTH,
  OFFSET_FILTER_CHANGED_DAY,
  OFFSET_FILTER_INTERVAL,
  OFFSET_STATE,
  OFFSET_BOOST_TIMER,
  OFFSET_FIREPLACE_TIMER,
  OFFSET_HUMIDITY,
  MODES,
  EXPECTED_STATUS_BYTE_LENGTH,
} = require('./registers');
const { getModelName, getTypeName } = require('./deviceTypes');

/**
 * Converts 2-byte Kelvin*100 representation at given word offset to Celsius.
 * @param {Uint8Array|Buffer} data
 * @param {number} offsetPosition
 * @returns {number} Temperature in °C rounded to 2 decimal places
 */
function dataToCelsius(data, offsetPosition) {
  const rawKelvin = data[offsetPosition * 2] * 256 + data[offsetPosition * 2 + 1];
  const celsius = rawKelvin / 100 - 273.15;
  return Math.round(celsius * 100) / 100;
}

/**
 * Decodes the raw binary buffer from Helios into a structured JS object.
 * @param {Buffer|Uint8Array} data
 * @returns {object|null}
 */
function parseHeliosStatus(data) {
  if (!data || data.byteLength !== EXPECTED_STATUS_BYTE_LENGTH) {
    return null;
  }

  // Serial Number (4 bytes big-endian across words 14 and 15)
  const serialNumber =
    data[OFFSET_SERIAL_MSW * 2] * 16777216 +
    data[OFFSET_SERIAL_MSW * 2 + 1] * 65536 +
    data[OFFSET_SERIAL_LSW * 2] * 256 +
    data[OFFSET_SERIAL_LSW * 2 + 1];

  const modelId = data[OFFSET_DEVICE_MODEL * 2 + 1];
  const typeId = data[OFFSET_DEVICE_TYPE * 2 + 1];
  const deviceModel = getModelName(modelId);
  const deviceType = getTypeName(typeId);

  const fanSpeed = data[OFFSET_FAN_SPEED_BYTE];
  const outTemp = dataToCelsius(data, OFFSET_TEMP_OUTDOOR);
  const supTemp = dataToCelsius(data, OFFSET_TEMP_SUPPLY);
  const indTemp = dataToCelsius(data, OFFSET_TEMP_INDOOR);
  const exhTemp = dataToCelsius(data, OFFSET_TEMP_EXHAUST);
  const airRH = data[OFFSET_HUMIDITY * 2 + 1];

  // Filter change dates and calculations
  const filterYear = 2000 + data[OFFSET_FILTER_CHANGED_YEAR * 2 + 1];
  const filterMonth = data[OFFSET_FILTER_CHANGED_MONTH * 2 + 1] - 1;
  const filterDay = data[OFFSET_FILTER_CHANGED_DAY * 2 + 1];
  const filterChanged = new Date(filterYear, filterMonth, filterDay, 0, 0);

  const filterIntervalMonths = data[OFFSET_FILTER_INTERVAL * 2 + 1] / 30;
  const filterDue = new Date(
    filterChanged.getFullYear(),
    filterChanged.getMonth() + filterIntervalMonths,
    filterChanged.getDate(),
    0,
    0
  );

  // Operational State
  const state = data[OFFSET_STATE * 2 + 1];
  const fire = data[OFFSET_FIREPLACE_TIMER * 2 + 1];
  const boost = data[OFFSET_BOOST_TIMER * 2 + 1];

  let devState = MODES.HOME;
  if (fire !== 0) {
    devState = MODES.FIREPLACE;
  } else if (boost !== 0) {
    devState = MODES.BOOST;
  } else if (state !== 0) {
    devState = MODES.AWAY;
  }

  return {
    serialNumber: serialNumber.toString(),
    deviceModel,
    deviceType,
    fanSpeed,
    outTemp,
    supTemp,
    indTemp,
    exhTemp,
    airRH,
    filterChanged: filterChanged.toISOString(),
    filterDue: filterDue.toISOString(),
    devState,
  };
}

module.exports = {
  dataToCelsius,
  parseHeliosStatus,
};
