import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import launcher from '@soundworks/helpers/launcher.js';

import { html, render } from 'lit';
import '@ircam/sc-components/sc-number.js';
import '@ircam/sc-components/sc-slider.js';
import '@ircam/sc-components/sc-text.js';
import '@ircam/sc-components/sc-toggle.js';

import '../components/sw-audit.js';

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

  await client.start();

  const global = await client.stateManager.attach('global');
  const players = await client.stateManager.getCollection('player');

  function renderApp() {
    render(html`
      <div class="controller-layout">
        <header>
          <h1>${client.config.app.name} | ${client.role}</h1>
          <sw-audit .client="${client}"></sw-audit>
        </header>
        <section>
          <div>
            <h2>Global</h2>
            <div style="padding-bottom: 4px;">
              <sc-text readonly value="volume (dB)"></sc-text>
              <sc-slider
                min="-60"
                max="6"
                value=${global.get('volume')}
                @input=${e => global.set({ volume: e.detail.value })}
              ></sc-slider>
            </div>
            <div style="padding-bottom: 4px;">
              <sc-text readonly value="mute"></sc-text>
              <sc-toggle
                ?active=${global.get('mute')}
                @change=${e => global.set({ mute: e.detail.value })}
              ></sc-toggle>
            </div>
          </div>
          <div>
            <h2>Players</h2>
            ${players.map(player => {
              return html`
                <div>
                  <sc-text>player: ${player.get('id')} - frequency</sc-text>
                  <sc-number
                    min="50"
                    max="1000"
                    value=${player.get('frequency')}
                    @input=${e => player.set({ frequency: e.detail.value })}
                  ></sc-number>
                </div>
              `
            })}
          </div>
        </section>
      </div>
    `, $container);
  }

  // update interface when the shared state values are updated
  global.onUpdate(() => renderApp());
  players.onAttach(() => renderApp());
  players.onDetach(() => renderApp());
  players.onUpdate(() => renderApp());

  renderApp();
}

launcher.execute(main, {
  numClients: parseInt(new URLSearchParams(window.location.search).get('emulate')) || 1,
  width: '50%',
});
