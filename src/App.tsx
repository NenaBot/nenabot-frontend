import React, { useState } from 'react';
import { Header } from './components/Header';
import { StatusCards } from './components/StatusCards';
import { TabNavigation } from './components/TabNavigation';
import { SetupTab } from './components/SetupTab';
import { RouteTab } from './components/RouteTab';
import { ProgressTab } from './components/ProgressTab';
import { ResultsTab } from './components/ResultsTab';
import { BreadcrumbNav } from './components/BreadcrumbNav';

export default function App() {
  const [activeTab, setActiveTab] = useState('setup');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'setup':
        return <SetupTab />;
      case 'route':
        return <RouteTab />;
      case 'progress':
        return <ProgressTab />;
      case 'results':
        return <ResultsTab />;
      default:
        return <SetupTab />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--md-sys-color-surface)]">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-6">
        <BreadcrumbNav activeTab={activeTab} />
        <StatusCards />
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="mt-6">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
}