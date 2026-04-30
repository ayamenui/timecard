import { useNow } from '../hooks/useNow';
import { fmtJapaneseDate, pad } from '../utils';

export function Header() {
  const now = useNow();
  const d = new Date(now);
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  return (
    <header className="app-header">
      <h1>生徒会タイムカード</h1>
      <div className="date">{fmtJapaneseDate(now)}</div>
      <div className="clock">{time}</div>
    </header>
  );
}
