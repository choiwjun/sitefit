import { createRequestHandler } from '../src/server.js';

let handleRequest;

export default async function handler(request, response) {
  if (!handleRequest) {
    handleRequest = createRequestHandler({ nodeEnv: process.env.NODE_ENV || 'production' });
  }
  await handleRequest(request, response);
}
