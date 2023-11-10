import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import launcher from '@soundworks/helpers/launcher.js';
import { html } from 'lit';

import pluginPlatformInit from '@soundworks/plugin-platform-init/client.js';

import createLayout from './views/layout.js';
import '../components/sw-player.js';


// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

/**
 * Grab the configuration object written by the server in the `index.html`
 */
const config = window.SOUNDWORKS_CONFIG;

/**
 * If multiple clients are emulated you might to want to share the audio context
 */
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
  const player = await client.stateManager.create('player', {
    id: client.id,
  });

  const $layout = createLayout(client, $container);

  $layout.addComponent(html`<sw-player .playerState=${player}></sc-player>`);

  // add simple log component to the layout
  $layout.addComponent({
    render: () => {
      return html`
        <h2>Globals</h2>
        <p>Master: ${globals.get('master')}</p>
        <p>Mute: ${globals.get('mute')}</p>
      `;
    }
  });

  // create the audio chain
  // [mute] -> [master] -> [destination]
  const master = audioContext.createGain();
  master.gain.value = globals.get('master');
  master.connect(audioContext.destination);

  const mute = audioContext.createGain();
  mute.gain.value = globals.get('mute') ? 0 : 1;
  mute.connect(master);

  globals.onUpdate(updates => {
    for (let [key, value] of Object.entries(updates)) {
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

    // update the view each time to log current globals values
    $layout.requestUpdate();
  });

  // hold the oscillator for the start / stop synth
  let synthStartStop = null;

  player.onUpdate(updates => {
    for (let [key, value] of Object.entries(updates)) {
      switch (key) {
        case 'synthStartStop': {
          if (value === true) {
            // start the synth
            synthStartStop = audioContext.createOscillator();
            synthStartStop.connect(mute);
            synthStartStop.frequency.value = player.get('frequency');
            synthStartStop.start();
          } else {
            // stop the synth
            synthStartStop.stop();
            synthStartStop = null;
          }
          break;
        }
        case 'synthTrigger': {
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
          break;
        }
        case 'frequency': {
          // update the start / stop synth frequency if it is runnings
          if (synthStartStop !== null) {
            const now = audioContext.currentTime;
            synthStartStop.frequency.setTargetAtTime(value, now, 0.02);
          }
          break;
        }
      }
    }
  });

}

// The launcher enables instanciation of multiple clients in the same page to
// facilitate development and testing.
// e.g. `http://127.0.0.1:8000?emulate=10` to run 10 clients side-by-side
launcher.execute(main, {
  numClients: parseInt(new URLSearchParams(window.location.search).get('emulate')) || 1,
});
