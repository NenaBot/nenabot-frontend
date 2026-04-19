import { ReactNode, useState } from 'react';
import { Header } from './components/Header';
import { StatusCards } from './components/StatusCards';
import { TabNavigation } from './components/TabNavigation';
import { SetupTab } from './components/tabs/SetupTab';
import { CameraTab } from './components/tabs/CameraTab';
import { CalibrationTab } from './components/tabs/CalibrationTab';
import { RouteTab } from './components/tabs/RouteTab';
import { ProgressTab } from './components/tabs/ProgressTab';
import { ResultsTab } from './components/tabs/ResultsTab';
import { ProfileModel } from './types/profile.types';
import { TabId } from './types/tab.types';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('setup');
  const [selectedProfile, setSelectedProfile] = useState<ProfileModel | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  const goToCamera = () => setActiveTab('camera');
  const goToRoute = () => setActiveTab('route');
  const goToProgress = () => setActiveTab('progress');
  const goToResults = () => setActiveTab('results');

  const handleProfileChange = (profile: ProfileModel | null) => {
    console.log(`[App] Profile changed:`, profile?.name || 'none');
    setSelectedProfile(profile);
  };

  const handleJobCreated = (jobId: string) => {
    console.log(`[App] Job created: ${jobId}`);
    setCurrentJobId(jobId);
    goToProgress();
  };

  const renderPanel = (tabId: TabId, content: ReactNode) => {
    const isActive = activeTab === tabId;

    return (
      <section
        key={tabId}
        role="tabpanel"
        hidden={!isActive}
        aria-hidden={!isActive}
        className={isActive ? 'block' : 'hidden'}
      >
        {content}
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--md-sys-color-surface)]">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-6">
        <StatusCards />
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="mt-6">
          {renderPanel(
            'setup',
            <SetupTab
              selectedProfile={selectedProfile}
              onProfileChange={handleProfileChange}
              onNext={goToCamera}
            />,
          )}
          {renderPanel(
            'camera',
            <CameraTab onNext={goToRoute} isActive={activeTab === 'camera'} />,
          )}
          {renderPanel('calibration', <CalibrationTab isActive={activeTab === 'calibration'} />)}
          {renderPanel(
            'route',
            <RouteTab
              selectedProfile={selectedProfile}
              onJobCreated={handleJobCreated}
              isActive={activeTab === 'route'}
            />,
          )}
          {renderPanel(
            'progress',
            <ProgressTab
              jobId={currentJobId}
              onNext={goToResults}
              isActive={activeTab === 'progress'}
            />,
          )}
          {renderPanel(
            'results',
            <ResultsTab initialJobId={currentJobId} isActive={activeTab === 'results'} />,
          )}
        </div>
      </main>
    </div>
  );
}
