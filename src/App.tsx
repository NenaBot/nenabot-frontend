import { useState } from 'react';
import { Header } from './components/Header';
import { StatusCards } from './components/StatusCards';
import { TabNavigation } from './components/TabNavigation';
import { SetupTab } from './components/tabs/SetupTab';
import { CameraTab } from './components/tabs/CameraTab';
import { RouteTab } from './components/tabs/RouteTab';
import { ProgressTab } from './components/tabs/ProgressTab';
import { ResultsTab } from './components/tabs/ResultsTab';
import { ProfileModel } from './types/profile.types';

export default function App() {
  const [activeTab, setActiveTab] = useState('setup');
  const [selectedProfile, setSelectedProfile] = useState<ProfileModel | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  const goToCamera = () => setActiveTab('camera');
  const goToRoute = () => setActiveTab('route');
  const goToProgress = () => setActiveTab('progress');
  const goToResults = () => setActiveTab('results');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'setup':
        return (
          <SetupTab
            selectedProfile={selectedProfile}
            onProfileChange={setSelectedProfile}
            onNext={goToCamera}
          />
        );
      case 'camera':
        return <CameraTab onNext={goToRoute} />;
      case 'route':
        return (
          <RouteTab
            selectedProfile={selectedProfile}
            onJobCreated={(jobId) => {
              setCurrentJobId(jobId);
              goToProgress();
            }}
          />
        );
      case 'progress':
        return <ProgressTab jobId={currentJobId} onNext={goToResults} />;
      case 'results':
        return <ResultsTab initialJobId={currentJobId} />;
      default:
        return <SetupTab selectedProfile={selectedProfile} onProfileChange={setSelectedProfile} />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--md-sys-color-surface)]">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-6">
        <StatusCards />
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="mt-6">{renderTabContent()}</div>
      </main>
    </div>
  );
}
