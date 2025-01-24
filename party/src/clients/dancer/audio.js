import { AudioBufferLoader } from '@ircam/sc-loader';

export class Audio {
  constructor({
    context = new AudioContext(),
    sync,
    loader = new AudioBufferLoader(context),
    loop = false,
  } = {}) {
    Object.assign(this, {
      context,
      sync,
      loader,
      loop,
    });
    this.url = null;
    this.buffer = null;
    this.source = null;
  }

  // depends on platform, may change over time
  latencyGet() {
    let latencyBase = 0;
    if (typeof this.context.baseLatency !== 'undefined') {
      latencyBase += this.context.baseLatency;
    }
    if (typeof this.context.outputLatency !== 'undefined') {
      latencyBase += this.context.outputLatency;
    }
    return latencyBase;
  }

  sourceTry(source, method, ...args) {
    if (!source) {
      return;
    }
    try {
      return source[method](...args);
    } catch (error) {
      console.error(error.message, error);
    }
  }

  async soundLoad(url) {
    this.url = url;
    this.soundStop({ time: 0 });

    try {
      this.buffer = await this.loader.load(this.url);
      return this.buffer;
    } catch (error) {
      console.error(`Unable to load sound ${this.url}:`, error.message, error);
    }
  }

  soundStart({
    time = this.sync.getSyncTime(),
  } = {}) {
    const now = this.sync.getSyncTime();

    this.soundStop({ time: 0 });
    if (!this.buffer) {
      console.error('no audio buffer to play');
      return;
    }

    this.source = this.context.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.loop = this.loop;
    this.source.connect(this.context.destination);

    // compensate latency
    let startTime = time - this.latencyGet();
    let startOffset = 0;
    const late = startTime - now;

    // already started
    if (startTime > 0 && late < 0) {
      startOffset = -late;
      startTime = now;
    }

    // already reached the end
    if (startOffset > this.source.buffer.duration) {
      if (!this.loop) {
        return;
      }
      startOffset = startOffset % this.source.buffer.duration;
    }

    try {
      this.source.start(this.sync.getLocalTime(startTime), startOffset);
    } catch (error) {
      console.error('Error while starting sound ${this.url}:', error.message, error);
    }
  }

  soundStop({
    time = this.sync.getSyncTime(),
  } = {}) {
    if(!this.source) {
      console.error('no audio source to stop');
      return;
    }
    const now = this.sync.getSyncTime();

    // compensate latency
    let stopTime = time - this.latencyGet();

    const late = stopTime - now;
    // already stopped
    if (late < 0) {
      stopTime = now;
    }

    try {
      this.source.stop(this.sync.getLocalTime(stopTime));
    } catch (error) {
      // do not report error (mostly when sound was not already started)
    }
  }

  loopSet(loop) {
    this.loop = loop;
    if (this.source) {
      this.source.loop = loop;
    }
  }

}
