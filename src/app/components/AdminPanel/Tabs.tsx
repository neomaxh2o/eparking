import React from 'react';
import type { TabKey, TabConfig } from '@/interfaces/admin';

interface TabsProps {
  tabs: TabConfig[];
  activeTab: TabKey;
  setActiveTab: (key: TabKey) => void;
}

export default function Tabs({ tabs, activeTab, setActiveTab }: TabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === tab.key
              ? 'border-gray-300 bg-gray-200 text-gray-800 shadow-sm'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
