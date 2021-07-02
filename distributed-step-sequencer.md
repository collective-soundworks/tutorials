# Distributed Step Sequencer Tutorial

> Soundworks tutorial showing how to implement a distributed step sequencer where each client acts as a step of the sequencer.

## Steps

### Review boilerplate code
  + folder structure
  + review configuration / startup sequence
  + review installed plugins
  + launch app and check clients
    * http://127.0.0.1:8000
    * http://127.0.0.1:8000/controller

### Setup synchronized scheduling
- create a synchronized scheduler able to schedule audio events
- create an engine that will trigger audio events
- add a visual feedback for the beat

  + see `src/client/player/PlayerExperience.js`
  + see `src/client/player/index.js`

### Share a common score
- create a global state that host the score and attach every player to the state
- add an interface to control the global score
  + see `src/client/player/PlayerExperience.js`
  + see `src/server/schemas/globals.js`

### Play the score
- load audio files
- play files according to score
  + see `src/client/player/PlayerExperience.js`

### Play a step according to a given index
- install @soundworks/plugin-checkin
- trigger event according to the player index
  + see `src/server/PlayerExperience.js`
  + see `src/server/index.js`
  + see `src/client/player/PlayerExperience.js`
  + see `src/client/player/index.js`

### Control everything
- start / stop button
- master volume
- monitor score
  + see `src/client/player/PlayerExperience.js`
  + see `src/client/controller/ControllerExperience.js`

### More ideas...
- control BPM
- clear score
- add velocities on notes
- control numSteps and numTracks
- pipe the engine into an effect (e.g. feedback delay, reverb)
and control effect on a *per player* basis from the controller

## Plugin used

### platform
https://github.com/collective-soundworks/soundworks-plugin-platform

```
npm install --save @soundworks/plugin-platform
```

### sync
https://github.com/collective-soundworks/soundworks-plugin-sync

```
npm install --save @soundworks/plugin-sync
```

### audio-buffer-loader
https://github.com/collective-soundworks/soundworks-plugin-audio-buffer-loader

```
npm install --save @soundworks/plugin-audio-buffer-loader
```

### checkin
https://github.com/collective-soundworks/soundworks-plugin-checkin

```
npm install --save @soundworks/plugin-checkin
```


## Other libraries

### waves-masters (will be renamed and moved soon)
https://github.com/wavesjs/waves-masters/

```
npm install --save waves-masters
```

### @ircam/simple-components
https://github.com/ircam-ismm/simple-components

```
npm install --save @soundworks/simple -components
```

