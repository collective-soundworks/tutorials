import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import pluginSync from '@soundworks/plugin-sync/client.js';
import { loadConfig, launcher } from '@soundworks/helpers/node.js';

import { AudioContext } from 'node-web-audio-api';

import { schemaName as playingSchemaName } from '../../server/schemas/partySchema.js';
import { Audio } from '../shared/audio.js';

// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

async function main() {

  const audioContext = new AudioContext();

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

  client.pluginManager.register('sync', pluginSync, {
    getTimeFunction: () => audioContext.currentTime,
  });


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

  const sync = await client.pluginManager.get('sync');
  const audio = new Audio({
    context: audioContext,
    sync,
    onended: async () => partyState.set({ transport: 'stop' }),
  });

  const partyState = await client.stateManager.attach(playingSchemaName);
  const partyStateUpdate = async (updates) => {
    // console.log('partyStateUpdate', updates);

    let transportTime = (updates.transportTime
      ? updates.transportTime
      : partyState.get('transportTime')
    );

    const { loop } = updates;
    if (typeof loop !== 'undefined') {
      audio.loopSet(loop);
    }

    const { sound } = updates;
    if (typeof sound !== 'undefined') {
      if(typeof process !== 'undefined') {
        const { useHttps, serverAddress, port } = config.env;
        const protocol = (useHttps ? 'https' : 'http');
        sound.url = `${protocol}://${serverAddress}:${port}/${sound.url}`;
      }

      await audio.soundLoad(sound.url);

      if (partyState.get('transport') === 'play') {
        audio.soundStart({ time: transportTime });
      }
    }

    const { transport } = updates;
    if (transport === 'stop') {
      audio.soundStop({ time: transportTime });
    } else if (transport === 'play') {
      audio.soundStart({ time: transportTime });
    }

    renderApp();
  }

  partyState.onUpdate( async (updates) => await partyStateUpdate(updates));

  function renderApp() {
    const { sound, soundCollection, transport, loop } = partyState.getValues();
    console.log(sound.name, '\t', transport, loop ? 'loop' : '');
  }

  const initialValues = await partyState.getValues();
  await partyStateUpdate(initialValues);

}

// The launcher allows to fork multiple clients in the same terminal window
// by defining the `EMULATE` env process variable
// e.g. `EMULATE=10 npm run watch thing` to run 10 clients side-by-side
launcher.execute(main, {
  numClients: process.env.EMULATE ? parseInt(process.env.EMULATE) : 1,
  moduleURL: import.meta.url,
});
