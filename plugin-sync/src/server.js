import '@soundworks/helpers/polyfills.js';
import '@soundworks/helpers/catch-unhandled-errors.js';
import { Server } from '@soundworks/core/server.js';
import { loadConfig, configureHttpRouter } from '@soundworks/helpers/server.js';
import ServerPluginPlatformInit from '@soundworks/plugin-platform-init/server.js';
import ServerPluginSync from '@soundworks/plugin-sync/server.js';

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

server.pluginManager.register('platform-init', ServerPluginPlatformInit);
server.pluginManager.register('sync', ServerPluginSync);

server.stateManager.defineClass('global', {
  triggerTime: {
    type: 'float',
    event: true,
  },
});

await server.start();
// create a global state on which all clients will attach
const _ = await server.stateManager.create('global');


