import { google } from 'googleapis';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const MEMBERS_SHEET = 'メンバー';
const RECORDS_SHEET = '打刻記録';

const MEMBER_HEADERS = [
  'id',
  'name',
  'furigana',
  'grade',
  'classroom',
  'role',
  'bureau',
  'department',
];

const RECORD_HEADERS = ['id', 'memberId', 'inAt', 'outAt', 'autoClosed'];

let cachedClient = null;
let cachedSheetId = null;

const getCredentialsPath = () => {
  const envPath = process.env.GOOGLE_CREDENTIALS_PATH;
  if (envPath) {
    return resolve(__dirname, '..', envPath);
  }
  return resolve(__dirname, 'credentials.json');
};

export const getSheetId = () => {
  const id = process.env.GOOGLE_SHEET_ID;
  if (!id) {
    throw new Error('GOOGLE_SHEET_ID is not set in .env');
  }
  return id;
};

const getClient = async () => {
  if (cachedClient) return cachedClient;
  const credentialsPath = getCredentialsPath();
  let raw;
  try {
    raw = await readFile(credentialsPath, 'utf8');
  } catch (err) {
    throw new Error(
      `Service account credentials not found at ${credentialsPath}. ` +
        `See SETUP.md for instructions. (${err.message})`
    );
  }
  const credentials = JSON.parse(raw);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const authClient = await auth.getClient();
  cachedClient = google.sheets({ version: 'v4', auth: authClient });
  return cachedClient;
};

const getSheetTitles = async (sheets, spreadsheetId) => {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  return (meta.data.sheets || []).map((s) => s.properties?.title).filter(Boolean);
};

export const ensureSheets = async () => {
  const sheets = await getClient();
  const spreadsheetId = getSheetId();
  cachedSheetId = spreadsheetId;
  const titles = await getSheetTitles(sheets, spreadsheetId);
  const requests = [];
  if (!titles.includes(MEMBERS_SHEET)) {
    requests.push({ addSheet: { properties: { title: MEMBERS_SHEET } } });
  }
  if (!titles.includes(RECORDS_SHEET)) {
    requests.push({ addSheet: { properties: { title: RECORDS_SHEET } } });
  }
  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests },
    });
  }
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'RAW',
      data: [
        {
          range: `${MEMBERS_SHEET}!A1:H1`,
          values: [MEMBER_HEADERS],
        },
        {
          range: `${RECORDS_SHEET}!A1:E1`,
          values: [RECORD_HEADERS],
        },
      ],
    },
  });
};

const parseInt10 = (v) => {
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
};

const parseTimestamp = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
};

const parseBool = (v) => {
  if (v === true) return true;
  const s = String(v ?? '').toUpperCase();
  return s === 'TRUE' || s === '1';
};

const rowToMember = (row) => {
  const id = parseInt10(row[0]);
  const name = row[1];
  if (id === null || !name) return null;
  return {
    id,
    name: String(name),
    furigana: row[2] ? String(row[2]) : undefined,
    grade: row[3] ? String(row[3]) : undefined,
    classroom: row[4] ? String(row[4]) : undefined,
    role: row[5] ? String(row[5]) : '役員',
    bureau: row[6] ? String(row[6]) : undefined,
    department: row[7] ? String(row[7]) : undefined,
  };
};

const rowToRecord = (row) => {
  const id = parseInt10(row[0]);
  const memberId = parseInt10(row[1]);
  const inAt = parseTimestamp(row[2]);
  if (id === null || memberId === null || inAt === null) return null;
  const outAt = parseTimestamp(row[3]);
  const autoClosed = parseBool(row[4]);
  const record = { id, memberId, inAt, outAt };
  if (autoClosed) record.autoClosed = true;
  return record;
};

const memberToRow = (m) => [
  m.id,
  m.name ?? '',
  m.furigana ?? '',
  m.grade ?? '',
  m.classroom ?? '',
  m.role ?? '',
  m.bureau ?? '',
  m.department ?? '',
];

const recordToRow = (r) => [
  r.id,
  r.memberId,
  r.inAt,
  r.outAt ?? '',
  r.autoClosed ? 'TRUE' : '',
];

export const readState = async () => {
  const sheets = await getClient();
  const spreadsheetId = getSheetId();
  const res = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: [`${MEMBERS_SHEET}!A2:H`, `${RECORDS_SHEET}!A2:E`],
  });
  const memberRows = res.data.valueRanges?.[0]?.values ?? [];
  const recordRows = res.data.valueRanges?.[1]?.values ?? [];
  const members = memberRows.map(rowToMember).filter(Boolean);
  const records = recordRows.map(rowToRecord).filter(Boolean);
  const maxId = Math.max(
    0,
    ...members.map((m) => m.id),
    ...records.map((r) => r.id)
  );
  return { members, records, nextId: maxId + 1 };
};

export const writeState = async (state) => {
  const sheets = await getClient();
  const spreadsheetId = getSheetId();
  const memberRows = state.members.map(memberToRow);
  const recordRows = state.records.map(recordToRow);
  await sheets.spreadsheets.values.batchClear({
    spreadsheetId,
    requestBody: { ranges: [`${MEMBERS_SHEET}!A2:H`, `${RECORDS_SHEET}!A2:E`] },
  });
  const data = [];
  if (memberRows.length > 0) {
    data.push({ range: `${MEMBERS_SHEET}!A2`, values: memberRows });
  }
  if (recordRows.length > 0) {
    data.push({ range: `${RECORDS_SHEET}!A2`, values: recordRows });
  }
  if (data.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: { valueInputOption: 'RAW', data },
    });
  }
};
