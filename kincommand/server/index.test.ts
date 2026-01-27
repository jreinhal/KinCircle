/** @vitest-environment node */
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import type { Server } from 'http';

let server: Server;
let baseUrl = '';
const apiToken = 'test-token';

const startServer = async () => {
  process.env.GEMINI_API_KEY = 'test-key';
  process.env.KIN_API_TOKEN = apiToken;
  process.env.KIN_ALLOWED_ORIGINS = 'http://localhost:3000';

  const { buildApp } = await import('./index.js');
  const app = buildApp();
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  const address = server.address();
  if (typeof address === 'string' || !address) {
    throw new Error('Failed to bind test server');
  }
  baseUrl = `http://127.0.0.1:${address.port}`;
};

describe('KinCircle API auth + validation', () => {
  beforeAll(async () => {
    await startServer();
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('rejects requests without an API token', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    expect(response.status).toBe(401);
  });

  it('accepts requests with a valid API token', async () => {
    const response = await fetch(`${baseUrl}/api/health`, {
      headers: { 'x-kin-api-key': apiToken }
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ status: 'ok' });
  });

  it('returns 400 for invalid request payloads', async () => {
    const response = await fetch(`${baseUrl}/api/query-ledger`, {
      method: 'POST',
      headers: {
        'x-kin-api-key': apiToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    expect(response.status).toBe(400);
  });
});
