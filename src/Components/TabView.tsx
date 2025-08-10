import { useState } from "preact/hooks";
export type Tab = {
  title: string;
  content: preact.ComponentChildren;
};
type TabViewProps = {
  tabs: Tab[];
  initialIndex?: number;
};

export default function TabView({ tabs, initialIndex }: TabViewProps) {
  const [activeTab, setActiveTab] = useState(initialIndex || 0);

  return (
    <div>
      <div class="no-scroll-ui" style={{ display: 'flex', borderBottom: '1px solid #4caf50', overflowX: 'auto', }}>
        {tabs.map((tab, ix) => (
          <button
            key={ix}
            onClick={() => setActiveTab(ix)}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              borderBottom: activeTab === ix ? '3px solid #4caf50' : '3px solid transparent',
              background: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === ix ? 'bold' : 'normal',
            }}
          >
            {tab.title}
          </button>
        ))}
      </div>

      <div style={{ padding: '1rem 0' }}>
        {tabs.map((tab, ix) => (
          <div
            style={{ display: activeTab === ix ? 'block' : 'none' }}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}