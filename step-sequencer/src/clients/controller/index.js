import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import launcher from '@soundworks/helpers/launcher.js';
import pluginSync from '@soundworks/plugin-sync/client.js';

import { html, render } from 'lit';
import '../components/sw-audit.js';

import '@ircam/sc-components/sc-matrix.js';
import '@ircam/sc-components/sc-text.js';
import '@ircam/sc-components/sc-transport.js';
import '@ircam/sc-components/sc-number.js';

// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

const config = window.SOUNDWORKS_CONFIG;

async function main($container) {
  const client = new Client(config);

  launcher.register(client, {
    initScreensContainer: $container,
    reloadOnVisibilityChange: false,
  });

  client.pluginManager.register('sync', pluginSync);

  await client.start();

  const global = await client.stateManager.attach('global');
  // update screen on update
  global.onUpdate(() => renderApp());

  const sync = await client.pluginManager.get('sync');

  function renderApp() {
    render(html`
      <div class="controller-layout">
        <header>
          <h1>${client.config.app.name} | ${client.role}</h1>
          <sw-audit .client="${client}"></sw-audit>
        </header>
        <section>
          <div>
            <div style="margin-bottom: 4px;">
              <sc-transport
                .buttons=${['play', 'stop']}
                value=${global.get('running') ? 'play' : 'stop'}
                @change=${e => {
                  if (e.detail.value === 'stop') {
                    global.set({ running: false });
                  } else {
                    // grab current sync time
                    const syncTime = sync.getSyncTime();
                    // add an offset to the syncTime to handle network latency
                    const startTime = syncTime + 0.5;
                    // propagate values on the network
                    global.set({ running: true, startTime });
                  }
                }}
              ></sc-transport>
            </div>
            <div style="margin-bottom: 4px;">
              <sc-text>BPM</sc-text>
              <sc-number
                min="50"
                max="240"
                value=${global.get('BPM')}
                ?disabled=${global.get('running')}
                @change=${e => global.set({ BPM: e.detail.value })}
              ></sc-number>
            </div>
            <div style="margin-bottom: 4px;">
              <sc-matrix
                .value=${global.get('score')}
                @change=${e => global.set({ score: e.detail.value })}
              ></sc-matrix>
            </div>
          </div>
        </section>
      </div>
    `, $container);
  }

  renderApp();
}

launcher.execute(main, {
  numClients: parseInt(new URLSearchParams(window.location.search).get('emulate')) || 1,
  width: '50%',
});
