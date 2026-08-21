const mqtt = require('mqtt');
const EventEmitter = require('events');
const { generateHADiscoveryConfigs } = require('./haDiscovery');

class HeliosMQTTClient extends EventEmitter {
  constructor(options = {}) {
    super();
    this.host = options.host || 'YOUR_MQTT_BROKER_IP';
    this.port = options.port || 1883;
    this.username = options.username || 'YOUR_MQTT_USERNAME';
    this.password = options.password || 'YOUR_MQTT_PASSWORD';

    this.client = null;
    this.connected = false;
    this.serialNR = null;
    this.deviceRegistered = false;
    this.stateCache = {};
  }

  connect(serialNR) {
    if (this.client) return;

    this.serialNR = serialNR;
    const clientId = `helios2mqtt_${serialNR || Math.random().toString(16).slice(2, 8)}`;
    const url = `mqtt://${this.host}:${this.port}`;

    this.client = mqtt.connect(url, {
      clientId,
      clean: true,
      connectTimeout: 5000,
      username: this.username,
      password: this.password,
      reconnectPeriod: 5000,
    });

    this.client.on('connect', () => {
      console.log('MQTT broker connected');
      this.connected = true;
      if (this.serialNR) {
        this.subscribeCommandTopics();
      }
    });

    this.client.on('close', () => {
      this.connected = false;
    });

    this.client.on('error', (err) => {
      console.error('MQTT error:', err.message);
    });

    this.client.on('message', (topic, message) => {
      const payload = message.toString().trim();
      console.log('Received MQTT message: %s => %s', topic, payload);

      if (topic.endsWith('/setDevState') || topic.endsWith('/set_devState') || topic.endsWith('/set_mode')) {
        this.emit('setDevState', payload);
      } else if (topic.endsWith('/setBoost') || topic.endsWith('/set_boost')) {
        this.emit('setBoost', payload);
      } else if (topic.endsWith('/setFireplace') || topic.endsWith('/set_fireplace')) {
        this.emit('setFireplace', payload);
      } else if (topic.endsWith('/setFanSpeed') || topic.endsWith('/set_fan')) {
        this.emit('setFanSpeed', payload);
      }
    });
  }

  registerDevice({ serialNumber, model, type, heliosHost }) {
    if (this.deviceRegistered && this.serialNR === serialNumber) return;

    this.serialNR = serialNumber;
    if (!this.client) {
      this.connect(serialNumber);
    }

    console.log(`Registering HA device: Model "${model}", Type "${type}", Serial "${serialNumber}"`);
    const entities = generateHADiscoveryConfigs({
      serialNR: serialNumber,
      model,
      type,
      heliosUrl: heliosHost,
    });

    for (const { component, payload } of entities) {
      const discoveryTopic = `homeassistant/${component}/${payload.unique_id}/config`;
      this.client.publish(discoveryTopic, JSON.stringify(payload), { qos: 0, retain: true });
    }

    this.subscribeCommandTopics();
    this.deviceRegistered = true;
  }

  subscribeCommandTopics() {
    if (!this.client || !this.connected || !this.serialNR) return;

    const topics = [
      `helios/${this.serialNR}/setDevState`,
      `helios/${this.serialNR}/set_devState`,
      `helios/${this.serialNR}/set_mode`,
      `helios/${this.serialNR}/setBoost`,
      `helios/${this.serialNR}/set_boost`,
      `helios/${this.serialNR}/setFireplace`,
      `helios/${this.serialNR}/set_fireplace`,
      `helios/${this.serialNR}/setFanSpeed`,
      `helios/${this.serialNR}/set_fan`,
    ];

    this.client.subscribe(topics, (err) => {
      if (err) {
        console.error('Failed to subscribe to MQTT command topics:', err.message);
      } else {
        console.log(`Subscribed to command topics for device ${this.serialNR}`);
      }
    });
  }

  publishData(key, value) {
    if (!this.client || !this.connected || !this.serialNR) return;
    const strVal = (value !== null && value !== undefined) ? value.toString() : '';

    // State deduplication: only publish if value changed
    if (this.stateCache[key] === strVal) return;
    this.stateCache[key] = strVal;

    const topic = `helios/${this.serialNR}/${key}`;
    this.client.publish(topic, strVal, { qos: 0, retain: false });
    console.log(`MQTT published: ${topic} => ${strVal}`);
  }

  publishStatus(status) {
    if (!status || !status.serialNumber) return;

    this.publishData('fan', status.fanSpeed);
    this.publishData('outTemp', status.outTemp);
    this.publishData('supTemp', status.supTemp);
    this.publishData('indTemp', status.indTemp);
    this.publishData('exhTemp', status.exhTemp);
    this.publishData('airRH', status.airRH);
    this.publishData('filterChanged', status.filterChanged);
    this.publishData('filterDue', status.filterDue);
    this.publishData('devState', status.devState);
  }
}

module.exports = HeliosMQTTClient;
