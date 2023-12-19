import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import launcher from '@soundworks/helpers/launcher.js';

import pluginPlatformInit from '@soundworks/plugin-platform-init/client.js';

import { html, render } from 'lit';
import '../components/sw-credits.js';
import '../components/sw-player.js';

// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

/**
 * Grab the configuration object written by the server in the `index.html`
 */
const config = window.SOUNDWORKS_CONFIG;
// If multiple clients are emulated you might to want to share the audio context
const audioContext = new AudioContext();

async function main($container) {
  /**
   * Create the soundworks client
   */
  const client = new Client(config);
  // register the platform-init plugin, and pass it the AudioContext instance
  // so that it is resumed on the splashscreen user gesture
  client.pluginManager.register('platform-init', pluginPlatformInit, {
    audioContext
  });

  /**
   * Register some soundworks plugins, you will need to install the plugins
   * before hand (run `npx soundworks` for help)
   */
  // client.pluginManager.register('my-plugin', plugin);

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
  // attach to the global state
  const global = await client.stateManager.attach('global');
  const player = await client.stateManager.create('player', {
    id: client.id,
  });

  function renderApp() {
    render(html`
      <div class="simple-layout">
        <sw-player .player=${player}></sw-player>

        <h2>Global</h2>
        <p>Master: ${global.get('master')}</p>
        <p>Mute: ${global.get('mute')}</p>

        <sw-credits .infos="${client.config.app}"></sw-credits>
      </div>
    `, $container);
  }

  // create the master bus chain
  // [mute <GainNode>] -> [master <GainNode>] -> [destination]
  const master = audioContext.createGain();
  master.gain.value = global.get('master');
  master.connect(audioContext.destination);

  const mute = audioContext.createGain();
  mute.gain.value = global.get('mute') ? 0 : 1;
  mute.connect(master);

  let synthToggle = null;

  player.onUpdate(updates => {
    console.log(updates, synthToggle);
    for (let key in updates) {
      const value = updates[key];

      switch (key) {
        case 'synthToggle': {
          if (value === true) {
            // start the synth
            synthToggle = audioContext.createOscillator();
            synthToggle.connect(mute);
            synthToggle.frequency.value = player.get('frequency');
            synthToggle.start();
          } else if (synthToggle !== null) {
            // stop the synth
            synthToggle.stop();
            synthToggle = null;
          }
          break;
        }
        case 'frequency': {
          // update the start / stop synth frequency if it is runnings
          if (synthToggle !== null) {
            const now = audioContext.currentTime;
            synthToggle.frequency.setTargetAtTime(value, now, 0.02);
          }
          break;
        }
        case 'synthTrigger': {
          if (value !== null) {
            // trigger a 1 second sound at twice the frequency
            const now = audioContext.currentTime;

            const env = audioContext.createGain();
            env.connect(mute);
            env.gain.value = 0;
            env.gain.setValueAtTime(0, now);
            env.gain.linearRampToValueAtTime(1, now + 0.01);
            env.gain.exponentialRampToValueAtTime(0.001, now + 1);

            const osc = audioContext.createOscillator();
            osc.connect(env);
            osc.frequency.value = player.get('frequency') * 2;
            osc.start(now);
            osc.stop(now + 1);
          }
          break;
        }
      }
    }

    renderApp();
  }, true);

  global.onUpdate(updates => {
    for (let key in updates) {
      const value = updates[key];

      switch (key) {
        case 'master': {
          const now = audioContext.currentTime;
          master.gain.setTargetAtTime(value, now, 0.02);
          break;
        }
        case 'mute': {
          const gain = value ? 0 : 1;
          const now = audioContext.currentTime;
          mute.gain.setTargetAtTime(gain, now, 0.02);
          break;
        }
      }
    }
    // update the view to log current global values
    renderApp();
  }, true);
}

// The launcher enables instanciation of multiple clients in the same page to
// facilitate development and testing.
// e.g. `http://127.0.0.1:8000?emulate=10` to run 10 clients side-by-side
launcher.execute(main, {
  numClients: parseInt(new URLSearchParams(window.location.search).get('emulate')) || 1,
});
