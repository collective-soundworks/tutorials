export default {
  id: {
    type: 'integer',
    default: 0,
  },
  frequency: {
    type: 'float',
    min: 50,
    max: 1000,
    default: 440,
  },
};
