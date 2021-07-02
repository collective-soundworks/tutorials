import { AbstractExperience } from '@soundworks/core/server';

class PlayerExperience extends AbstractExperience {
  constructor(server, clientTypes, options = {}) {
    super(server, clientTypes);

    this.globals = options.globals;

    this.sync = this.require('sync');
    this.platform = this.require('platform');
    this.audioBufferLoader = this.require('audio-buffer-loader');
    this.checkin = this.require('checkin');
  }

  start() {
    super.start();
  }

  enter(client) {
    super.enter(client);

    this.globals.set({ numPlayers: this.clients.size });
  }

  exit(client) {
    super.exit(client);

    this.globals.set({ numPlayers: this.clients.size });
  }
}

export default PlayerExperience;
