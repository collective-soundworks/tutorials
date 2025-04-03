import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import { loadConfig, launcher } from '@soundworks/helpers/browser.js';
import { html, render } from 'lit';

import '@ircam/sc-components';

// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

async function main($container) {
  const config = loadConfig();
  const client = new Client(config);

  // cf. https://soundworks.dev/tools/helpers.html#browserlauncher
  launcher.register(client, {
    initScreensContainer: $container,
    reloadOnVisibilityChange: false,
  });

  await client.start();

  const global = await client.stateManager.attach('global'); // [!code ++]
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
              <sc-text readonly>volume (dB)</sc-text>
              <sc-slider
                min="-60"
                max="6"
                value=${global.get('volume')}
                @input=${e => global.set('volume', e.detail.value)}
              ></sc-slider>
            </div>
            <div style="padding-bottom: 4px;">
              <sc-text readonly>mute</sc-text>
              <sc-toggle
                ?active=${global.get('mute')}
                @change=${e => global.set('mute', e.detail.value)}
              ></sc-toggle>
            </div>
          </div>
          <div>
            <h2>Players</h2>
            ${players.map(player => {
              return html`
                <div>
                  <sc-text>player ${player.get('id')} - frequency</sc-text>
                  <sc-number
                    min=${player.getDescription('frequency').min}
                    max=${player.getDescription('frequency').max}
                    value=${player.get('frequency')}
                    @input=${e => player.set('frequency', e.detail.value)}
                  ></sc-number>
                </div>
              `
            })}
          </div>
        </section>
      </div>
    `, $container);
  }

  global.onUpdate(() => renderApp());
  players.onChange(() => renderApp());

  renderApp();
}

launcher.execute(main, {
  numClients: parseInt(new URLSearchParams(window.location.search).get('emulate') || '') || 1,
  width: '50%',
});
