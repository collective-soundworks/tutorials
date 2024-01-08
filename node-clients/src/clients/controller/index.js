import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import launcher from '@soundworks/helpers/launcher.js';

import { html, render } from 'lit';
import '../components/sw-audit.js';

import '@ircam/sc-components/sc-text.js';
import '@ircam/sc-components/sc-button.js';

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

  // create the collection and update the GUI on every collection event
  const thingCollection = await client.stateManager.getCollection('thing');

  thingCollection.onUpdate(() => renderApp());
  thingCollection.onAttach(() => renderApp());
  thingCollection.onDetach(() => renderApp());

  function renderApp() {
    render(html`
      <div class="controller-layout">
        <header>
          <h1>${client.config.app.name} | ${client.role}</h1>
          <sw-audit .client="${client}"></sw-audit>
        </header>
        <section>
          ${thingCollection.map(thing => {
            return html`
              <div>
                <sc-text>${thing.get('id')}</sc-text>
                <sc-button
                  @input=${e => thing.set({ triggerSound: true })}
                >trigger sound</sc-button>
              </div>
            `;
          })}
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
