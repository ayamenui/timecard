import type { TabKey } from '../types';

interface TabsProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'punch', label: '打刻' },
  { key: 'members', label: 'メンバー' },
  { key: 'history', label: '履歴' },
  { key: 'summary', label: '集計' },
];

export function Tabs({ active, onChange }: TabsProps) {
  return (
    <div className="tabs" role="tablist">
      {TABS.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={active === t.key}
          className={`tab ${active === t.key ? 'active' : ''}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
