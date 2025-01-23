import '@soundworks/helpers/polyfills.js';
import { Server } from '@soundworks/core/server.js';
import pluginPlatformInit from '@soundworks/plugin-platform-init/server.js';
import pluginFilesystem from '@soundworks/plugin-filesystem/server.js';
import { loadConfig } from '@soundworks/helpers/node.js';

import '../utils/catch-unhandled-errors.js';

import { schema, schemaName } from './schemas/partySchema.js';

// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

const config = loadConfig(process.env.ENV, import.meta.url);

console.log(`
--------------------------------------------------------
- launching "${config.app.name}" in "${process.env.ENV || 'default'}" environment
- [pid: ${process.pid}]
--------------------------------------------------------
`);

/**
 * Create the soundworks server
 */
const server = new Server(config);
// configure the server for usage within this application template
server.useDefaultApplicationTemplate();

/**
 * Register plugins and schemas
 */
// server.pluginManager.register('my-plugin', plugin);
// server.stateManager.registerSchema('my-schema', definition);

server.stateManager.registerSchema(schemaName, schema);

server.pluginManager.register('platformInit', pluginPlatformInit);

server.pluginManager.register('soundFilesystem', pluginFilesystem, {
  // path to the watched directory, can be relative to process.cwd()
  // or absolute, in all cases file paths in the tree will be normalized
  // to be relative to `process.cwd()`
  dirname: 'public/sounds',
  // if defined, add an `url` to each tree node, that defines the
  // route at which the files are publicly accessible.
  publicPath: 'sounds',
});

/**
 * Launch application (init plugins, http server, etc.)
 */
await server.start();

// Debug

const partyState = await server.stateManager.create(schemaName);
partyState.onUpdate( (updates) => {
  // console.log('partyState', updates);

});

const soundFileSystem = await server.pluginManager.get('soundFilesystem');
soundFileSystem.onUpdate( async ({tree, events}) => {
  const sounds = tree.children.filter( (node) => {
    return node.type === 'file'
      && (node.extension === '.wav' || node.extension === '.mp3');
  });

  partyState.set({sounds});

  console.log('sounds',
    sounds.map( (node) => node.url)
  );

  // set default url
  if (sounds.length > 0 && !partyState.get('sound') ) {
    await partyState.set({ sound: sounds[0] });
  }
},
  true,
);

