import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import { loadConfig, launcher } from '@soundworks/helpers/browser.js';
import { html, render } from 'lit';

import '@ircam/sc-components/sc-text.js';
import '@ircam/sc-components/sc-slider.js';
import '@ircam/sc-components/sc-toggle.js';
import './components/sw-player.js'; // [!code ++]

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

  const global = await client.stateManager.attach('global');
  const players = await client.stateManager.getCollection('player'); // [!code ++]

  function renderApp() {
    render(html`
      <div class="controller-layout">
        <header>
          <h1>${client.config.app.name} | ${client.role}</h1>
          <sw-audit .client="${client}"></sw-audit>
        </header>
        <section>
          <h1>Global</h1>
          <div style="padding-bottom: 4px">
            <sc-text>master</sc-text>
            <sc-slider
              min=${global.getDescription('master').min}
              max=${global.getDescription('master').max}
              value=${global.get('master')}
              @input=${e => global.set('master', e.detail.value)}
            ></sc-slider>
          </div>
          <div style="padding-bottom: 4px">
            <sc-text>mute</sc-text>
            <sc-toggle
              ?active=${global.get('mute')}
              @change=${e => global.set('mute', e.detail.value)}
            ></sc-toggle>
          </div>

          <h1>Players</h1>
          ${players.map(player => { // [!code ++]
            return html`<sw-player .player=${player}></sw-player>`; // [!code ++]
          })}
        </section>
      </div>
    `, $container);
  }

  global.onUpdate(() => renderApp(), true);
  players.onChange(() => renderApp(), true);
}

launcher.execute(main, {
  numClients: parseInt(new URLSearchParams(window.location.search).get('emulate') || '') || 1,
  width: '50%',
});
