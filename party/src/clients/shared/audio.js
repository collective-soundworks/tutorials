import { AudioBufferLoader } from '@ircam/sc-loader';

export function dBToLin(dBValue) {
  const factor = 1 / 20;
  return Math.pow(10, dBValue * factor);
}

export function linToDB(linValue) {
  const factor = 20;
  return factor * Math.log10(linValue);
}

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
    this.output = this.context.createGain();
    this.output.gain.value = 1;
    this.output.connect(this.context.destination);
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
    this.source.connect(this.output);

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
      // do not report error (mostly when sound was not already started)
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

export class Analysis {
  constructor({
    audioContext,
    gain = 0,
    analyser = {}, // attributes of AnalyserNode
    minFrequency = 0,
    maxFrequency = audioContext.sampleRate / 2,
    sources,
  } = {}) {
    this.masterGain = audioContext.createGain();
    this.masterGain.gain.value = dBToLin(gain);

    this.analyser = audioContext.createAnalyser();
    this.masterGain.connect(this.analyser);

    if (typeof analyser === 'object') {
      Object.assign(this.analyser, analyser);
    }

    this.minBin = (typeof minFrequency !== 'undefined'
      ? Math.max(0,
        Math.min(this.analyser.frequencyBinCount,
          Math.round(minFrequency * this.analyser.fftSize
            / audioContext.sampleRate)))
      : 0);

    this.maxBin = (typeof maxFrequency !== 'undefined'
      ? Math.max(this.minBin,
        Math.min(this.analyser.frequencyBinCount - 1,
          Math.round(maxFrequency * this.analyser.fftSize
            / audioContext.sampleRate)))
      : this.analyser.frequencyBinCount - 1);

    // normalise bin count and byte values of analyser node
    this.normalisation = 1. / (255 * (this.maxBin - this.minBin + 1));

    // pre-allocation
    this.magnitudes = new Uint8Array(this.analyser.frequencyBinCount);

    this.sourcesOld = undefined;
    this.connect({sources});
  }

  connect({
    sources,
  } = {}) {
    this.disconnect();
    this.sources = sources;

    if (typeof this.sources !== 'undefined') {
      for (let s of this.sources) {
        s.connect(this.masterGain);
      }
    }
  }

  disconnect() {
    if (typeof this.sources !== 'undefined') {
      for (let s of this.sources) {
        s.disconnect(this.masterGain);
      }
    }
    this.sourcesOld = this.sources;
    this.sources = undefined;
  }

  reconnect() {
    this.connect({ sources: this.sourcesOld });
  }

  getAmplitude() {
    let amplitude = 0;
    if (typeof this.sources !== 'undefined') {
      this.analyser.getByteFrequencyData(this.magnitudes);

      for (let i = this.minBin; i <= this.maxBin; ++i) {
        amplitude += this.magnitudes[i];
      }
      amplitude *= this.normalisation;
    }

    return amplitude;
  }

}
