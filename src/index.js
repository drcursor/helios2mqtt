const config = require('./config');
const HeliosClient = require('./helios/client');
const HeliosMQTTClient = require('./mqtt/client');

console.log(`Starting helios2mqtt bridge (polling interval: ${config.repeatInterval}s)...`);

const helios = new HeliosClient({
  host: config.heliosHost,
  port: config.heliosPort,
});

const mqtt = new HeliosMQTTClient({
  host: config.mqttHost,
  port: config.mqttPort,
  username: config.mqttUser,
  password: config.mqttPass,
});

// The unit needs a moment to apply a write before it reports the new state
const POST_COMMAND_REFRESH_MS = 1000;

async function pollDevice({ force = false } = {}) {
  try {
    const status = await helios.getStatus();
    mqtt.registerDevice({
      serialNumber: status.serialNumber,
      model: status.deviceModel,
      type: status.deviceType,
      heliosHost: config.heliosHost,
    });
    mqtt.publishStatus(status, { force });
  } catch (err) {
    console.error('Error polling Helios unit:', err.message);
  }
}

// Re-read the full status shortly after any write, so what is published
// reflects the unit rather than the command that was sent
function refreshAfterCommand() {
  setTimeout(() => pollDevice({ force: true }), POST_COMMAND_REFRESH_MS);
}

// Wire up incoming MQTT commands to Helios WebSocket write actions
mqtt.on('setDevState', async (mode) => {
  try {
    console.log(`Executing mode change: "${mode}"`);
    await helios.setMode(mode);
  } catch (err) {
    console.error('Failed to set mode:', err.message);
  } finally {
    refreshAfterCommand();
  }
});

mqtt.on('setBoost', async (minutes) => {
  try {
    console.log(`Executing boost timer: ${minutes}m`);
    await helios.setBoost(minutes);
  } catch (err) {
    console.error('Failed to set boost:', err.message);
  } finally {
    refreshAfterCommand();
  }
});

mqtt.on('setFireplace', async (minutes) => {
  try {
    console.log(`Executing fireplace timer: ${minutes}m`);
    await helios.setFireplace(minutes);
  } catch (err) {
    console.error('Failed to set fireplace mode:', err.message);
  } finally {
    refreshAfterCommand();
  }
});

mqtt.on('setFanSpeed', async (speed) => {
  try {
    console.log(`Executing fan speed change: ${speed}%`);
    await helios.setFanSpeed(speed);
  } catch (err) {
    console.error('Failed to set fan speed:', err.message);
  } finally {
    refreshAfterCommand();
  }
});

// Initial connect & poll
mqtt.connect();
pollDevice();

// Periodic polling loop
setInterval(() => {
  pollDevice();
}, config.repeatInterval * 1000);
