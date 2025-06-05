import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import { loadConfig, launcher } from '@soundworks/helpers/node.js';
// import some classes from the node-web-audio-api package // [!code ++]
import { AudioContext, GainNode, OscillatorNode } from 'node-web-audio-api'; // [!code ++]

// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

async function bootstrap() {
  const config = loadConfig(process.env.ENV, import.meta.url);
  const client = new Client(config);

  // Eventually register plugins
  // client.pluginManager.register('my-plugin', plugin);

  // https://soundworks.dev/tools/helpers.html#nodelauncher
  launcher.register(client);

  await client.start();
  // create an audio context (note that it is resumed by default)
  const audioContext = new AudioContext(); // [!code ++]
  // create the thing state and initialize it's id field
  const thing = await client.stateManager.create('thing', {
    id: client.id,
  });
  // react to updates triggered from controller
  thing.onUpdate(updates => { // [!code ++]
    if ('triggerSound' in updates) { // [!code ++]
      const now = audioContext.currentTime; // [!code ++]
  // [!code ++]
      const env = new GainNode(audioContext, { gain: 0 }); // [!code ++]
      env.connect(audioContext.destination); // [!code ++]
      env.gain.setValueAtTime(0, now); // [!code ++]
      env.gain.linearRampToValueAtTime(1, now + 0.01); // [!code ++]
      env.gain.exponentialRampToValueAtTime(0.0001, now + 1); // [!code ++]
  // [!code ++]
      // randomly pick one of harmonics of a sound at 50Hz // [!code ++]
      const frequency = Math.floor(Math.random() * 10) * 50 + 100; // [!code ++]
      const osc = new OscillatorNode(audioContext, { frequency }); // [!code ++]
      osc.connect(env); // [!code ++]
      osc.start(now); // [!code ++]
      osc.stop(now + 1); // [!code ++]
    } // [!code ++]
  }); // [!code ++]

  console.log(`Hello ${client.config.app.name}!`);
}

// The launcher allows to launch multiple clients in the same terminal window
// e.g. `EMULATE=10 npm run watch thing` to run 10 clients side-by-side
launcher.execute(bootstrap, {
  numClients: process.env.EMULATE ? parseInt(process.env.EMULATE) : 1,
  moduleURL: import.meta.url,
});
