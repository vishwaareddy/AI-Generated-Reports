import { useCallback, useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import MobileNav from './components/MobileNav';
import UploadScreen from './screens/UploadScreen';
import AnalysisScreen from './screens/AnalysisScreen';
import DashboardScreen from './screens/DashboardScreen';
import ReportsScreen from './screens/ReportsScreen';
import PresentationsScreen from './screens/PresentationsScreen';
import InsightsScreen from './screens/InsightsScreen';
import ForecastingScreen from './screens/ForecastingScreen';
import ChatScreen from './screens/ChatScreen';
import EmptyState from './components/EmptyState';
import type { UploadedFile } from './types';

export type Screen = 'upload' | 'analysis' | 'dashboard' | 'reports' | 'presentations' | 'insights' | 'forecasting' | 'chat';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('upload');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const goTo = useCallback((s: Screen) => setActiveScreen(s), []);

  const readyFiles = files.filter((f) => f.status === 'ready');
  const hasReadyData = readyFiles.length > 0;
  const selectedFile = files.find((f) => f.id === selectedFileId) ?? readyFiles[0] ?? null;

  const updateFile = useCallback((id: string, patch: Partial<UploadedFile>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setSelectedFileId((cur) => (cur === id ? null : cur));
  }, []);

  const requireData = (node: React.ReactNode) =>
    hasReadyData
      ? node
      : (
        <EmptyState
          title="Upload your business data first"
          message="Upload your business data to generate dashboards, reports, forecasting, and AI insights."
          ctaLabel="Go to Upload"
          onCta={() => goTo('upload')}
        />
      );

  const renderScreen = () => {
    switch (activeScreen) {
      case 'upload':
        return (
          <UploadScreen
            files={files}
            setFiles={setFiles}
            updateFile={updateFile}
            removeFile={removeFile}
            onAnalyze={() => goTo('analysis')}
          />
        );
      case 'analysis':
        return (
          <AnalysisScreen
            files={files}
            onComplete={(fileId) => {
              if (fileId) setSelectedFileId(fileId);
              goTo('dashboard');
            }}
          />
        );
      case 'dashboard':
        return requireData(
          <DashboardScreen
            files={readyFiles}
            selectedFile={selectedFile}
            setSelectedFileId={(id) => setSelectedFileId(id)}
          />
        );
      case 'reports':
        return requireData(<ReportsScreen file={selectedFile} files={readyFiles} setSelectedFileId={(id) => setSelectedFileId(id)} />);
      case 'presentations':
        return requireData(<PresentationsScreen file={selectedFile} files={readyFiles} setSelectedFileId={(id) => setSelectedFileId(id)} />);
      case 'insights':
        return requireData(<InsightsScreen file={selectedFile} files={readyFiles} setSelectedFileId={(id) => setSelectedFileId(id)} />);
      case 'forecasting':
        return requireData(<ForecastingScreen file={selectedFile} files={readyFiles} setSelectedFileId={(id) => setSelectedFileId(id)} />);
      case 'chat':
        return requireData(<ChatScreen file={selectedFile} />);
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] noise">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-[0.06] animate-blob"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-[0.05] animate-blob"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)', animationDelay: '3s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full opacity-[0.04] animate-blob"
          style={{ background: 'radial-gradient(circle, #06b6d4, transparent)', animationDelay: '6s' }}></div>
      </div>
      <div className="fixed inset-0 grid-bg pointer-events-none z-0 opacity-60"></div>

      <div className="flex min-h-screen relative z-10">
        <Sidebar
          activeScreen={activeScreen}
          setActiveScreen={(s) => goTo(s as Screen)}
          hasData={hasReadyData}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <TopBar activeScreen={activeScreen} setActiveScreen={(s) => goTo(s as Screen)} />

          <main className={`flex-1 overflow-y-auto ${activeScreen === 'chat' ? '' : 'pb-20 lg:pb-6'}`}>
            {renderScreen()}
          </main>
        </div>
      </div>

      <MobileNav
        activeScreen={activeScreen}
        setActiveScreen={(s) => goTo(s as Screen)}
        hasData={hasReadyData}
      />
    </div>
  );
}
