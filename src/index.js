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

async function pollDevice() {
  try {
    const status = await helios.getStatus();
    mqtt.registerDevice({
      serialNumber: status.serialNumber,
      model: status.deviceModel,
      type: status.deviceType,
      heliosHost: config.heliosHost,
    });
    mqtt.publishStatus(status);
  } catch (err) {
    console.error('Error polling Helios unit:', err.message);
  }
}

// Wire up incoming MQTT commands to Helios WebSocket write actions
mqtt.on('setDevState', async (mode) => {
  try {
    console.log(`Executing mode change: "${mode}"`);
    await helios.setMode(mode);
    setTimeout(pollDevice, 500);
  } catch (err) {
    console.error('Failed to set mode:', err.message);
  }
});

mqtt.on('setBoost', async (minutes) => {
  try {
    console.log(`Executing boost timer: ${minutes}m`);
    await helios.setBoost(minutes);
    setTimeout(pollDevice, 500);
  } catch (err) {
    console.error('Failed to set boost:', err.message);
  }
});

mqtt.on('setFireplace', async (minutes) => {
  try {
    console.log(`Executing fireplace timer: ${minutes}m`);
    await helios.setFireplace(minutes);
    setTimeout(pollDevice, 500);
  } catch (err) {
    console.error('Failed to set fireplace mode:', err.message);
  }
});

mqtt.on('setFanSpeed', async (speed) => {
  try {
    console.log(`Executing fan speed change: ${speed}%`);
    await helios.setFanSpeed(speed);
    setTimeout(pollDevice, 500);
  } catch (err) {
    console.error('Failed to set fan speed:', err.message);
  }
});

// Initial connect & poll
mqtt.connect();
pollDevice();

// Periodic polling loop
setInterval(() => {
  pollDevice();
}, config.repeatInterval * 1000);
