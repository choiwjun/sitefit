import test from 'node:test';
import assert from 'node:assert/strict';

import handler from '../api/index.js';

test('Vercel serverless handler awaits shared request handler responses', async () => {
  const response = mockResponse();

  await handler({
    method: 'GET',
    url: '/health',
    headers: { host: 'sitefit.test' },
    [Symbol.asyncIterator]: async function* () {}
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers['content-type'], 'application/json; charset=utf-8');
  assert.equal(JSON.parse(response.body).ok, true);
});

function mockResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers;
    },
    end(body = '') {
      this.body = body;
    }
  };
}
