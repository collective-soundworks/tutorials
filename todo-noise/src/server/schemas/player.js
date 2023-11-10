export default {
  id: {
    type: 'integer',
    default: null,
    nullable: true,
  },
  frequency: {
    type: 'float',
    default: 200,
    min: 50,
    max: 2000,
  },
  synthStartStop: {
    type: 'boolean',
    default: false,
    immediate: true,
  },
  synthTrigger: {
    type: 'boolean',
    event: true,
    immediate: true,
  },
};

