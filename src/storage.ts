import type { AppState } from './types';

const STORAGE_KEY = 'seitokai_timecard_v1';

export const loadState = (): AppState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed && Array.isArray(parsed.members) && Array.isArray(parsed.records)) {
        return {
          members: parsed.members,
          records: parsed.records,
          nextId: typeof parsed.nextId === 'number' ? parsed.nextId : 1,
        };
      }
    }
  } catch {
    // ignore corrupt state and fall through
  }
  return { members: [], records: [], nextId: 1 };
};

export const saveState = (state: AppState): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};
