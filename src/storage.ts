import type { AppState } from './types';

const API_URL = '/api/state';
const LEGACY_KEY = 'seitokai_timecard_v1';
const MIGRATED_KEY = 'seitokai_timecard_migrated_to_server_v1';

const DEFAULT_STATE: AppState = { members: [], records: [], nextId: 1 };

const isValidState = (value: unknown): value is AppState => {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return Array.isArray(v.members) && Array.isArray(v.records);
};

const readLegacyState = (): AppState | null => {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isValidState(parsed)) return null;
    return {
      members: parsed.members,
      records: parsed.records,
      nextId: typeof parsed.nextId === 'number' ? parsed.nextId : 1,
    };
  } catch {
    return null;
  }
};

export const loadState = async (): Promise<AppState> => {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`Failed to load state: ${res.status}`);
  const serverState = (await res.json()) as AppState;

  if (
    !localStorage.getItem(MIGRATED_KEY) &&
    serverState.members.length === 0 &&
    serverState.records.length === 0
  ) {
    const legacy = readLegacyState();
    if (legacy && (legacy.members.length > 0 || legacy.records.length > 0)) {
      await saveState(legacy);
      localStorage.setItem(MIGRATED_KEY, '1');
      console.info('[storage] migrated localStorage data to server');
      return legacy;
    }
    localStorage.setItem(MIGRATED_KEY, '1');
  }

  return isValidState(serverState) ? serverState : DEFAULT_STATE;
};

export const saveState = async (state: AppState): Promise<void> => {
  const res = await fetch(API_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  });
  if (!res.ok) throw new Error(`Failed to save state: ${res.status}`);
};
