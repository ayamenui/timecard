import { useMemo, useState } from 'react';
import { useNow } from '../hooks/useNow';
import type { UseTimecard } from '../hooks/useTimecard';
import { fmtDuration } from '../utils';

interface PunchPanelProps {
  tc: UseTimecard;
}

export function PunchPanel({ tc }: PunchPanelProps) {
  const now = useNow();
  const [search, setSearch] = useState('');
  const workingCount = tc.members.filter((m) => tc.openRecordOf(m.id)).length;

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tc.members;
    return tc.members.filter((m) => {
      const haystack = [
        m.name,
        m.furigana,
        m.grade,
        m.classroom,
        m.role,
        m.bureau,
        m.department,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [tc.members, search]);

  const handleClockOut = (memberId: number, name: string) => {
    if (window.confirm(`${name} の退勤を記録します。よろしいですか?`)) {
      tc.clockOut(memberId);
    }
  };

  return (
    <div className="card">
      <h2>
        メンバー一覧 <span className="badge">{workingCount}</span>
      </h2>
      {tc.members.length === 0 ? (
        <div className="empty">
          メンバーが登録されていません。「メンバー」タブから追加してください。
        </div>
      ) : (
        <>
          <div className="toolbar">
            <input
              type="text"
              placeholder="検索 (名前 / ふりがな / 学年 / クラス / 役職 / 局 / 部)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setSearch('')}
              >
                クリア
              </button>
            )}
            <div className="spacer" />
            <span className="muted" style={{ fontSize: 13 }}>
              {search
                ? `${filteredMembers.length} / ${tc.members.length} 人`
                : `${tc.members.length} 人`}
            </span>
          </div>
          {filteredMembers.length === 0 ? (
            <div className="empty">該当するメンバーがいません</div>
          ) : (
            <div className="members-grid">
              {filteredMembers.map((m) => {
                const open = tc.openRecordOf(m.id);
                const isWorking = !!open;
                return (
                  <div
                    key={m.id}
                    className={`member-card ${isWorking ? 'working' : ''}`}
                  >
                    <div className="member-name">
                      {m.name}
                      {m.furigana && (
                        <span className="furigana-inline"> ({m.furigana})</span>
                      )}
                    </div>
                    {(m.grade || m.classroom) && (
                      <div className="member-grade">
                        {[m.grade, m.classroom].filter(Boolean).join(' ')}
                      </div>
                    )}
                    <div className="member-role">
                      {m.role}
                      {(m.bureau || m.department) && (
                        <span className="member-affiliation">
                          {' / '}
                          {[m.bureau, m.department].filter(Boolean).join(' ')}
                        </span>
                      )}
                    </div>
                    <span className={`status ${isWorking ? 'in' : 'out'}`}>
                      {isWorking ? '在室中' : '不在'}
                    </span>
                    {isWorking && open && (
                      <div className="since">
                        出勤から {fmtDuration(now - open.inAt)}
                      </div>
                    )}
                    <button
                      className={`btn btn-block ${isWorking ? 'btn-danger' : 'btn-success'}`}
                      onClick={() =>
                        isWorking ? handleClockOut(m.id, m.name) : tc.clockIn(m.id)
                      }
                    >
                      {isWorking ? '退勤' : '出勤'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
