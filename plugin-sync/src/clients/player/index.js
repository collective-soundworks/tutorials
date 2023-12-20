import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import launcher from '@soundworks/helpers/launcher.js';

import pluginPlatformInit from '@soundworks/plugin-platform-init/client.js';
import pluginSync from '@soundworks/plugin-sync/client.js';

import { html, render } from 'lit';
import '../components/sw-credits.js';

// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

/**
 * Grab the configuration object written by the server in the `index.html`
 */
const config = window.SOUNDWORKS_CONFIG;
// create an new audio context instance
const audioContext = new AudioContext();

async function main($container) {
  /**
   * Create the soundworks client
   */
  const client = new Client(config);
  // register plugins
  client.pluginManager.register('platform-init', pluginPlatformInit, {
    audioContext
  });

  client.pluginManager.register('sync', pluginSync, {
    // use the audio context clock
    getTimeFunction: () => audioContext.currentTime,
    // declare the 'platform-init' plugin as a dependency, so that the
    // sync process starts only when the audio context is resumed
  }, ['platform-init']);

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
  // retrieve the sync plugin instance
  const sync = await client.pluginManager.get('sync');

  function renderApp() {
    render(html`
      <div class="simple-layout">
        <p>localTime: ${sync.getLocalTime()}</p>
        <p>syncTime: ${sync.getSyncTime()}</p>

        <sw-credits .infos="${client.config.app}"></sw-credits>
      </div>
    `, $container);

    // refresh the screen at 60 fps
    window.requestAnimationFrame(renderApp);
  }

  renderApp();
}

// The launcher enables instanciation of multiple clients in the same page to
// facilitate development and testing.
// e.g. `http://127.0.0.1:8000?emulate=10` to run 10 clients side-by-side
launcher.execute(main, {
  numClients: parseInt(new URLSearchParams(window.location.search).get('emulate')) || 1,
});