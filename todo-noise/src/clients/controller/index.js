import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import launcher from '@soundworks/helpers/launcher.js';

import { html, render } from 'lit';
import '../components/sw-audit.js';

import '@ircam/sc-components/sc-text.js';
import '@ircam/sc-components/sc-slider.js';
import '@ircam/sc-components/sc-toggle.js';
import '../components/sw-player.js';

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
          <h2>Global</h2>
          <div style="padding-bottom: 4px">
            <sc-text>master</sc-text>
            <sc-slider
              min=${global.getSchema('master').min}
              max=${global.getSchema('master').max}
              value=${global.get('master')}
              @input=${e => global.set({ master: e.detail.value })}
            ></sc-slider>
          </div>
          <div style="padding-bottom: 4px">
            <sc-text>mute</sc-text>
            <sc-toggle
              ?active=${global.get('mute')}
              @change=${e => global.set({ mute: e.detail.value })}
            ></sc-toggle>
          </div>

          ${players.map(player => {
            return html`<sw-player .player=${player}></sw-player>`;
          })}
        </section>
      </div>
    `, $container);
  }

  global.onUpdate(() => renderApp(), true);
  // refresh the screen on each players collection event
  players.onAttach(() => renderApp());
  players.onDetach(() => renderApp());
  players.onUpdate(() => renderApp());
}

launcher.execute(main, {
  numClients: parseInt(new URLSearchParams(window.location.search).get('emulate')) || 1,
  width: '50%',
});
