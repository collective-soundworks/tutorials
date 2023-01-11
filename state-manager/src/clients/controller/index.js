import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import launcher from '@soundworks/helpers/launcher.js';

import { html } from 'lit';
import '@ircam/simple-components/sc-number.js';
import '@ircam/simple-components/sc-slider.js';
import '@ircam/simple-components/sc-text.js';
import '@ircam/simple-components/sc-toggle.js';

import createLayout from './views/layout.js';

// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

const config = window.SOUNDWORKS_CONFIG;

async function main($container) {
  const client = new Client(config);

  // client.pluginManager.register(pluginName, pluginFactory, {options}, [dependencies])

  launcher.register(client, {
    initScreensContainer: $container,
    reloadOnVisibilityChange: false,
  });

  await client.start();

  const globals = await client.stateManager.attach('globals');

  const players = new Set();

  // observe all states created on the network
  client.stateManager.observe(async (schemaName, stateId) => {
    // we are only interested in player schemas
    if (schemaName === 'player') {
      const player = await client.stateManager.attach(schemaName, stateId);
      // store this state in our local list in relation to the node id
      players.add(player);
      // remove the player from the list when is deleted. The `onDetach` method is
      // automatically called when the remote client disconnects and the state deleted
      player.onDetach(() => {
        players.delete(player);
        // update the view to remove the player from the interface
        $layout.requestUpdate();
      });
      // update the view vhen the state is updated
      player.onUpdate(() => $layout.requestUpdate());
      // update the view to display the new player
      $layout.requestUpdate();
    }
  });

  /* eslint-disable-next-line no-unused-vars */
  const $layout = createLayout(client, $container);

  // update interface when the shared state values are updated
  globals.onUpdate(() => $layout.requestUpdate());

  const globalsComponent = {
    render() {
      return html`
        <div>
          <h2>Globals</h2>
          <div style="padding-bottom: 4px;">
            <sc-text
              readonly
              value="volume (dB)"
            ></sc-text>
            <sc-slider
              min="-60"
              max="6"
              value="${globals.get('volume')}"
              @input=${e => globals.set({ volume: e.detail.value })}
            ></sc-slider>
          </div>
          <div style="padding-bottom: 4px;">
            <sc-text
              readonly
              value="mute"
            ></sc-text>
            <sc-toggle
              ?active="${globals.get('mute')}"
              @change=${e => globals.set({ mute: e.detail.value })}
            ></sc-toggle>
          </div>
        </div>
      `;
    },
  };

  $layout.addComponent(globalsComponent);

  const playersComponent = {
    render() {
      // loop through `players` to create an interface per player state
      return html`
        <h2>Players</h2>
        ${Array.from(players).map(player => {
          return html`
            <div style="padding-bottom: 4px">
              <sc-text value="player: ${player.get('id')} - frequency" readonly></sc-text>
              <sc-number
                min="50"
                max="1000"
                value="${player.get('frequency')}"
                @input="${e => player.set({ frequency: e.detail.value })}"
              ></sc-number>
            </div>
          `;
        })}
      `;
    }
  }

  $layout.addComponent(playersComponent);
}

launcher.execute(main, {
  numClients: parseInt(new URLSearchParams(window.location.search).get('emulate')) || 1,
  width: '50%',
});
