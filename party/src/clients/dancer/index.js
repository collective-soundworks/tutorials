import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import pluginPlatformInit from '@soundworks/plugin-platform-init/client.js';
import pluginSync from '@soundworks/plugin-sync/client.js';
import { loadConfig, launcher } from '@soundworks/helpers/browser.js';
import { html, render } from 'lit';
import '@ircam/sc-components/sc-select.js';
import '@ircam/sc-components/sc-transport.js';
import '@ircam/sc-components/sc-loop.js';

import '../components/sw-audit.js';

import { schemaName as playingSchemaName } from '../../server/schemas/partySchema.js';
import { Audio, Analysis } from '../shared/audio.js';

// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`
async function main($container) {

  const audioContext = new AudioContext();

  /**
   * Load configuration from config files and create the soundworks client
   */
  const config = loadConfig();
  const client = new Client(config);

  client.pluginManager.register('platformInit', pluginPlatformInit, {
    audioContext,
   });

  client.pluginManager.register('sync', pluginSync, {
    getTimeFunction: () => audioContext.currentTime,
  }, ['platformInit']);

  launcher.register(client, {
    initScreensContainer: $container,
    reloadOnVisibilityChange: false,
  });

  await client.start();

  const sync = await client.pluginManager.get('sync');
  const audio = new Audio({
    context: audioContext,
    sync,
  });

  const analysis = new Analysis({
    audioContext,
    gain: 0,
    analyser: {
      fftSize: 128,
      minDecibels: -120,
      maxDecibels: -20,
      smoothingTimeConstant: 0.2,
    },
    sources: [ audio.output ],
    minFrequency: 50,
    maxFrequency: 8000,
  })

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

  partyState.onUpdate( async (updates) => await partyStateUpdate(updates));


  function renderApp() {
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
              .options=${soundCollection.reduce( (o, s) => {
                Object.assign(o, {[s.name]: JSON.stringify(s)});
                return o;
              }, {} ) }
              .value=${JSON.stringify(sound)}
              @change=${ async (event) => {
                await partyState.set({transport: 'stop'});
                const sound = JSON.parse(event.detail.value);
                await partyState.set({
                  sound,
                  transport, // resume
                });
              } }
            ></sc-select>

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

  const initialValues = await partyState.getValues();
  await partyStateUpdate(initialValues);

  setInterval(() => {
    const amplitude = analysis.getAmplitude();
    const $body = document.querySelector('body');
    $body.style.backgroundColor = `rgba(255, 255, 255, ${amplitude})`;
  }, 50);
}

launcher.execute(main, {
  numClients: parseInt(new URLSearchParams(window.location.search).get('emulate')) || 1,
  width: '50%',
});
