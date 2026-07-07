const { LIMITS } = require('./sensorLimits');

const DEFAULT_RULES = {
  temperature: { coldBelow: 20, hotAbove: 30 },
  humidity: { dryBelow: 40, wetAbove: 70 },
  light: { lowBelow: 200, highAbove: 350 },
  soil: { dryBelow: 450, wetAbove: 650 },
  security: { intrusionLightBelow: 200, criticalTempAbove: 40 },
  schedule: { dayStartHour: 6, dayEndHour: 22 }
};

const RANGE_FIELDS = {
  temperature: { lowKey: 'coldBelow', highKey: 'hotAbove', limitKey: 'temperature' },
  humidity: { lowKey: 'dryBelow', highKey: 'wetAbove', limitKey: 'humidity' },
  light: { lowKey: 'lowBelow', highKey: 'highAbove', limitKey: 'light' },
  soil: { lowKey: 'dryBelow', highKey: 'wetAbove', limitKey: 'moisture' }
};

function isNumber(value) {
  return typeof value === 'number' && !Number.isNaN(value);
}

function validateRangeSection(section, config, limitKey) {
  const { lowKey, highKey } = config;
  const low = section[lowKey];
  const high = section[highKey];

  if (!isNumber(low) || !isNumber(high)) {
    return `${lowKey} and ${highKey} must be numbers`;
  }

  if (low >= high) {
    return `${lowKey} (${low}) must be less than ${highKey} (${high})`;
  }

  const bounds = LIMITS[limitKey];
  if (bounds) {
    if (low < bounds.min || high > bounds.max) {
      return `values must be within ${bounds.min}–${bounds.max}`;
    }
  }

  return null;
}

function validateRules(rules) {
  if (!rules || typeof rules !== 'object') {
    return { valid: false, error: 'Rules must be an object' };
  }

  for (const [sectionName, config] of Object.entries(RANGE_FIELDS)) {
    const section = rules[sectionName];
    if (!section || typeof section !== 'object') {
      return { valid: false, error: `Missing section: ${sectionName}` };
    }

    const error = validateRangeSection(section, config, config.limitKey);
    if (error) {
      return { valid: false, error: `${sectionName}: ${error}` };
    }
  }

  const security = rules.security;
  if (!security || typeof security !== 'object') {
    return { valid: false, error: 'Missing section: security' };
  }

  if (!isNumber(security.intrusionLightBelow)) {
    return { valid: false, error: 'security.intrusionLightBelow must be a number' };
  }

  if (!isNumber(security.criticalTempAbove)) {
    return { valid: false, error: 'security.criticalTempAbove must be a number' };
  }

  const lightBounds = LIMITS.light;
  if (
    security.intrusionLightBelow < lightBounds.min ||
    security.intrusionLightBelow > lightBounds.max
  ) {
    return { valid: false, error: 'security.intrusionLightBelow out of range' };
  }

  const tempBounds = LIMITS.temperature;
  if (
    security.criticalTempAbove < tempBounds.min ||
    security.criticalTempAbove > tempBounds.max
  ) {
    return { valid: false, error: 'security.criticalTempAbove out of range' };
  }

  const schedule = rules.schedule;
  if (!schedule || typeof schedule !== 'object') {
    return { valid: false, error: 'Missing section: schedule' };
  }

  const { dayStartHour, dayEndHour } = schedule;
  if (!isNumber(dayStartHour) || !isNumber(dayEndHour)) {
    return { valid: false, error: 'schedule hours must be numbers' };
  }

  if (
    dayStartHour < 0 ||
    dayStartHour > 23 ||
    dayEndHour < 0 ||
    dayEndHour > 23
  ) {
    return { valid: false, error: 'schedule hours must be 0–23' };
  }

  if (dayStartHour === dayEndHour) {
    return { valid: false, error: 'dayStartHour and dayEndHour must differ' };
  }

  return { valid: true, rules: normalizeRules(rules) };
}

function normalizeRules(rules) {
  return {
    temperature: {
      coldBelow: rules.temperature.coldBelow,
      hotAbove: rules.temperature.hotAbove
    },
    humidity: {
      dryBelow: rules.humidity.dryBelow,
      wetAbove: rules.humidity.wetAbove
    },
    light: {
      lowBelow: rules.light.lowBelow,
      highAbove: rules.light.highAbove
    },
    soil: {
      dryBelow: rules.soil.dryBelow,
      wetAbove: rules.soil.wetAbove
    },
    security: {
      intrusionLightBelow: rules.security.intrusionLightBelow,
      criticalTempAbove: rules.security.criticalTempAbove
    },
    schedule: {
      dayStartHour: rules.schedule.dayStartHour,
      dayEndHour: rules.schedule.dayEndHour
    }
  };
}

module.exports = {
  DEFAULT_RULES,
  RANGE_FIELDS,
  validateRules,
  normalizeRules
};
