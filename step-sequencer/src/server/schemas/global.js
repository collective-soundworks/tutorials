export default {
  running: {
    type: 'boolean',
    default: false,
  },
  startTime: {
    type: 'float',
    default: null,
    nullable: true,
  },
  BPM: {
    type: 'integer',
    default: 120,
  },
  BPMChangeTime: {
    type: 'float',
    default: null,
    nullable: true,
  },
  score: {
    type: 'any',
    default: [],
  },
};
