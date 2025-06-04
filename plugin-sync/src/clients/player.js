import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import { loadConfig, launcher } from '@soundworks/helpers/browser.js';
import ClientPluginPlatformInit from '@soundworks/plugin-platform-init/client.js';
import ClientPluginSync from '@soundworks/plugin-sync/client.js';
import { html, render } from 'lit';
import '@ircam/sc-components/sc-button.js';

// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

async function main($container) {
  const config = loadConfig();
  const client = new Client(config);
  const audioContext = new AudioContext();

  client.pluginManager.register('platform-init', ClientPluginPlatformInit, {
    audioContext,
  });
  client.pluginManager.register('sync', ClientPluginSync, {
    // use the audio context clock
    getTimeFunction: () => audioContext.currentTime,
    // declare the 'platform-init' plugin as a dependency, so that the
    // sync process starts only when the audio context properly is resumed
  }, ['platform-init']);

  // cf. https://soundworks.dev/tools/helpers.html#browserlauncher
  launcher.register(client, { initScreensContainer: $container });
  await client.start();

  const global = await client.stateManager.attach('global');
  const sync = await client.pluginManager.get('sync');

  global.onUpdate(updates => {
    if ('triggerTime' in updates) {
      // trigger time is in the synchronized timeline
      const syncTime = updates.triggerTime;
      // convert this time to the local audio timeline
      const audioTime = sync.getLocalTime(syncTime);
      // let's now trigger a random frequency at this exact moment
      const frequency = 200 + Math.random() * 400;
      const osc = new OscillatorNode(audioContext, { frequency });
      osc.connect(audioContext.destination);
      osc.start(audioTime);
      osc.stop(audioTime + 0.1);
    }
  });

  function renderApp() {
    render(html`
      <div class="simple-layout">
        <p>localTime: ${sync.getLocalTime()}</p>
        <p>syncTime: ${sync.getSyncTime()}</p>

        <sc-button
          @input=${e => global.set('triggerTime', sync.getSyncTime() + 0.5)}
        >trigger sound</sc-button>

        <sw-credits .infos="${client.config.app}"></sw-credits>
      </div>
    `, $container);

    // refresh the screen at 60 fps
    window.requestAnimationFrame(renderApp);
  }

  renderApp();
}

// The launcher allows to launch multiple clients in the same browser window
// e.g. `http://127.0.0.1:8000?emulate=10` to run 10 clients side-by-side
launcher.execute(main, {
  numClients: parseInt(new URLSearchParams(window.location.search).get('emulate') || '') || 1,
});
