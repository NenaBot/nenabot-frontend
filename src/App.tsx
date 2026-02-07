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

  const goToCamera = () => setActiveTab('camera');
  const goToRoute = () => setActiveTab('route');
  const goToProgress = () => setActiveTab('progress');
  const goToResults = () => setActiveTab('results');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'setup':
        return <SetupTab onNext={goToCamera}/>;
      case 'camera':
        return <CameraTab onNext={goToRoute} />;
      case 'route':
        return <RouteTab onNext={goToProgress} />;
      case 'progress':
        return <ProgressTab onNext={goToResults} />;
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