import { LitElement, html } from 'lit';
import '@ircam/sc-components'

class SwPlayer extends LitElement {
  constructor() {
    super();
    // reference to the `player` state
    this.player = null;
    // to store the delete callback returned by the `state.onUpdate` method
    // https://soundworks.dev/soundworks/SharedState.html#onUpdate
    this.clearOnUpdate = null;
  }

  connectedCallback() {
    super.connectedCallback();
    // update the component when a state change occurs
    this.clearOnUpdate = this.player.onUpdate(() => this.requestUpdate());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // stop reacting to state change when the element is removed from the DOM
    this.clearOnUpdate();
  }

  render() {
    // create controls for the player state
    return html`
      <h2>Player [id: ${this.player.get('id')}]</h2>
      <div style="padding-bottom: 4px;">
        <sc-text>Frequency</sc-text>
        <sc-slider
          width="400"
          number-box
          min=${this.player.getDescription('frequency').min}
          max=${this.player.getDescription('frequency').max}
          value=${this.player.get('frequency')}
          @input=${e => this.player.set({ frequency: e.detail.value })}
        ></sc-slider>
      </div>
      <div style="padding-bottom: 4px;">
        <sc-text>Toggle Synth</sc-text>
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
