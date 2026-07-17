const SENSOR_FIELDS = [
  'temperature',
  'humidity',
  'light',
  'sound',
  'moisture',
  'motion'
];

const LIMITS = {
  temperature: { min: -10, max: 60 },
  humidity: { min: 0, max: 100 },
  light: { min: 0, max: 1023 },
  sound: { min: 0, max: 1023 },
  moisture: { min: 0, max: 1023 }
};

const STALE_THRESHOLD_SEC = 15;

function isValidField(field, value) {
  if (field === 'motion') {
    return typeof value === 'boolean';
  }

  if (typeof value !== 'number' || Number.isNaN(value)) {
    return false;
  }

  const limit = LIMITS[field];
  if (!limit) {
    return false;
  }

  return value >= limit.min && value <= limit.max;
}

function validateSensorPayload(payload) {
  const valid = {};
  const invalid = {};

  for (const field of SENSOR_FIELDS) {
    if (!(field in payload)) {
      continue;
    }

    if (isValidField(field, payload[field])) {
      valid[field] = payload[field];
    } else {
      invalid[field] = true;
    }
  }

  return { valid, invalid };
}

function createEmptySensorMeta() {
  const meta = {};

  for (const field of SENSOR_FIELDS) {
    meta[field] = { stale: true, invalid: false };
  }

  return meta;
}

module.exports = {
  SENSOR_FIELDS,
  LIMITS,
  STALE_THRESHOLD_SEC,
  isValidField,
  validateSensorPayload,
  createEmptySensorMeta
};
