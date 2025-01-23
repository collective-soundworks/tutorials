export const schema = {
  sounds: {
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
  loop: {
    type: 'boolean',
    default: false,
  },
}

export const schemaName = 'playing';
