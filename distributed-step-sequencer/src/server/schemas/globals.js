export default {
  BPM: {
    type: 'integer',
    default: 240,
  },
  numSteps: {
    type: 'integer',
    default: 16,
  },
  numTracks: {
    type: 'integer',
    default: 8,
  },
  score: {
    type: 'any',
    default: [],
  },
  numPlayers: {
    type: 'integer',
    default: 0,
  },
  started: {
    type: 'boolean',
    default: false,
  },
  startTime: {
    type: 'float',
    default: null,
    nullable: true,
  },
  volume: {
    type: 'float',
    default: 1,
    max: 1,
    min: 0,
  },
};
