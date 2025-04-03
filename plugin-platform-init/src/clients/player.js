import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import { loadConfig, launcher } from '@soundworks/helpers/browser.js';
import { html, render } from 'lit';

import ClientPluginPlatformInit from '@soundworks/plugin-platform-init/client.js';

// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

async function main($container) {
  const config = loadConfig();
  const client = new Client(config);
  const audioContext = new AudioContext();
  // register the plugin into the soundworks' plugin manager
  client.pluginManager.register('platform-init', ClientPluginPlatformInit, { audioContext });

  // cf. https://soundworks.dev/tools/helpers.html#browserlauncher
  launcher.register(client, { initScreensContainer: $container });

  console.log(`> before start - audioContext is "${audioContext.state}"`);
  await client.start();
  console.log(`> after start - audioContext is "${audioContext.state}"`);

  const now = audioContext.currentTime;  // [!code ++]
  // create a simple envelop
  const env = audioContext.createGain(); // [!code ++]
  env.connect(audioContext.destination); // [!code ++]
  env.gain.setValueAtTime(0, now); // [!code ++]
  env.gain.linearRampToValueAtTime(0.5, now + 0.01); // [!code ++]
  env.gain.exponentialRampToValueAtTime(0.0001, now + 4); // [!code ++]

  const src = audioContext.createOscillator(); // [!code ++]
  src.connect(env); // [!code ++]
  // randomly pick a frequency on an harmonic spectrum (150, 300, 450, etc...)
  src.frequency.value = 150 + Math.floor(Math.random() * 10) * 150; // [!code ++]
  src.start(now); // [!code ++]
  src.stop(now + 4); // [!code ++]

  function renderApp() {
    render(html`
      <div class="simple-layout">
        <p>Hello ${client.config.app.name}!</p>

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
