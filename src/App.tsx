import { useState } from 'react';
import { Header } from './components/Header';
import { StatusCards } from './components/StatusCards';
import { TabNavigation } from './components/TabNavigation';
import { SetupTab } from './components/tabs/SetupTab';
import { CameraTab } from './components/tabs/CameraTab';
import { RouteTab } from './components/tabs/RouteTab';
import { ProgressTab } from './components/tabs/ProgressTab';
import { ResultsTab } from './components/tabs/ResultsTab';

export default function App() {
  const [activeTab, setActiveTab] = useState('setup');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'setup':
        return <SetupTab />;
      case 'camera':
        return <CameraTab onNext={() => setActiveTab('route')} />;
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
    <div className="min-h-screen bg-(--md-sys-color-surface)">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-6">
        <StatusCards />
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="mt-6">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
}