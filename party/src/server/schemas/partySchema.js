export const schema = {
  soundCollection: {
    type: 'any',
    default: [],
  },
  sound: {
    type: 'any',
    default: null,
    nullable: true,
  },
  transport: {
    type: 'string',
    default: 'stop',
  },
  // absolute sync time (in seconds)
  transportTime: {
    type: 'float',
    default: 0,
  },
  // to compensate latency
  transportLookAhead: {
    type: 'float',
    default: 0.5, // in seconds
  },
  loop: {
    type: 'boolean',
    default: false,
  },
}

export const schemaName = 'playing';
