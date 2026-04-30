import { useState } from 'react';
import { Header } from './components/Header';
import { HistoryPanel } from './components/HistoryPanel';
import { MembersPanel } from './components/MembersPanel';
import { PunchPanel } from './components/PunchPanel';
import { SummaryPanel } from './components/SummaryPanel';
import { Tabs } from './components/Tabs';
import { useTimecard } from './hooks/useTimecard';
import type { TabKey } from './types';

export default function App() {
  const tc = useTimecard();
  const [tab, setTab] = useState<TabKey>('punch');

  if (tc.status === 'loading') {
    return (
      <div className="container">
        <Header />
        <div className="card empty">サーバーからデータを読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <Header />
      {tc.status === 'error' && (
        <div className="card error-banner">
          <strong>同期エラー:</strong> {tc.errorMessage ?? '不明なエラー'}
          <div style={{ fontSize: 12, marginTop: 4 }}>
            バックエンドサーバー(ポート 3001)が起動しているか確認してください。
          </div>
        </div>
      )}
      {tc.status === 'saving' && (
        <div className="sync-indicator">保存中...</div>
      )}
      <Tabs active={tab} onChange={setTab} />
      {tab === 'punch' && <PunchPanel tc={tc} />}
      {tab === 'members' && <MembersPanel tc={tc} />}
      {tab === 'history' && <HistoryPanel tc={tc} />}
      {tab === 'summary' && <SummaryPanel tc={tc} />}
    </div>
  );
}
