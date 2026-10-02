import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { CommandPalette } from './components/common/CommandPalette';
import { OnboardingFlow } from './features/onboarding/OnboardingFlow';
import { DashboardView } from './features/dashboard/DashboardView';
import { CreateContentFlow } from './features/create/CreateContentFlow';
import { ApprovalCenterView } from './features/approvals/ApprovalCenterView';
import { ContentListView } from './features/content/ContentListView';
import { ContentEditorModal } from './features/content/ContentEditorModal';
import { CalendarView } from './features/calendar/CalendarView';
import { AutomationView } from './features/automation/AutomationView';
import { MediaLibraryView } from './features/media/MediaLibraryView';
import { BrandKitView } from './features/brand/BrandKitView';
import { SocialAccountsView } from './features/social/SocialAccountsView';
import { AIStudioView } from './features/aistudio/AIStudioView';
import { AnalyticsView } from './features/analytics/AnalyticsView';
import { SettingsView } from './features/settings/SettingsView';
import { HelpCenterView } from './features/help/HelpCenterView';

import { localDb } from './data/local/database';
import { Concept } from './domain/models/types';

export function App() {
  const [dbStateVersion, setDbStateVersion] = useState(0);
  const [currentRoute, setCurrentRoute] = useState<string>('dashboard');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [activeEditingConcept, setActiveEditingConcept] = useState<Concept | null>(null);

  useEffect(() => {
    const unsubscribe = localDb.subscribe(() => {
      setDbStateVersion(prev => prev + 1);
    });
    // Set theme attribute on mount
    document.documentElement.setAttribute('data-theme', localDb.getTheme());
    return unsubscribe;
  }, []);

  const workspace = localDb.getWorkspace();
  const concepts = localDb.getConcepts();
  const pendingCount = concepts.filter(c => c.status === 'pending').length;

  if (!workspace.isCompletedOnboarding) {
    return <OnboardingFlow onComplete={() => setCurrentRoute('dashboard')} />;
  }

  const renderCurrentView = () => {
    switch (currentRoute) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigate={setCurrentRoute}
            onEditConcept={setActiveEditingConcept}
          />
        );
      case 'create':
        return (
          <CreateContentFlow
            onEditConcept={setActiveEditingConcept}
            onNavigate={setCurrentRoute}
          />
        );
      case 'content':
        return (
          <ContentListView
            onEditConcept={setActiveEditingConcept}
            onNavigate={setCurrentRoute}
          />
        );
      case 'approvals':
        return (
          <ApprovalCenterView
            onEditConcept={setActiveEditingConcept}
            onNavigate={setCurrentRoute}
          />
        );
      case 'calendar':
        return (
          <CalendarView
            onEditConcept={setActiveEditingConcept}
            onNavigate={setCurrentRoute}
          />
        );
      case 'automation':
        return <AutomationView />;
      case 'media':
        return <MediaLibraryView />;
      case 'brand':
        return <BrandKitView />;
      case 'social':
        return <SocialAccountsView />;
      case 'aistudio':
        return <AIStudioView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'settings':
        return <SettingsView />;
      case 'help':
        return <HelpCenterView />;
      default:
        return (
          <DashboardView
            onNavigate={setCurrentRoute}
            onEditConcept={setActiveEditingConcept}
          />
        );
    }
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={setCurrentRoute}
        pendingCount={pendingCount}
      />

      {/* Main App Workspace */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <TopBar
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onNavigate={setCurrentRoute}
        />

        <main style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--bg-primary)' }}>
          {renderCurrentView()}
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={setCurrentRoute}
      />

      {/* Content Editor Modal */}
      <ContentEditorModal
        concept={activeEditingConcept}
        isOpen={activeEditingConcept !== null}
        onClose={() => setActiveEditingConcept(null)}
      />
    </div>
  );
}
