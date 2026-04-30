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

  return (
    <div className="container">
      <Header />
      <Tabs active={tab} onChange={setTab} />
      {tab === 'punch' && <PunchPanel tc={tc} />}
      {tab === 'members' && <MembersPanel tc={tc} />}
      {tab === 'history' && <HistoryPanel tc={tc} />}
      {tab === 'summary' && <SummaryPanel tc={tc} />}
    </div>
  );
}
