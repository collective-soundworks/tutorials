import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import { loadConfig, launcher } from '@soundworks/helpers/browser.js';
import { html, render } from 'lit';
import ClientPluginPlatformInit from '@soundworks/plugin-platform-init/client.js';
import './components/sw-player.js';

// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

const audioContext = new AudioContext();

async function main($container) {
  const config = loadConfig();
  const client = new Client(config);
  const audioContext = new AudioContext();
  // register plugins
  client.pluginManager.register('platform-init', ClientPluginPlatformInit, {
    audioContext,
  });

  // cf. https://soundworks.dev/tools/helpers.html#browserlauncher
  launcher.register(client, { initScreensContainer: $container });

  await client.start();
  const global = await client.stateManager.attach('global');
  const player = await client.stateManager.create('player', { id: client.id });

  // master bus chain
  const mute = new GainNode(audioContext, { gain: global.get('mute') ? 0 : 1 });
  const master = new GainNode(audioContext, { gain: global.get('master') });
  // [mute: GainNode] -> [master: GainNode] -> [destination: AudioDestinationNode]
  mute.connect(master).connect(audioContext.destination);

  function renderApp() {
    render(html`
      <div class="simple-layout">
        <sw-player .player=${player}></sw-player>

        <h1>Global</h1>
        <p>Master: ${global.get('master')}</p>
        <p>Mute: ${global.get('mute')}</p>

        <sw-credits .infos="${client.config.app}"></sw-credits>
      </div>
    `, $container);
  }

  global.onUpdate(updates => {
    for (let key in updates) {
      const value = updates[key];

      switch (key) {
        case 'master': {
          const now = audioContext.currentTime;
          master.gain.setTargetAtTime(value, now, 0.01);
          break;
        }
        case 'mute': {
          const gain = value ? 0 : 1;
          const now = audioContext.currentTime;
          mute.gain.setTargetAtTime(gain, now, 0.01);
          break;
        }
      }
    }
    // update the view to log current global values
    renderApp();
  }, true);

  // this variable holds our current oscillator when it is started
  let synthToggle = null;

  player.onUpdate(updates => {
    for (let key in updates) {
      const value = updates[key];

      switch (key) {
        case 'synthToggle': {
          // If we have a synth running, let's stop it in all case.
          // This pattern prevents any possibilities of having two synths running
          // in parallel... in which case one of them would be impossible to stop
          if (synthToggle !== null) {
            synthToggle.stop();
            synthToggle = null;
          }
          // if the value of the `synthToggle` is true, let's start a new synth
          if (value === true) {
            // start the synth
            synthToggle = new OscillatorNode(audioContext, {
              frequency: player.get('frequency'),
            });
            synthToggle.connect(mute);
            synthToggle.start();
          }
          break;
        }
        case 'frequency': {
          // If we have an oscillator started, apply changes made on the frequency parameter
          if (synthToggle !== null) {
            const now = audioContext.currentTime;
            synthToggle.frequency.setTargetAtTime(value, now, 0.02);
          }
          break;
        }
        case 'synthTrigger': {
          // trigger a sound for 1 second at twice the frequency
          const now = audioContext.currentTime;

          const env = new GainNode(audioContext, { gain: 0 });
          env.connect(mute);
          // schedule the automation for our envelop
          env.gain
            .setValueAtTime(0, now)
            .linearRampToValueAtTime(1, now + 0.01)
            .exponentialRampToValueAtTime(0.001, now + 1);

          const osc = new OscillatorNode(audioContext, {
            frequency: player.get('frequency') * 2,
          });
          osc.connect(env);
          osc.start(now);
          osc.stop(now + 1);
          break;
        }
      }
    }
    // update the view to log current global values
    renderApp();
  }, true);
}

// The launcher allows to launch multiple clients in the same browser window
// e.g. `http://127.0.0.1:8000?emulate=10` to run 10 clients side-by-side
launcher.execute(main, {
  numClients: parseInt(new URLSearchParams(window.location.search).get('emulate') || '') || 1,
});
