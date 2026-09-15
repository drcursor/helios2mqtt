/**
 * Builds the name and model shown on the Home Assistant device page.
 * The unit's model/type ids are looked up in incomplete tables, so fall back
 * through what is actually known rather than showing "Unknown (<id>)".
 * @param {object} params
 * @param {string} serialNR
 * @param {?string} model Model name, or null when the id is not in the table
 * @param {?string} type Type/order number, or null when the id is not in the table
 * @param {?number} modelId Raw model id reported by the unit
 * @param {?number} typeId Raw type id reported by the unit
 */
function describeDevice({ serialNR, model, type, modelId, typeId }) {
  const name = model ? `Helios ${model}` : `Helios ${serialNR}`;

  let modelLabel = type || model;
  if (!modelLabel) {
    // Nothing resolved: fall back to the serial number, which always identifies
    // this unit, followed by the raw ids so an unlisted unit can be reported.
    const details = [
      `S/N ${serialNR}`,
      typeId !== null && typeId !== undefined ? `type ${typeId}` : null,
      modelId !== null && modelId !== undefined ? `model ${modelId}` : null,
    ].filter(Boolean);
    modelLabel = `Helios KWL (${details.join(', ')})`;
  }

  return { name, modelLabel };
}

/**
 * Generates Home Assistant MQTT Discovery configurations for a Helios device.
 * @param {object} params
 * @param {string} params.serialNR
 * @param {?string} params.model
 * @param {?string} params.type
 * @param {?number} params.modelId
 * @param {?number} params.typeId
 * @param {string} params.heliosUrl
 * @returns {Array<{ component: string, payload: object }>}
 */
function generateHADiscoveryConfigs({ serialNR, model, type, modelId, typeId, heliosUrl }) {
  const { name, modelLabel } = describeDevice({ serialNR, model, type, modelId, typeId });

  const device = {
    name,
    configuration_url: `http://${heliosUrl}/`,
    model: modelLabel,
    manufacturer: 'Helios',
    serial_number: serialNR,
    identifiers: [serialNR],
  };

  return [
    // Fan speed sensor
    {
      component: 'sensor',
      payload: {
        name: 'Fan speed',
        state_topic: `helios/${serialNR}/fan`,
        unique_id: `helios_${serialNR}_fanSpeed`,
        device,
        icon: 'mdi:fan',
        unit_of_measurement: '%',
      },
    },

    // Outside temperature sensor
    {
      component: 'sensor',
      payload: {
        name: 'Temperature outside',
        state_topic: `helios/${serialNR}/outTemp`,
        unique_id: `helios_${serialNR}_outTemp`,
        device: { identifiers: [serialNR] },
        device_class: 'temperature',
        unit_of_measurement: '°C',
      },
    },

    // Supply air temperature sensor
    {
      component: 'sensor',
      payload: {
        name: 'Temperature supply',
        state_topic: `helios/${serialNR}/supTemp`,
        unique_id: `helios_${serialNR}_supTemp`,
        device: { identifiers: [serialNR] },
        device_class: 'temperature',
        unit_of_measurement: '°C',
      },
    },

    // Indoor air temperature sensor
    {
      component: 'sensor',
      payload: {
        name: 'Temperature indoor',
        state_topic: `helios/${serialNR}/indTemp`,
        unique_id: `helios_${serialNR}_indTemp`,
        device: { identifiers: [serialNR] },
        device_class: 'temperature',
        unit_of_measurement: '°C',
      },
    },

    // Exhaust air temperature sensor
    {
      component: 'sensor',
      payload: {
        name: 'Temperature exhaust',
        state_topic: `helios/${serialNR}/exhTemp`,
        unique_id: `helios_${serialNR}_exhTemp`,
        device: { identifiers: [serialNR] },
        device_class: 'temperature',
        unit_of_measurement: '°C',
      },
    },

    // Humidity sensor
    {
      component: 'sensor',
      payload: {
        name: 'Air humidity',
        state_topic: `helios/${serialNR}/airRH`,
        unique_id: `helios_${serialNR}_airRH`,
        device: { identifiers: [serialNR] },
        device_class: 'humidity',
        unit_of_measurement: '%',
      },
    },

    // Current State sensor
    {
      component: 'sensor',
      payload: {
        name: 'State',
        state_topic: `helios/${serialNR}/devState`,
        unique_id: `helios_${serialNR}_devState`,
        device: { identifiers: [serialNR] },
        icon: 'mdi:home-edit',
      },
    },

    // Mode Select Control
    {
      component: 'select',
      payload: {
        name: 'Mode',
        state_topic: `helios/${serialNR}/devState`,
        command_topic: `helios/${serialNR}/setDevState`,
        unique_id: `helios_${serialNR}_devState_select`,
        options: ['At home', 'Away', 'Boost', 'Custom'],
        device: { identifiers: [serialNR] },
        icon: 'mdi:home-edit',
      },
    },

    // Boost Button (30m)
    {
      component: 'button',
      payload: {
        name: 'Boost (30m)',
        command_topic: `helios/${serialNR}/setBoost`,
        payload_press: '30',
        unique_id: `helios_${serialNR}_boost_button`,
        device: { identifiers: [serialNR] },
        icon: 'mdi:fan-plus',
      },
    },

    // Custom Mode Button (15m)
    {
      component: 'button',
      payload: {
        name: 'Custom (15m)',
        command_topic: `helios/${serialNR}/setCustom`,
        payload_press: '15',
        unique_id: `helios_${serialNR}_fireplace_button`,
        device: { identifiers: [serialNR] },
        icon: 'mdi:tune',
      },
    },

    // Fan speed number control
    {
      component: 'number',
      payload: {
        name: 'Set fan speed',
        state_topic: `helios/${serialNR}/fan`,
        command_topic: `helios/${serialNR}/setFanSpeed`,
        unique_id: `helios_${serialNR}_fanSpeed_control`,
        min: 0,
        max: 100,
        step: 1,
        unit_of_measurement: '%',
        device: { identifiers: [serialNR] },
        icon: 'mdi:fan',
      },
    },

    // Filter last changed date sensor
    {
      component: 'sensor',
      payload: {
        name: 'Filter last changed',
        state_topic: `helios/${serialNR}/filterChanged`,
        unique_id: `helios_${serialNR}_filterChanged`,
        device: { identifiers: [serialNR] },
        device_class: 'date',
      },
    },

    // Filter change due date sensor
    {
      component: 'sensor',
      payload: {
        name: 'Filter change due',
        state_topic: `helios/${serialNR}/filterDue`,
        unique_id: `helios_${serialNR}_filterDue`,
        device: { identifiers: [serialNR] },
        device_class: 'date',
      },
    },
  ];
}

module.exports = {
  describeDevice,
  generateHADiscoveryConfigs,
};
