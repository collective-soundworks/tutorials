import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import launcher from '@soundworks/helpers/launcher.js';

import { loadConfig } from '../../utils/load-config.js';
import createLayout from './views/layout.js';

// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

async function bootstrap() {
  try {
    /**
     * Load configuration from config files and create the soundworks client
     */
    const config = loadConfig(process.env.ENV, import.meta.url);
    const client = new Client(config);

    /**
     * Register some soundworks plugins
     * you will need to install the plugins before hand, run `npx soundworks` for help
     */
    // client.pluginManager.register('platform', pluginPlatform, { audioContext });

    /**
     * Register the soundworks client into the launcher
     *
     * Automatically restarts the process when the socket closes or when an
     * uncaught error occurs in the program.
     */
    launcher.register(client);

    /**
     * Launch application
     */
    await client.start();

    // create application layout (which mimics lit API) and do your own stuff!

    /* eslint-disable-next-line no-unused-vars */
    const $layout = createLayout(client);

  } catch(err) {
    console.error(err);
  }
}

// The launcher allows to fork multiple clients in the same terminal window
// by defining the `EMULATE` env process variable
// e.g. `EMULATE=10 npm run watch-process thing` to run 10 clients side-by-side
launcher.execute(bootstrap, {
  numClients: process.env.EMULATE ? parseInt(process.env.EMULATE) : 1,
  moduleURL: import.meta.url,
});
