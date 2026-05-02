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

test('Vercel serverless handler converts async route failures to JSON errors', async () => {
  const response = mockResponse();

  await handler({
    method: 'POST',
    url: '/api/diagnose',
    headers: { host: 'sitefit.test' },
    [Symbol.asyncIterator]: async function* () {
      yield Buffer.from('{siteUrl:https://example.com}');
    }
  }, response);

  assert.equal(response.statusCode, 500);
  assert.equal(response.headers['content-type'], 'application/json; charset=utf-8');
  assert.equal(JSON.parse(response.body).error, 'internal_error');
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
