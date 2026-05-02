import { createServer } from '../src/server.js';

let server;

export default function handler(request, response) {
  if (!server) {
    server = createServer({ nodeEnv: process.env.NODE_ENV || 'production' });
  }
  server.emit('request', request, response);
}
