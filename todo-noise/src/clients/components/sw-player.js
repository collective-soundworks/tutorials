import { LitElement, html, css } from 'lit';

// import needed GUI components
import '@ircam/sc-components/sc-text.js';
import '@ircam/sc-components/sc-slider.js';
import '@ircam/sc-components/sc-toggle.js';
import '@ircam/sc-components/sc-bang.js';

class SwPlayer extends LitElement {
  constructor() {
    super();
    // reference to the `player` state
    this.player = null;
    // stores the `unsubscribe` callback returned by the `state.onUpdate` methos
    // https://soundworks.dev/soundworks/client.SharedState.html#onUpdate
    this._unobserve = null;
  }

  connectedCallback() {
    super.connectedCallback();
    // update the component when a state change occurs
    this._unobserve = this.player.onUpdate(() => this.requestUpdate());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // stop reacting to state change when the element is removed from the DOM
    this._unobserve();
  }

  render() {
    // create controls for the player state
    return html`
      <h2>Player [id: ${this.player.get('id')}]</h2>
      <div style="padding-bottom: 4px;">
        <sc-text>Frequency</sc-text>
        <sc-slider
          width="400"
          min=${this.player.getSchema('frequency').min}
          max=${this.player.getSchema('frequency').max}
          value=${this.player.get('frequency')}
          @input=${e => this.player.set({ frequency: e.detail.value })}
        ></sc-slider>
      </div>
      <div style="padding-bottom: 4px;">
        <sc-text>Start / Stop synth</sc-text>
        <sc-toggle
          ?active=${this.player.get('synthToggle')}
          @change=${e => this.player.set({ synthToggle: e.detail.value })}
        ></sc-toggle>
      </div>
      <div style="padding-bottom: 4px;">
        <sc-text>Trigger Synth</sc-text>
        <sc-bang
          ?active=${this.player.get('synthTrigger')}
          @input=${e => this.player.set({ synthTrigger: e.detail.value })}
        ></sc-bang>
      </div>
    `;
  }
}

// register the component into the custom elements registry
customElements.define('sw-player', SwPlayer);
