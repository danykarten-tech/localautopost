import React from 'react';
import { 
  LayoutDashboard, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  Calendar, 
  Zap, 
  FileImage, 
  Palette, 
  Share2, 
  Cpu, 
  BarChart3, 
  Settings, 
  HelpCircle,
  Layers 
} from 'lucide-react';
import { AvenzaqLogo } from '../common/AvenzaqLogo';
import { localDb } from '../../data/local/database';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  pendingCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  pendingCount
}) => {
  const workspace = localDb.getWorkspace();

  const mainNav = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'campaigns', label: 'Campaigns', icon: Layers, highlight: true },
    { id: 'create', label: 'Create', icon: Sparkles },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'approvals', label: 'Approvals', icon: CheckCircle2, badge: pendingCount > 0 ? pendingCount : undefined },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'automation', label: 'Automation', icon: Zap },
    { id: 'media', label: 'Media Library', icon: FileImage },
    { id: 'brand', label: 'Brand Kit', icon: Palette },
    { id: 'social', label: 'Social Accounts', icon: Share2 }
  ];

  const aiNav = [
    { id: 'aistudio', label: 'AI Studio', icon: Cpu }
  ];

  const analyticsNav = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  const bottomNav = [
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'help', label: 'Help & Support', icon: HelpCircle }
  ];

  const renderItem = (item: typeof mainNav[0]) => {
    const IconComponent = item.icon;
    const isActive = currentRoute === item.id;

    return (
      <button
        key={item.id}
        onClick={() => onNavigate(item.id)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.875rem',
          fontWeight: isActive ? 600 : 500,
          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
          backgroundColor: isActive ? 'var(--accent-alpha-10)' : 'transparent',
          borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
          marginBottom: '2px',
          transition: 'all 120ms ease'
        }}
        onMouseEnter={e => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }
        }}
        onMouseLeave={e => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <IconComponent 
            size={17} 
            style={{ 
              color: isActive ? 'var(--accent)' : item.highlight ? 'var(--accent)' : 'var(--text-muted)' 
            }} 
          />
          <span>{item.label}</span>
        </div>
        {item.badge !== undefined && (
          <span 
            className="badge badge-pending"
            style={{ fontSize: '0.7rem', padding: '1px 6px', fontWeight: 600 }}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside 
      style={{
        width: '250px',
        height: '100vh',
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        zIndex: 10,
        userSelect: 'none'
      }}
    >
      {/* Brand Header */}
      <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border-color)' }}>
        <AvenzaqLogo size="md" />
        <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--success)' }}></span>
          <span>Local Workstation</span>
        </div>
      </div>

      {/* Main Navigation Scroll Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
        <div style={{ marginBottom: '16px' }}>
          {mainNav.map(renderItem)}
        </div>

        <div style={{ padding: '0 8px 6px', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          AI SESSION
        </div>
        <div style={{ marginBottom: '16px' }}>
          {aiNav.map(renderItem)}
        </div>

        <div style={{ padding: '0 8px 6px', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          ANALYTICS
        </div>
        <div style={{ marginBottom: '16px' }}>
          {analyticsNav.map(renderItem)}
        </div>
      </div>

      {/* Footer Navigation */}
      <div style={{ padding: '10px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-elevated)' }}>
        {bottomNav.map(renderItem)}
        
        {/* Workspace Pill */}
        <div style={{ marginTop: '8px', padding: '8px 10px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
              {workspace.name}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
              Local-first v1.0
            </div>
          </div>
          <span style={{ fontSize: '0.65rem', padding: '2px 5px', background: 'var(--accent-alpha-10)', color: 'var(--accent)', borderRadius: '4px', fontWeight: 600 }}>
            PHASE 1
          </span>
        </div>
      </div>
    </aside>
  );
};
