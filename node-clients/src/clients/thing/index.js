import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import launcher from '@soundworks/helpers/launcher.js';
// import some classes from the node-web-audio-api package
import { AudioContext, GainNode, OscillatorNode } from 'node-web-audio-api';

import { loadConfig } from '../../utils/load-config.js';

// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

async function bootstrap() {
  /**
   * Load configuration from config files and create the soundworks client
   */
  const config = loadConfig(process.env.ENV, import.meta.url);
  const client = new Client(config);

  /**
   * Register some soundworks plugins, you will need to install the plugins
   * before hand (run `npx soundworks` for help)
   */
  // client.pluginManager.register('my-plugin', plugin);

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

  const audioContext = new AudioContext();
  // create the thing state and initialize it's id field
  const thing = await client.stateManager.create('thing', {
    id: client.id,
  });
  // react to updates triggered from controller
  thing.onUpdate(updates => {
    if ('triggerSound' in updates) {
      const now = audioContext.currentTime;

      const env = new GainNode(audioContext, { gain: 0 });
      env.connect(audioContext.destination);
      env.gain.setValueAtTime(0, now)
      env.gain.linearRampToValueAtTime(1, now + 0.01)
      env.gain.exponentialRampToValueAtTime(0.0001, now + 1);

      // randomly pick one of harmonics of a sound at 50Hz
      const frequency = Math.floor(Math.random() * 10) * 50 + 50;
      const osc = new OscillatorNode(audioContext, { frequency });
      osc.connect(env);
      osc.start(now);
      osc.stop(now + 1);
    }
  });

  console.log(`Hello ${client.config.app.name}!`);
}

// The launcher allows to fork multiple clients in the same terminal window
// by defining the `EMULATE` env process variable
// e.g. `EMULATE=10 npm run watch-process thing` to run 10 clients side-by-side
launcher.execute(bootstrap, {
  numClients: process.env.EMULATE ? parseInt(process.env.EMULATE) : 1,
  moduleURL: import.meta.url,
});
