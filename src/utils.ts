export const pad = (n: number): string => String(n).padStart(2, '0');

export const fmtTime = (ts: number): string => {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export const fmtDate = (ts: number): string => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const fmtDateTime = (ts: number): string => `${fmtDate(ts)} ${fmtTime(ts)}`;

export const fmtDuration = (ms: number): string => {
  const safe = Math.max(0, ms);
  const totalSec = Math.floor(safe / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}時間${pad(m)}分`;
  if (m > 0) return `${m}分${pad(s)}秒`;
  return `${s}秒`;
};

export const fmtJapaneseDate = (ts: number): string => {
  const d = new Date(ts);
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 (${days[d.getDay()]})`;
};

export const monthStart = (now = new Date()): number =>
  new Date(now.getFullYear(), now.getMonth(), 1).getTime();
