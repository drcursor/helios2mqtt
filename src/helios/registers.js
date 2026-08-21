/**
 * Named constants and register offsets for Helios / Vallox ventilation units.
 */
module.exports = {
  // Protocol Commands
  CMD_STATUS_REQUEST: 246, // 0x00F6
  CMD_WRITE: 249,          // 0x00F9
  EXPECTED_STATUS_BYTE_LENGTH: 1410,

  // Register Addresses (for writing)
  REG_FAN_SPEED: 4353,
  REG_STATE: 4609,
  REG_BOOST_TIMER: 4612,
  REG_FIREPLACE_TIMER: 4613,

  // Status Buffer Offsets (for reading from 16-bit word aligned buffer)
  OFFSET_SERIAL_MSW: 14,
  OFFSET_SERIAL_LSW: 15,
  OFFSET_DEVICE_TYPE: 16,
  OFFSET_DEVICE_MODEL: 17,
  OFFSET_FAN_SPEED_BYTE: 129,
  OFFSET_TEMP_INDOOR: 65,
  OFFSET_TEMP_EXHAUST: 66,
  OFFSET_TEMP_OUTDOOR: 67,
  OFFSET_TEMP_SUPPLY: 69,
  OFFSET_HUMIDITY: 74,
  OFFSET_STATE: 107,
  OFFSET_BOOST_TIMER: 110,
  OFFSET_FIREPLACE_TIMER: 111,
  OFFSET_FILTER_INTERVAL: 239,
  OFFSET_FILTER_CHANGED_DAY: 248,
  OFFSET_FILTER_CHANGED_MONTH: 249,
  OFFSET_FILTER_CHANGED_YEAR: 250,

  // Operational Modes
  MODES: {
    HOME: 'At home',
    AWAY: 'Away',
    BOOST: 'Boost',
    FIREPLACE: 'Fireplace',
  },
};
