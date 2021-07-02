import { AbstractExperience } from '@soundworks/core/client';
import { render, html } from 'lit-html';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';

import '@ircam/simple-components/sc-text.js';
import '@ircam/simple-components/sc-toggle.js';
import '@ircam/simple-components/sc-slider.js';
import '@ircam/simple-components/sc-matrix.js';

class ControllerExperience extends AbstractExperience {
  constructor(client, config, $container) {
    super(client);

    this.config = config;
    this.$container = $container;
    this.rafId = null;

    this.sync = this.require('sync');
    // require plugins if needed

    renderInitializationScreens(client, config, $container);
  }

  async start() {
    super.start();

    this.globals = await this.client.stateManager.attach('globals');
    this.globals.subscribe(updates => this.render());

    window.addEventListener('resize', () => this.render());
    this.render();
  }

  render() {
    // debounce with requestAnimationFrame
    window.cancelAnimationFrame(this.rafId);

    this.rafId = window.requestAnimationFrame(() => {
      render(html`
        <div style="padding: 20px">
          <h1 style="margin: 20px 0">${this.client.type} [id: ${this.client.id}]</h1>

          <div style="margin-bottom: 4px">
            <sc-text
              value="start / stop"
              readonly
            ></sc-text>
            <sc-toggle
              .value="${this.globals.get('started')}"
              @change="${e => this.globals.set({
                started: e.detail.value,
                startTime: e.detail.value ? this.sync.getSyncTime() + 0.05 : null,
              })}"
            ></sc-toggle>
            <sc-text
              value="${this.globals.get('startTime')}"
              readonly
            ></sc-text>
          </div>
          <div style="margin-bottom: 4px">
            <sc-text
              value="volume"
              readonly
            ></sc-text>
            <sc-slider
              .value="${this.globals.get('volume')}"
              @input="${e => this.globals.set({ volume: e.target.value })}"
            ></sc-slider>
          </div>
          <div style="margin-bottom: 4px">
            <sc-text
              value="score"
              readonly
            ></sc-text>
            <sc-matrix
              .value="${this.globals.get('score')}"
              @change="${e => this.globals.set({ score: e.detail.value })}"
            ></sc-matrix>
          </div>

        </div>
      `, this.$container);
    });
  }
}

export default ControllerExperience;
