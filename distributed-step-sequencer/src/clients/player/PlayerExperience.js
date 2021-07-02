import { AbstractExperience } from '@soundworks/core/client';
import { render, html } from 'lit-html';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';
import { Scheduler } from 'waves-masters';

import '@ircam/simple-components/sc-bang.js';
import '@ircam/simple-components/sc-matrix.js';

class StepEngine {
  constructor(experience) {
    this.audioContext = experience.audioContext;
    this.buffers = experience.buffers;
    this.globals = experience.globals;
    this.checkin = experience.checkin;

    this.period = 60 / this.globals.get('BPM');
    this.numSteps = this.globals.get('numSteps');
    this.step = 0;

    this.$beat = experience.$container.querySelector('.beat');
    this.output = this.audioContext.createGain();
  }

  connect(dest) {
    this.output.connect(dest);
  }

  disconnect(dest) {
    this.output.disconnect(dest);
  }

  advanceTime(currentTime, audioTime, dt) {
    const score = this.globals.get('score');
    const index = this.checkin.get('index');

    // define if the client should play at the given step
    const modIndex = this.checkin.get('index') % this.globals.get('numPlayers');
    const modStep = this.step % this.globals.get('numPlayers');
    const shouldPlay = modStep === modIndex;

    if (shouldPlay) {
      score.forEach((track, trackIndex) => {
        const step = track[this.step];

        if (step !== 0) {
          const buffer = this.buffers[trackIndex];
          const src = this.audioContext.createBufferSource();
          src.buffer = buffer;
          src.connect(this.output);
          src.start(audioTime);
        }
      });

      setTimeout(() => this.$beat.active = true, dt * 1000);
    }

    // update step
    this.step = (this.step + 1) % this.numSteps;

    return currentTime + this.period;
  }
}

class PlayerExperience extends AbstractExperience {
  constructor(client, config, $container, audioContext) {
    super(client);

    this.config = config;
    this.$container = $container;
    this.audioContext = audioContext;
    this.rafId = null;

    // require plugins if needed
    this.sync = this.require('sync');
    this.platform = this.require('platform');
    this.audioBufferLoader = this.require('audio-buffer-loader');
    this.checkin = this.require('checkin');

    renderInitializationScreens(client, config, $container);
  }

  async start() {
    super.start();

    console.log(this.checkin.get('index'));

    this.globals = await this.client.stateManager.attach('globals');
    this.globals.subscribe(updates => {
      if ('started' in updates) {
        this.toggleEngine(updates.started);
      }

      if ('volume' in updates && this.volume) {
        this.volume.gain.setTargetAtTime(updates.volume, this.audioContext.currentTime, 0.005);
      }

      this.render();
    });

    const soundfiles = [
      'audio/909-HH-closed.wav',
      'audio/909-SD-low.wav',
      'audio/909-PC-clap.wav',
      'audio/909-PC-rimshot.wav',
      'audio/909-HT-low.wav',
      'audio/909-LT-low.wav',
      'audio/909-MT-low.wav',
      'audio/909-BD-low.wav',
    ];

    this.buffers = await this.audioBufferLoader.load(soundfiles);

    this.render();

    // 1. create a synchronized scheduler able to schedule audio events
    const getTimeFunction = () => this.sync.getSyncTime();
    this.scheduler = new Scheduler(getTimeFunction, {
      currentTimeToAudioTimeFunction: currentTime => this.sync.getLocalTime(currentTime),
    });

    // testing
    this.volume = this.audioContext.createGain();
    this.volume.connect(this.audioContext.destination);
    this.volume.gain.setTargetAtTime(this.globals.get('volume'), this.audioContext.currentTime, 0.005);

    this.engine = new StepEngine(this);
    this.engine.connect(this.volume);

    // // first approximation, e.g. no start / stop button
    // // synchronize all sequencers according time origin
    // const { BPM, numSteps } = this.globals.getValues();
    // const now = this.sync.getSyncTime();
    // const period = 60 / BPM;
    // const syncStartTime = Math.ceil(now / period) * period;
    // const startStep = Math.ceil(now / period) % numSteps;

    // this.engine.step = startStep;
    // this.scheduler.add(this.engine, syncStartTime);

    // if the client connects later
    this.toggleEngine(this.globals.get('started'));

    window.addEventListener('resize', () => this.render());
    this.render();
  }

  toggleEngine(start) {
    if (start) {
      const { startTime, BPM, numSteps } = this.globals.getValues();
      const now = this.sync.getSyncTime();
      // depends on start / stop
      // synchronize all sequencers according time origin
      const period = 60 / BPM;
      const timeSinceStart = now - startTime;
      const syncStartTime = startTime + Math.ceil(timeSinceStart / period) * period;
      const startStep = Math.ceil(timeSinceStart / period) % numSteps;

      this.engine.step = startStep;
      this.scheduler.add(this.engine, syncStartTime);
    } else {
      if (this.scheduler.has(this.engine)) {
        this.scheduler.remove(this.engine);
      }
    }
  }

  render() {
    render(html`
      <div style="padding: 20px">
        <h1 style="margin: 20px 0">${this.client.type} [id: ${this.client.id}, index: ${this.checkin.get('index')}]</h1>
        <p>numPlayers: ${this.globals.get('numPlayers')}</p>
        <sc-bang class="beat"></sc-bang>
        <sc-matrix
          width="260"
          .value="${this.globals.get('score')}"
          @change="${e => this.globals.set({ score: e.detail.value })}"
        ></sc-matrix>
      </div>
    `, this.$container);
  }
}

export default PlayerExperience;
