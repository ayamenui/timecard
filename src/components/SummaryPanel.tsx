import { useMemo } from 'react';
import { useNow } from '../hooks/useNow';
import type { UseTimecard } from '../hooks/useTimecard';
import { fmtDuration, monthStart, pad } from '../utils';

interface SummaryPanelProps {
  tc: UseTimecard;
}

export function SummaryPanel({ tc }: SummaryPanelProps) {
  const now = useNow(15000);

  const { monthRecords, totalMs, perMember, workingCount } = useMemo(() => {
    const start = monthStart(new Date(now));
    const month = tc.records.filter((r) => r.inAt >= start);
    let total = 0;
    month.forEach((r) => {
      const end = r.outAt ?? now;
      total += end - r.inAt;
    });
    const per = tc.members.map((m) => {
      const recs = month.filter((r) => r.memberId === m.id);
      let ms = 0;
      recs.forEach((r) => {
        ms += (r.outAt ?? now) - r.inAt;
      });
      return { member: m, count: recs.length, ms };
    });
    const working = tc.members.filter((m) => tc.openRecordOf(m.id)).length;
    return { monthRecords: month, totalMs: total, perMember: per, workingCount: working };
  }, [tc, now]);

  const totalH = Math.floor(totalMs / 3600000);
  const totalM = Math.floor((totalMs % 3600000) / 60000);

  return (
    <>
      <div className="summary-grid">
        <div className="stat">
          <div className="stat-value">{tc.members.length}</div>
          <div className="stat-label">登録メンバー数</div>
        </div>
        <div className="stat">
          <div className="stat-value">{workingCount}</div>
          <div className="stat-label">現在の在室人数</div>
        </div>
        <div className="stat">
          <div className="stat-value">{monthRecords.length}</div>
          <div className="stat-label">今月の打刻回数</div>
        </div>
        <div className="stat">
          <div className="stat-value">
            {totalH}時間{pad(totalM)}分
          </div>
          <div className="stat-label">今月の総滞在時間</div>
        </div>
      </div>
      <div className="card">
        <h2>メンバー別 今月の活動時間</h2>
        {tc.members.length === 0 ? (
          <div className="empty">メンバーが登録されていません</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>名前</th>
                <th>役職</th>
                <th>回数</th>
                <th>合計時間</th>
              </tr>
            </thead>
            <tbody>
              {perMember.map(({ member, count, ms }) => (
                <tr key={member.id}>
                  <td>{member.name}</td>
                  <td>{member.role}</td>
                  <td>{count}</td>
                  <td>{fmtDuration(ms)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
