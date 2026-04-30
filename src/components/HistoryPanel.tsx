import { useMemo, useState } from 'react';
import type { UseTimecard } from '../hooks/useTimecard';
import { BUREAUS, ROLES } from '../types';
import { fmtDate, fmtDateTime, fmtDuration, fmtTime } from '../utils';

interface HistoryPanelProps {
  tc: UseTimecard;
}

export function HistoryPanel({ tc }: HistoryPanelProps) {
  const [memberFilter, setMemberFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [bureauFilter, setBureauFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  const memberById = useMemo(
    () => new Map(tc.members.map((m) => [m.id, m])),
    [tc.members]
  );

  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    tc.members.forEach((m) => {
      if (!m.department) return;
      if (bureauFilter && m.bureau !== bureauFilter) return;
      set.add(m.department);
    });
    return Array.from(set).sort();
  }, [tc.members, bureauFilter]);

  const filtered = useMemo(() => {
    let list = [...tc.records].sort((a, b) => b.inAt - a.inAt);
    if (memberFilter) {
      const id = parseInt(memberFilter, 10);
      list = list.filter((r) => r.memberId === id);
    }
    if (dateFilter.trim()) {
      list = list.filter((r) => fmtDate(r.inAt) === dateFilter.trim());
    }
    if (roleFilter) {
      list = list.filter((r) => memberById.get(r.memberId)?.role === roleFilter);
    }
    if (bureauFilter) {
      list = list.filter((r) => memberById.get(r.memberId)?.bureau === bureauFilter);
    }
    if (departmentFilter) {
      list = list.filter(
        (r) => memberById.get(r.memberId)?.department === departmentFilter
      );
    }
    return list;
  }, [
    tc.records,
    memberFilter,
    dateFilter,
    roleFilter,
    bureauFilter,
    departmentFilter,
    memberById,
  ]);

  const handleDelete = (id: number) => {
    if (window.confirm('この打刻履歴を削除します。よろしいですか?')) {
      tc.deleteRecord(id);
    }
  };

  const exportCSV = () => {
    const rows: Array<Array<string | number>> = [
      [
        '日付',
        '名前',
        'ふりがな',
        '学年',
        'クラス',
        '役職',
        '局',
        '部',
        '出勤時刻',
        '退勤時刻',
        '滞在時間(分)',
        '備考',
      ],
    ];
    [...tc.records]
      .sort((a, b) => a.inAt - b.inAt)
      .forEach((r) => {
        const m = memberById.get(r.memberId);
        const mins = r.outAt ? Math.round((r.outAt - r.inAt) / 60000) : '';
        rows.push([
          fmtDate(r.inAt),
          m ? m.name : '(削除済み)',
          m?.furigana ?? '',
          m?.grade ?? '',
          m?.classroom ?? '',
          m ? m.role : '',
          m?.bureau ?? '',
          m?.department ?? '',
          fmtDateTime(r.inAt),
          r.outAt ? fmtDateTime(r.outAt) : '',
          mins,
          r.autoClosed ? '自動退勤' : '',
        ]);
      });
    const csv = rows
      .map((row) =>
        row
          .map((cell) => {
            const s = String(cell ?? '');
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(',')
      )
      .join('\r\n');
    const bom = '﻿';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timecard_${fmtDate(Date.now())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card">
      <h2>打刻履歴</h2>
      <div className="toolbar">
        <select value={memberFilter} onChange={(e) => setMemberFilter(e.target.value)}>
          <option value="">全メンバー</option>
          {tc.members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">全役職</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={bureauFilter}
          onChange={(e) => {
            setBureauFilter(e.target.value);
            setDepartmentFilter('');
          }}
        >
          <option value="">全局</option>
          {BUREAUS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          disabled={departmentOptions.length === 0}
        >
          <option value="">
            {departmentOptions.length === 0 ? '部なし' : '全部'}
          </option>
          {departmentOptions.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="日付 (YYYY-MM-DD)"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
        {(memberFilter || roleFilter || bureauFilter || departmentFilter || dateFilter) && (
          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              setMemberFilter('');
              setRoleFilter('');
              setBureauFilter('');
              setDepartmentFilter('');
              setDateFilter('');
            }}
          >
            クリア
          </button>
        )}
        <div className="spacer" />
        <span className="muted" style={{ fontSize: 13 }}>
          {filtered.length} / {tc.records.length} 件
        </span>
        <button className="btn btn-outline btn-sm" onClick={exportCSV}>
          CSVダウンロード
        </button>
      </div>
      {filtered.length === 0 ? (
        <div className="empty">履歴がありません</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>日付</th>
              <th>名前</th>
              <th>役職</th>
              <th>所属</th>
              <th>出勤</th>
              <th>退勤</th>
              <th>滞在時間</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const m = memberById.get(r.memberId);
              const affiliation = [m?.bureau, m?.department].filter(Boolean).join(' ');
              return (
                <tr key={r.id}>
                  <td>{fmtDate(r.inAt)}</td>
                  <td>{m ? m.name : '(削除済み)'}</td>
                  <td>{m ? m.role : <span className="muted">―</span>}</td>
                  <td>{affiliation || <span className="muted">―</span>}</td>
                  <td>{fmtTime(r.inAt)}</td>
                  <td>
                    {r.outAt ? (
                      <>
                        {fmtTime(r.outAt)}
                        {r.autoClosed && (
                          <span className="auto-closed-badge" title="0:00時点で自動退勤">
                            自動
                          </span>
                        )}
                      </>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {r.outAt ? (
                      fmtDuration(r.outAt - r.inAt)
                    ) : (
                      <span style={{ color: '#16a34a' }}>在室中</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleDelete(r.id)}
                    >
                      削除
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
