import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import pluginSync from '@soundworks/plugin-sync/client.js';

import { schemaName as playingSchemaName } from '../../server/schemas/partySchema.js';
import { Audio } from './audio.js';

const isNode = typeof process !== 'undefined';
const isBrowser = typeof window !== 'undefined';

async function importForNode(module, browserFallback) {
  if(isNode) {
    return await import(module);
  }
  return browserFallback;
}

async function importForBrowser(module, nodeFallback) {
  if(isBrowser) {
    return await import(module);
  }
  return nodeFallback;
}

async function importForNodeOrBrowser(nodeModule, browserModule) {
  if(isNode) {
    return await import(nodeModule);
  } else {
    return await import(browserModule);
  }
}


// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

let launcher = null;
let loadConfig = null;

async function main($container) {

  const { html, render } = await importForBrowser('lit');

  const pluginPlatformInit = await importForBrowser('@soundworks/plugin-platform-init/client.js');

  await importForBrowser('@ircam/sc-components/sc-select.js');
  await importForBrowser('@ircam/sc-components/sc-transport.js');
  await importForBrowser('@ircam/sc-components/sc-loop.js');
  await importForBrowser('../components/sw-audit.js');

  const { AudioContext } = await importForNode(
    'node-web-audio-api',
    window.AudioContext,
  );
  const audioContext = new AudioContext();

  /**
   * Load configuration from config files and create the soundworks client
   */

  const config = (isBrowser
    ? loadConfig()
    : loadConfig(process.env.ENV, import.meta.url)
  );
  const client = new Client(config);

  if (isBrowser) {
    launcher.register(client, {
      initScreensContainer: $container,
      reloadOnVisibilityChange: false,
    });
  } else {
    launcher.register(client);
  }

  if (isBrowser) {
    client.pluginManager.register('platformInit', pluginPlatformInit, {
      audioContext,
    });
  }

  client.pluginManager.register('sync', pluginSync, {
    getTimeFunction: () => audioContext.currentTime,
  }, (isBrowser
    ? ['platformInit']
    : undefined
  ));

  await client.start();

  const sync = await client.pluginManager.get('sync');
  const audio = new Audio({
    context: audioContext,
    sync,
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

  partyState.onUpdate(async (updates) => await partyStateUpdate(updates));

  const renderApp = (isNode
    ? () => { }
    : () => {
      const { sound, soundCollection, transport, loop } = partyState.getValues();

      render(html`
        <div class="controller-layout">
          <header>
            <h1>${client.config.app.name} | ${client.role}</h1>
            <sw-audit .client="${client}"></sw-audit>
          </header>
          <section>
            <p>

              <sc-select
                .options=${soundCollection.reduce((o, s) => {
                  Object.assign(o, { [s.name]: JSON.stringify(s) });
                  return o;
                }, {})}
                .value=${JSON.stringify(sound)}
                @change=${async (event) => {
                  await partyState.set({ transport: 'stop' });
                  const sound = JSON.parse(event.detail.value);
                  await partyState.set({
                    sound,
                    transport, // resume
                });
              }}
              ></sc-select>

              <sc-transport
                .buttons=${['stop', 'play']}
                .value=${transport}
                @change=${async (event) => {
                  const transport = event.detail.value;
                  await partyState.set({ transport });
                }}
              ></sc-transport>

              <sc-loop
                .active=${loop}
                @change=${async (event) => {
                  const loop = event.detail.value;
                  await partyState.set({ loop });
                }}
              ></sc-loop>

            </p>
          </section>
        </div>
    `, $container);
    }
  );

  // renderApp();
  const initialValues = await partyState.getValues();
  await partyStateUpdate(initialValues);
}

(async () => {
  ({ loadConfig, launcher } = await importForNodeOrBrowser(
    '@soundworks/helpers/node.js',
    '@soundworks/helpers/browser.js',
  ));

  if (isBrowser) {
    // The launcher allows to fork multiple clients in the same browser window
    // by defining the `emulate` url parameter
    // e.g. `http://server.com/?emulate=10 to run 10 clients side-by-side

    launcher.execute(main, {
      numClients: parseInt(new URLSearchParams(window.location.search).get('emulate')) || 1,
      width: '50%',
    });
  } else {
    // The launcher allows to fork multiple clients in the same terminal window
    // by defining the `EMULATE` env process variable
    // e.g. `EMULATE=10 npm run watch thing` to run 10 clients side-by-side
    launcher.execute(main, {
      numClients: process.env.EMULATE ? parseInt(process.env.EMULATE) : 1,
      moduleURL: import.meta.url,
    });
  }
})();
