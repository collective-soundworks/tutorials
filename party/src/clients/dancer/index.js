import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import pluginPlatformInit from '@soundworks/plugin-platform-init/client.js';
import { loadConfig, launcher } from '@soundworks/helpers/browser.js';
import { html, render } from 'lit';
import '@ircam/sc-components/sc-select.js';
import '@ircam/sc-components/sc-transport.js';
import '@ircam/sc-components/sc-loop.js';


import '../components/sw-audit.js';

import { schemaName as playingSchemaName } from '../../server/schemas/partySchema.js';
import { Audio } from './audio.js';

// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`
async function main($container) {

  /**
   * Load configuration from config files and create the soundworks client
   */
  const config = loadConfig();
  const client = new Client(config);
  const audio = new Audio();

  launcher.register(client, {
    initScreensContainer: $container,
    reloadOnVisibilityChange: false,
  });

  client.pluginManager.register('platformInit', pluginPlatformInit, {
    audioContext: audio.context,
   });

  await client.start();

  const partyState = await client.stateManager.attach(playingSchemaName);
  const partyStateUpdate = async (updates) => {
    // console.log('partyStateUpdate', updates);

    const { loop } = updates;
    if (typeof loop !== 'undefined') {
      audio.loopSet(loop);
    }

    const { sound } = updates;
    if (typeof sound !== 'undefined') {
      await audio.soundLoad(sound.url);

      if (partyState.get('transport') === 'play') {
        audio.soundStart();
      }
    }

    const { transport } = updates;
    if (transport === 'stop') {
      audio.soundStop();
    } else if (transport === 'play') {
      audio.soundStart();
    }

    renderApp();
  }

  partyState.onUpdate( async (updates) => await partyStateUpdate(updates));


  function renderApp() {
    const { sound, sounds, transport, loop } = partyState.getValues();

    render(html`
      <div class="controller-layout">
        <header>
          <h1>${client.config.app.name} | ${client.role}</h1>
          <sw-audit .client="${client}"></sw-audit>
        </header>
        <section>
          <p>

            <sc-select
              .options=${sounds.reduce( (o, s) => {
                Object.assign(o, {[s.name]: JSON.stringify(s)});
                return o;
              }, {} ) }
              .value=${JSON.stringify(sound)}
              @change=${ async (event) => {
                const sound = JSON.parse(event.detail.value);
                await partyState.set({sound});
              } }
            ></sc-select>

<!--
            <select
              @change=${ async (event) => {
                const sound = JSON.parse(event.target.value);
                await partyState.set({sound});
              } }
            >
              ${sounds.map( (s) => html`
                <option
                  .value=${JSON.stringify(s)}
                  ?selected=${sound && sound.url === s.url}
                >${s.name}</option>
               `) }
            </select>
 -->

            <sc-transport
              .buttons=${['stop', 'play']}
              .value=${transport}
              @change=${ async (event) => {
                const transport = event.detail.value;
                await partyState.set({transport});
              } }
            ></sc-transport>

            <sc-loop
              .active=${loop}
              @change=${ async (event) => {
                const loop = event.detail.value;
                await partyState.set({loop});
              } }
            ></sc-loop>
          </p>
        </section>
      </div>
    `, $container);
  }

  // renderApp();
  const initialValues = await partyState.getValues();
  await partyStateUpdate({
    ...initialValues,
    transport: 'stop', // wait for the next action to start with others
  });
}

launcher.execute(main, {
  numClients: parseInt(new URLSearchParams(window.location.search).get('emulate')) || 1,
  width: '50%',
});
