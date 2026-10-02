import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Command, 
  CheckCircle, 
  AlertCircle, 
  Info,
  ChevronDown,
  User,
  Zap,
  Check
} from 'lucide-react';
import { localDb } from '../../data/local/database';

interface TopBarProps {
  onOpenCommandPalette: () => void;
  onNavigate: (route: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ 
  onOpenCommandPalette,
  onNavigate 
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const workspace = localDb.getWorkspace();
  const aiConnection = localDb.getAIConnection();

  const notifications = [
    {
      id: 'notif_1',
      title: '5 New Concepts Ready',
      message: 'Local generator completed batch for Northstar Coffee.',
      time: '10m ago',
      type: 'info'
    },
    {
      id: 'notif_2',
      title: 'Schedule Updated',
      message: '3 posts queued for Instagram publishing.',
      time: '1h ago',
      type: 'success'
    },
    {
      id: 'notif_3',
      title: 'Local Environment Active',
      message: 'AI Provider connected via local workstation.',
      time: '2h ago',
      type: 'success'
    }
  ];

  return (
    <header 
      style={{
        height: '56px',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 5
      }}
    >
      {/* Left: Workspace Dropdown / Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button 
          onClick={() => onNavigate('settings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 10px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--text-primary)'
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent)' }}></span>
          <span>{workspace.name}</span>
          <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
        </button>

        {/* AI Session Status Pill */}
        <div 
          onClick={() => onNavigate('aistudio')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 8px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
            backgroundColor: aiConnection.status === 'connected' ? 'var(--success-bg)' : 'var(--warning-bg)',
            color: aiConnection.status === 'connected' ? 'var(--success)' : 'var(--warning)',
            border: `1px solid ${aiConnection.status === 'connected' ? 'rgba(53, 201, 139, 0.3)' : 'rgba(244, 183, 64, 0.3)'}`,
            cursor: 'pointer'
          }}
        >
          <Zap size={11} />
          <span>{aiConnection.status === 'connected' ? 'AI Session Active' : 'AI Needs Attention'}</span>
        </div>
      </div>

      {/* Middle: Search / Command Shortcut */}
      <div style={{ flex: 1, maxWidth: '420px', margin: '0 20px' }}>
        <button
          onClick={onOpenCommandPalette}
          style={{
            width: '100%',
            height: '34px',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '0 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8125rem',
            color: 'var(--text-muted)',
            transition: 'border-color 150ms ease'
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-color-light)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-color)')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={14} />
            <span>Search or jump to...</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', padding: '1px 5px', borderRadius: '4px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            <Command size={10} />
            <span>K</span>
          </div>
        </button>
      </div>

      {/* Right: Notifications & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
        {/* Notifications Dropdown */}
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: showNotifications ? 'var(--bg-hover)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            position: 'relative'
          }}
        >
          <Bell size={17} />
          <span style={{ position: 'absolute', top: '7px', right: '7px', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent)' }}></span>
        </button>

        {showNotifications && (
          <div 
            style={{
              position: 'absolute',
              top: '44px',
              right: 0,
              width: '320px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              padding: '12px',
              zIndex: 100
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Notifications</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent)', cursor: 'pointer' }}>Mark all read</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notifications.map(n => (
                <div key={n.id} style={{ padding: '8px', borderRadius: '6px', background: 'var(--bg-elevated)', display: 'flex', gap: '10px' }}>
                  {n.type === 'success' ? <CheckCircle size={15} style={{ color: 'var(--success)', marginTop: '2px' }} /> : <Info size={15} style={{ color: 'var(--info)', marginTop: '2px' }} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{n.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{n.message}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '4px' }}>{n.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '8px', borderLeft: '1px solid var(--border-color)' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--accent)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.75rem' }}>
            AQ
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Lead Operator</span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '2px' }}>Local Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
};
