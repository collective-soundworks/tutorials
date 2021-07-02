import { AbstractExperience } from '@soundworks/core/server';

class ControllerExperience extends AbstractExperience {
  constructor(server, clientTypes, options = {}) {
    super(server, clientTypes);

    this.sync = this.require('sync');
  }

  start() {
    super.start();
  }

  enter(client) {
    super.enter(client);
  }

  exit(client) {
    super.exit(client);
  }
}

export default ControllerExperience;
