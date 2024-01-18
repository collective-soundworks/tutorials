import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import launcher from '@soundworks/helpers/launcher.js';
import pluginSync from '@soundworks/plugin-sync/client.js';
import pluginCheckin from '@soundworks/plugin-checkin/client.js';
import { AudioContext } from 'node-web-audio-api';
import { AudioBufferLoader } from '@ircam/sc-loader';
import { Scheduler } from '@ircam/sc-scheduling';
import { loadConfig } from '../../utils/load-config.js';

// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

async function bootstrap() {
  /**
   * Load configuration from config files and create the soundworks client
   */
  const config = loadConfig(process.env.ENV, import.meta.url);
  const client = new Client(config);

  const audioContext = new AudioContext();

  client.pluginManager.register('checkin', pluginCheckin);
  client.pluginManager.register('sync', pluginSync, {
    getTimeFunction: () => audioContext.currentTime,
  });

  /**
   * Register some soundworks plugins, you will need to install the plugins
   * before hand (run `npx soundworks` for help)
   */
  // client.pluginManager.register('my-plugin', plugin);

  /**
   * Register the soundworks client into the launcher
   *
   * Automatically restarts the process when the socket closes or when an
   * uncaught error occurs in the program.
   */
  launcher.register(client);

  /**
   * Launch application
   */
  await client.start();

  const global = await client.stateManager.attach('global');

  const checkin = await client.pluginManager.get('checkin');
  const sync = await client.pluginManager.get('sync');
  const scheduler = new Scheduler(() => sync.getSyncTime(), {
    // provide the transfert function that will allow the scheduler to map from
    // its current time (the sync time) and the audio time (the sync plugin local time)
    currentTimeToAudioTimeFunction: syncTime => sync.getLocalTime(syncTime),
  });

  const audioFiles = [
    'public/assets/hh.wav',
    'public/assets/clap.wav',
    'public/assets/rimshot.wav',
    'public/assets/snare.wav',
    'public/assets/kick.wav',
  ];

  const loader = new AudioBufferLoader();
  const audioBuffers = await loader.load(audioFiles);

  class StepSequencerEngine {
    constructor(audioContext, score, buffers, BPM, trackIndex) {
      this.audioContext = audioContext;
      this.score = score;
      this.buffers = buffers;
      this.trackIndex = trackIndex;
      this.BPM = BPM;
      this.step = 0;

      this.render = this.render.bind(this);
    }

    render(currentTime, audioTime) {
      const buffer = this.buffers[this.trackIndex];
      const track = this.score[this.trackIndex];
      // define if the engine should play at this step
      const isPlaying = track[this.step] !== 0;

      if (isPlaying) {
        const src = this.audioContext.createBufferSource();
        src.connect(audioContext.destination);
        src.buffer = buffer;
        // schedule audio buffer start time in audio time
        src.start(audioTime);
      }

      // update step for next call
      this.step = (this.step + 1) % track.length;

      // schedule next tick in sync time
      const period = 60 / this.BPM;
      return currentTime + period;
    }
  }

  const trackIndex = checkin.getIndex();
  let engine = null;

  global.onUpdate(updates => {
    if ('running' in updates) {
      const running = updates.running;

      if (running) {
        const { BPM, score, startTime } = global.getValues();
        engine = new StepSequencerEngine(audioContext, score, audioBuffers, BPM, trackIndex);
        scheduler.add(engine.render, startTime);
      } else if (engine) {
        scheduler.remove(engine.render);
      }
    }

    // keep score sychronized
    if ('score' in updates) {
      if (engine !== null) {
        engine.score = updates.score;
      }
    }
  });

  console.log(`Hello ${client.config.app.name}!`);
}

// The launcher allows to fork multiple clients in the same terminal window
// by defining the `EMULATE` env process variable
// e.g. `EMULATE=10 npm run watch-process thing` to run 10 clients side-by-side
launcher.execute(bootstrap, {
  numClients: process.env.EMULATE ? parseInt(process.env.EMULATE) : 1,
  moduleURL: import.meta.url,
});
