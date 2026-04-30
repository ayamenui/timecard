import { createServer } from 'node:http';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', 'data');
const DATA_FILE = resolve(DATA_DIR, 'data.json');
const TMP_FILE = resolve(DATA_DIR, 'data.json.tmp');

const DEFAULT_STATE = { members: [], records: [], nextId: 1 };

const PORT = Number(process.env.PORT) || 3001;

await mkdir(DATA_DIR, { recursive: true });

let writeQueue = Promise.resolve();

const readState = async () => {
  try {
    const raw = await readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.members) || !Array.isArray(parsed.records)) {
      return DEFAULT_STATE;
    }
    return parsed;
  } catch (err) {
    if (err.code === 'ENOENT') return DEFAULT_STATE;
    throw err;
  }
};

const writeStateAtomic = (state) => {
  writeQueue = writeQueue.then(async () => {
    const json = JSON.stringify(state, null, 2);
    await writeFile(TMP_FILE, json, 'utf8');
    await rename(TMP_FILE, DATA_FILE);
  });
  return writeQueue;
};

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

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.url === '/api/state') {
    try {
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
        await writeStateAtomic(parsed);
        sendJSON(res, 200, { ok: true });
        return;
      }
      sendJSON(res, 405, { error: 'Method not allowed' });
      return;
    } catch (err) {
      console.error('[api]', err);
      sendJSON(res, 500, { error: err.message || 'Internal error' });
      return;
    }
  }

  sendJSON(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`[server] storage API listening on http://localhost:${PORT}`);
  console.log(`[server] data file: ${DATA_FILE}`);
});
