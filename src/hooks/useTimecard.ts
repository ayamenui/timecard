import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadState, saveState } from '../storage';
import type { AppState, Member, MemberInput, PunchRecord } from '../types';

export interface UseTimecard {
  members: Member[];
  records: PunchRecord[];
  openRecordOf: (memberId: number) => PunchRecord | undefined;
  addMember: (input: MemberInput) => string | null;
  deleteMember: (id: number) => void;
  clockIn: (memberId: number) => void;
  clockOut: (memberId: number) => void;
  deleteRecord: (id: number) => void;
}

export function useTimecard(): UseTimecard {
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    const closeStaleRecords = () => {
      setState((prev) => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayStartMs = todayStart.getTime();

        const hasStale = prev.records.some(
          (r) => r.outAt === null && r.inAt < todayStartMs
        );
        if (!hasStale) return prev;

        const records = prev.records.map((r) => {
          if (r.outAt !== null || r.inAt >= todayStartMs) return r;
          const endOfDay = new Date(r.inAt);
          endOfDay.setHours(23, 59, 59, 999);
          return { ...r, outAt: endOfDay.getTime(), autoClosed: true };
        });
        return { ...prev, records };
      });
    };

    closeStaleRecords();
    const intervalId = window.setInterval(closeStaleRecords, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const openRecordOf = useCallback(
    (memberId: number) =>
      state.records.find((r) => r.memberId === memberId && r.outAt === null),
    [state.records]
  );

  const addMember = useCallback((input: MemberInput): string | null => {
    const trimmedName = input.name.trim();
    if (!trimmedName) return '名前を入力してください';
    const furigana = input.furigana?.trim() || undefined;
    const grade = input.grade || undefined;
    const classroom = input.classroom?.trim() || undefined;
    const bureau = input.bureau?.trim() || undefined;
    const department = input.department?.trim() || undefined;
    let result: string | null = null;
    setState((prev) => {
      if (prev.members.some((m) => m.name === trimmedName)) {
        result = '同じ名前のメンバーが既に登録されています';
        return prev;
      }
      const member: Member = {
        id: prev.nextId,
        name: trimmedName,
        furigana,
        grade,
        classroom,
        role: input.role,
        bureau,
        department,
      };
      return {
        ...prev,
        members: [...prev.members, member],
        nextId: prev.nextId + 1,
      };
    });
    return result;
  }, []);

  const deleteMember = useCallback((id: number) => {
    setState((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.id !== id),
    }));
  }, []);

  const clockIn = useCallback((memberId: number) => {
    setState((prev) => {
      if (prev.records.some((r) => r.memberId === memberId && r.outAt === null)) {
        return prev;
      }
      const record: PunchRecord = {
        id: prev.nextId,
        memberId,
        inAt: Date.now(),
        outAt: null,
      };
      return {
        ...prev,
        records: [...prev.records, record],
        nextId: prev.nextId + 1,
      };
    });
  }, []);

  const clockOut = useCallback((memberId: number) => {
    setState((prev) => {
      const idx = prev.records.findIndex(
        (r) => r.memberId === memberId && r.outAt === null
      );
      if (idx === -1) return prev;
      const records = prev.records.slice();
      records[idx] = { ...records[idx], outAt: Date.now() };
      return { ...prev, records };
    });
  }, []);

  const deleteRecord = useCallback((id: number) => {
    setState((prev) => ({
      ...prev,
      records: prev.records.filter((r) => r.id !== id),
    }));
  }, []);

  return useMemo(
    () => ({
      members: state.members,
      records: state.records,
      openRecordOf,
      addMember,
      deleteMember,
      clockIn,
      clockOut,
      deleteRecord,
    }),
    [state, openRecordOf, addMember, deleteMember, clockIn, clockOut, deleteRecord]
  );
}
