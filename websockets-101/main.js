import { html, render } from 'https://unpkg.com/lit-html';
import 'https://unpkg.com/@ircam/sc-components@latest';

import resumeAudioContext from './lib/resume-audio-context.js';
import loadAudioBuffer from './lib/load-audio-buffer.js';

// create a WebSocket to the server
const url = window.location.origin.replace('http', 'ws');
const socket = new WebSocket(url);

socket.addEventListener('open', () => {
  console.log('socket connected');
});

socket.addEventListener('error', err => console.log(err.message));
socket.addEventListener('close', () => console.log('socket closed'));

socket.addEventListener('message', event => {
  console.log(event.data);
});

const audioContext = new AudioContext();
await resumeAudioContext(audioContext);

const buffer = await loadAudioBuffer('./assets/sample.wav', audioContext.sampleRate);

socket.addEventListener('message', event => {
  const src = audioContext.createBufferSource();
  src.buffer = buffer;
  src.connect(audioContext.destination);
  src.start();
});

render(html`
  <h1>websockets-101</h1>
  <sc-bang
    @input=${e => socket.send('trigger-input')}
  ></sc-bang>
`, document.body);
