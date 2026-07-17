const DEFAULT_PORTS = {
  sensors: {
    sound: 0,
    light: 1,
    moisture: 2,
    temperatureHumidity: 7,
    motion: 8
  },
  actuators: {
    buzzer: 2,
    relay1: 4,
    led: 3,
    relay2: 5,
    relay3: 6
  }
};

const SENSOR_KEYS = ['sound', 'light', 'moisture', 'temperatureHumidity', 'motion'];
const ACTUATOR_KEYS = ['buzzer', 'relay1', 'led', 'relay2', 'relay3'];

function isInt(value) {
  return Number.isInteger(value);
}

function validateRange(value, min, max) {
  return isInt(value) && value >= min && value <= max;
}

function validateNoDuplicates(values) {
  return new Set(values).size === values.length;
}

function normalizePorts(ports) {
  return {
    sensors: {
      sound: ports.sensors.sound,
      light: ports.sensors.light,
      moisture: ports.sensors.moisture,
      temperatureHumidity: ports.sensors.temperatureHumidity,
      motion: ports.sensors.motion
    },
    actuators: {
      buzzer: ports.actuators.buzzer,
      relay1: ports.actuators.relay1,
      led: ports.actuators.led,
      relay2: ports.actuators.relay2,
      relay3: ports.actuators.relay3
    }
  };
}

function validatePorts(ports) {
  if (!ports || typeof ports !== 'object') {
    return { valid: false, error: 'Ports payload must be an object' };
  }
  if (!ports.sensors || typeof ports.sensors !== 'object') {
    return { valid: false, error: 'Missing sensors mapping' };
  }
  if (!ports.actuators || typeof ports.actuators !== 'object') {
    return { valid: false, error: 'Missing actuators mapping' };
  }

  for (const key of SENSOR_KEYS) {
    if (!(key in ports.sensors)) {
      return { valid: false, error: `Missing sensors.${key}` };
    }
    if (!validateRange(ports.sensors[key], 0, 8)) {
      return { valid: false, error: `sensors.${key} must be an integer from 0 to 8` };
    }
  }

  for (const key of ACTUATOR_KEYS) {
    if (!(key in ports.actuators)) {
      return { valid: false, error: `Missing actuators.${key}` };
    }
    if (!validateRange(ports.actuators[key], 0, 8)) {
      return { valid: false, error: `actuators.${key} must be an integer from 0 to 8` };
    }
  }

  const sensorPorts = SENSOR_KEYS.map((key) => ports.sensors[key]);
  if (!validateNoDuplicates(sensorPorts)) {
    return { valid: false, error: 'Sensor ports must be unique' };
  }

  const actuatorPorts = ACTUATOR_KEYS.map((key) => ports.actuators[key]);
  if (!validateNoDuplicates(actuatorPorts)) {
    return { valid: false, error: 'Actuator ports must be unique' };
  }

  return { valid: true, ports: normalizePorts(ports) };
}

module.exports = {
  DEFAULT_PORTS,
  SENSOR_KEYS,
  ACTUATOR_KEYS,
  normalizePorts,
  validatePorts
};
