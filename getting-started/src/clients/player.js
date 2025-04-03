import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import { loadConfig, launcher } from '@soundworks/helpers/browser.js';
import { html, render } from 'lit';

// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

async function main($container) {
  const config = loadConfig();
  const client = new Client(config);

  // Eventually register plugins
  // client.pluginManager.register('my-plugin', plugin);

  // cf. https://soundworks.dev/tools/helpers.html#browserlauncher
  launcher.register(client, { initScreensContainer: $container });

  await client.start();

  const global = await client.stateManager.attach('global');
  console.log('global shared state', global.getValues());

  global.onUpdate(updates => {
    if (updates.trigger === true) {
      $container.style.backgroundColor = 'white';

      setTimeout(() => {
        $container.style.backgroundColor = 'black';
      }, 50);
    }
  });

  $container.addEventListener('click', () => {  // [!code ++]
    global.set({ trigger: true }); // [!code ++]
  }); // [!code ++]

  function renderApp() {
    render(html`
      <div class="simple-layout">
        <p>Click here</p>

        <sw-credits .infos="${client.config.app}"></sw-credits>
      </div>
    `, $container);
  }

  renderApp();
}

// The launcher allows to launch multiple clients in the same browser window
// e.g. `http://127.0.0.1:8000?emulate=10` to run 10 clients side-by-side
launcher.execute(main, {
  numClients: parseInt(new URLSearchParams(window.location.search).get('emulate') || '') || 1,
});
