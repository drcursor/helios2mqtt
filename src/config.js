const fs = require('fs');
const path = require('path');

// Optional zero-dependency .env loader for local development
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/(^['"]|['"]$)/g, '');
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
  } catch (err) {
    console.error('Error reading .env file:', err);
  }
}

module.exports = {
  // Helios Ventilation unit settings
  heliosHost: process.env.HELIOS_HOST || process.env.HELIOS_URL || 'YOUR_HELIOS_IP',
  heliosPort: parseInt(process.env.HELIOS_PORT, 10) || 80,

  // MQTT Broker settings
  mqttHost: process.env.MQTT_HOST || process.env.MQTT_URL || 'YOUR_MQTT_BROKER_IP',
  mqttPort: parseInt(process.env.MQTT_PORT, 10) || 1883,
  mqttUser: process.env.MQTT_USER || process.env.MQTT_USERNAME || 'YOUR_MQTT_USERNAME',
  mqttPass: process.env.MQTT_PASS || process.env.MQTT_PASSWORD || 'YOUR_MQTT_PASSWORD',

  // Polling interval in seconds
  repeatInterval: parseInt(process.env.REPEAT_INTERVAL || process.env.POLL_INTERVAL, 10) || 60,
};
