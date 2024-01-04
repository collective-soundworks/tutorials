import http from 'node:http';
import { WebSocketServer } from 'ws';
import serveStatic from 'serve-static';
import finalHandler from 'finalhandler';

// create handler for static files
const staticFileHandler = serveStatic('./', { index: ['index.html'] })
// create the server and use our static file handler to respond to requests
const server = http.createServer((req, res) => {
  staticFileHandler(req, res, finalHandler(req, res))
});
// start the server, listening for request on port 3000
server.listen(3000, () => {
  console.log(`Server started: http://127.0.0.1:3000`);
});

// create the WebSocket server
const wss = new WebSocketServer({ server });

// A store for our socket client instances
let sockets = new Set();
// listen for "connection" event when a new WebSocket is created
wss.on('connection', socket => {
  console.log('- new websocket connection!');
  // add to socket list
  sockets.add(socket);
  // listen for message from the socket
  socket.addEventListener('message', event => {
    console.log('message received', event.data);
    // if the received message is equal to "trigger-input", loop though
    // all the connected sockets to dispatch the "trigger-output" message
    if (event.data === 'trigger-input') {
      sockets.forEach(socket => {
        socket.send('trigger-output');
      });
    }
  });
  // delete socket from the list when it is closed
  socket.addEventListener('close', () => {
    sockets.delete(socket);
  });
});
