import 'dotenv/config';
import { createServer } from 'node:http';
import { ensureSheets, readState, writeState } from './sheets.js';

const PORT = Number(process.env.PORT) || 3001;

let writeQueue = Promise.resolve();
let lastError = null;

const sendJSON = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
};

const readBody = (req) =>
  new Promise((resolveBody, rejectBody) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > 5 * 1024 * 1024) {
        rejectBody(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolveBody(Buffer.concat(chunks).toString('utf8')));
    req.on('error', rejectBody);
  });

const queueWrite = (state) => {
  writeQueue = writeQueue.then(() => writeState(state));
  return writeQueue;
};

const handleRequest = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.url === '/api/state') {
    if (req.method === 'GET') {
      const state = await readState();
      sendJSON(res, 200, state);
      return;
    }
    if (req.method === 'PUT') {
      const body = await readBody(req);
      const parsed = JSON.parse(body);
      if (!parsed || !Array.isArray(parsed.members) || !Array.isArray(parsed.records)) {
        sendJSON(res, 400, { error: 'Invalid state shape' });
        return;
      }
      await queueWrite(parsed);
      sendJSON(res, 200, { ok: true });
      return;
    }
    sendJSON(res, 405, { error: 'Method not allowed' });
    return;
  }

  if (req.url === '/api/health') {
    sendJSON(res, 200, { ok: lastError === null, error: lastError });
    return;
  }

  sendJSON(res, 404, { error: 'Not found' });
};

const server = createServer((req, res) => {
  handleRequest(req, res).catch((err) => {
    console.error('[api]', err);
    lastError = err.message || String(err);
    sendJSON(res, 500, { error: lastError });
  });
});

const start = async () => {
  try {
    await ensureSheets();
    console.log('[server] Google Sheets connected');
  } catch (err) {
    console.error('[server] Failed to initialize Sheets:', err.message);
    console.error('[server] Server will start, but API calls will fail until configured.');
    lastError = err.message;
  }
  server.listen(PORT, () => {
    console.log(`[server] storage API listening on http://localhost:${PORT}`);
  });
};

start();
