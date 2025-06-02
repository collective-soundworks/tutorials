import '@soundworks/helpers/polyfills.js';
import '@soundworks/helpers/catch-unhandled-errors.js';
import { Server } from '@soundworks/core/server.js';
import { loadConfig, configureHttpRouter } from '@soundworks/helpers/server.js';
import ServerPluginPlatformInit from '@soundworks/plugin-platform-init/server.js';

import globalStateDescription from './global-state-description.js';
import playerStateDescription from './player-state-description.js';

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

const server = new Server(config);
configureHttpRouter(server);
// define the global shared state class
server.stateManager.defineClass('global', globalStateDescription);
server.stateManager.defineClass('player', playerStateDescription);
// install plugins
server.pluginManager.register('platform-init', ServerPluginPlatformInit);

await server.start();
// create the shared global state instance // [!code ++]
const global = await server.stateManager.create('global'); // [!code ++]
console.log(global.getValues()); // [!code ++]

