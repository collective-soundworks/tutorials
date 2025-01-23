import { AudioBufferLoader } from '@ircam/sc-loader';

export class Audio {
  constructor({
    context = new AudioContext(),
    loader = new AudioBufferLoader(context),
    loop = false,
  } = {}) {
    Object.assign(this, {
      context,
      loader,
      loop,
    });
    this.buffer = null;
    this.source = null;
  }

  sourceTry(source, method, ...args) {
    if (!source) {
      return;
    }
    try {
      return source[method](args);
    } catch(error) {
      console.error(error.message, error);
    }
  }

  async soundLoad(url) {
    try {
      this.buffer = await this.loader.load(url);
      return this.buffer;
    } catch (error) {
      console.error(`Unable to load sound ${url}:`, error.message, error);
    }
  }

  soundStart() {
    this.sourceTry(this.source, 'stop');
    if(! this.buffer) {
      console.warning('no sound buffer');
      return;
    }
    this.source = this.context.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.loop = this.loop;
    this.source.connect(this.context.destination);
    this.source.start();
  }

  soundStop() {
    this.sourceTry(this.source, 'stop');
  }

  loopSet(loop) {
    Object.assign(this, {loop});
    if (this.source) {
      this.source.loop = loop;
    }
  }

}
