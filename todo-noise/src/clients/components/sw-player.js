import { LitElement, html, css } from 'lit';
import { live } from 'lit/directives/live.js';

// import needed GUI components
import '@ircam/simple-components/sc-text.js';
import '@ircam/simple-components/sc-slider.js';
import '@ircam/simple-components/sc-toggle.js';
import '@ircam/simple-components/sc-bang.js';

class SwPlayer extends LitElement {
  constructor() {
    super();
    // stores the `player` state
    this.playerState = null;
    // stores the `unsubscribe` callback returned by the `state.onUpdate` methos
    // https://soundworks.dev/soundworks/client.SharedState.html#onUpdate
    this._unobserve = null;
  }

  connectedCallback() {
    super.connectedCallback();
    // update the component when a state change occurs
    this._unobserve = this.playerState.onUpdate(() => this.requestUpdate());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // stop reacting to state change when the element is removed from the DOM
    this._unobserve();
  }

  render() {
    // create controls for the player state
    return html`
      <h2>Player [id: ${this.playerState.get('id')}]</h2>
      <div style="padding-bottom: 4px;">
        <sc-text value="Frequency" readonly></sc-text>
        <sc-slider
          width="400"
          min=${this.playerState.getSchema('frequency').min}
          max=${this.playerState.getSchema('frequency').max}
          value=${this.playerState.get('frequency')}
          @input=${e => this.playerState.set({ frequency: e.detail.value })}
        ></sc-slider>
      </div>
      <div style="padding-bottom: 4px;">
        <sc-text value="Start / Stop synth" readonly></sc-text>
        <sc-toggle
          ?active=${this.playerState.get('synthStartStop')}
          @change=${e => this.playerState.set({ synthStartStop: e.detail.value })}
        ></sc-toggle>
      </div>
      <div style="padding-bottom: 4px;">
        <sc-text value="Trigger Synth" readonly></sc-text>
        <sc-bang
          ?active=${live(this.playerState.get('synthTrigger'))}
          @input=${e => this.playerState.set({ synthTrigger: e.detail.value })}
        ></sc-bang>
      </div>
    `;
  }
}

// register the component into the custom elements registry
customElements.define('sw-player', SwPlayer);
