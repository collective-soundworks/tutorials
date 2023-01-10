import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import launcher from '@soundworks/helpers/launcher.js';

import createLayout from './views/layout.js';

// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

/**
 * Grab the configuration object written by the server in the `index.html`
 */
const config = window.SOUNDWORKS_CONFIG;

/**
 * If multiple clients are emulated you might to want to share some resources
 */
// const audioContext = new AudioContext();

async function main($container) {
  try {
    /**
     * Create the soundworks client
     */
    const client = new Client(config);

    /**
     * Register some soundworks plugins, you will need to install the plugins
     * before hand (run `npx soundworks` for help)
     */
    // client.pluginManager.register('platform', pluginPlatform, { audioContext });

    /**
     * Register the soundworks client into the launcher
     *
     * The launcher will do a bunch of stuff for you:
     * - Display default initialization screens. If you want to change the provided
     * initialization screens, you can import all the helpers directly in your
     * application by doing `npx soundworks --eject-helpers`. You can also
     * customise some global syles variables (background-color, text color etc.)
     * in `src/clients/components/css/app.scss`.
     * You can also change the default language of the intialization screen by
     * setting, the `launcher.language` property, e.g.:
     * `launcher.language = 'fr'`
     * - By default the launcher automatically reloads the client when the socket
     * closes or when the page is hidden. Such behavior can be quite important in
     * performance situation where you don't want some phone getting stuck making
     * noise without having any way left to stop it... Also be aware that a page
     * in a background tab will have all its timers (setTimeout, etc.) put in very
     * low priority, messing any scheduled events.
     */
    launcher.register(client, { initScreensContainer: $container });

    /**
     * Launch application
     */
    await client.start();

    const globals = await client.stateManager.attach('globals');
    console.log('globals shared state', globals.getValues());

    globals.onUpdate(updates => {
      console.log(updates);

      if (updates.trigger) {
        $container.style.backgroundColor = 'white';

        setTimeout(() => {
          $container.style.backgroundColor = 'black';
        }, 150);
      }
    });

    $container.innerHTML = `<h1 style="padding:20px;">Click here!</h1>`;

    $container.addEventListener('click', () => {
      globals.set({ trigger: true });
    });

  } catch(err) {
    console.error(err);
  }
}

// The launcher enables instanciation of multiple clients in the same page to
// facilitate development and testing.
// e.g. `http://127.0.0.1:8000?emulate=10` to run 10 clients side-by-side
launcher.execute(main, {
  numClients: parseInt(new URLSearchParams(window.location.search).get('emulate')) || 1,
});