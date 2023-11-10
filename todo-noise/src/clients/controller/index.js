import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import launcher from '@soundworks/helpers/launcher.js';

import createLayout from './views/layout.js';

import { html, nothing } from 'lit';
import { keyed } from 'lit/directives/keyed.js';

import '@ircam/simple-components/sc-text.js';
import '@ircam/simple-components/sc-slider.js';
import '@ircam/simple-components/sc-toggle.js';
import '@ircam/simple-components/sc-button.js';
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

  const globals = await client.stateManager.attach('globals');
  const players = await client.stateManager.getCollection('player');

  const $layout = createLayout(client, $container);

  // add a control component to the layout
  $layout.addComponent({
    render: () => {
      return html`
        <h2>Globals</h2>
        <div style="padding-bottom: 4px">
          <sc-text value="master" readonly></sc-text>
          <sc-slider
            min=${globals.getSchema('master').min}
            max=${globals.getSchema('master').max}
            value=${globals.get('master')}
            width="400"
            @input=${e => globals.set({ master: e.detail.value })}
          ></sc-slider>
        </div>
        <div style="padding-bottom: 4px">
          <sc-text value="mute" readonly></sc-text>
          <sc-toggle
            ?active=${globals.get('mute')}
            @change=${e => globals.set({ mute: e.detail.value })}
          ></sc-toggle>
        </div>
      `;
    }
  });

  // placeholder of the remote controlled player state instance
  let remoteControlledPlayer = null;
  // collection
  $layout.addComponent({
    render: () => {
      return html`
        <h2>Connected players</h2>
        ${players.map(player => {
          return html`
            <sc-button
              value=${player.get('id')}
              @input=${e => {
                remoteControlledPlayer = player;
                $layout.requestUpdate();
              }}
            ></sc-button>
          `;
        })}
        <h2>Remote controlled player</h2>
        ${remoteControlledPlayer !== null
          ? keyed(
              remoteControlledPlayer.get('id'),
              html`<sw-player .playerState=${remoteControlledPlayer}></sw-player>`
            )
          : nothing
        }
      `;
    }
  });

  // update the view when the globals state change
  globals.onUpdate(() => $layout.requestUpdate());

  // if a player connects or disconnect, we want to update the view accordingly
  players.onAttach(() => $layout.requestUpdate());
  players.onDetach(player => {
    // if the player is deleted, we reset the view
    if (player === remoteControlledPlayer) {
      remoteControlledPlayer = null;
    }
    $layout.requestUpdate();
  });
}

launcher.execute(main, {
  numClients: parseInt(new URLSearchParams(window.location.search).get('emulate')) || 1,
  width: '50%',
});
