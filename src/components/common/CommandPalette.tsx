import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Calendar, 
  FileImage, 
  Palette, 
  Zap, 
  Share2, 
  Settings, 
  Moon, 
  Sun, 
  Search,
  Command,
  FileText
} from 'lucide-react';
import { localDb } from '../../data/local/database';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands = [
    { id: 'create', title: 'Create Content', icon: Sparkles, route: 'create', category: 'Action' },
    { id: 'approvals', title: 'Open Approval Center', icon: CheckCircle2, route: 'approvals', category: 'Navigation' },
    { id: 'calendar', title: 'Open Content Calendar', icon: Calendar, route: 'calendar', category: 'Navigation' },
    { id: 'media', title: 'Open Media Library', icon: FileImage, route: 'media', category: 'Navigation' },
    { id: 'brand', title: 'Open Brand Kit', icon: Palette, route: 'brand', category: 'Navigation' },
    { id: 'automation', title: 'Open Local Automation', icon: Zap, route: 'automation', category: 'Navigation' },
    { id: 'social', title: 'Open Social Accounts', icon: Share2, route: 'social', category: 'Navigation' },
    { id: 'settings', title: 'Open Settings', icon: Settings, route: 'settings', category: 'Navigation' },
    { id: 'theme', title: 'Toggle Theme Mode', icon: localDb.getTheme() === 'dark' ? Sun : Moon, route: 'toggle_theme', category: 'Preference' }
  ];

  const concepts = localDb.getConcepts();
  const matchingConcepts = query.trim() ? concepts.filter(c => 
    c.title.toLowerCase().includes(query.toLowerCase()) || 
    c.hook.toLowerCase().includes(query.toLowerCase()) ||
    c.captionPreview.toLowerCase().includes(query.toLowerCase())
  ).map(c => ({
    id: c.id,
    title: c.title,
    icon: FileText,
    route: 'content',
    category: `Content • ${c.status.toUpperCase()}`
  })) : [];

  const filteredCommands = commands.filter(c => c.title.toLowerCase().includes(query.toLowerCase()));
  const allResults = [...matchingConcepts, ...filteredCommands];

  const handleSelect = (item: typeof allResults[0]) => {
    if (item.id === 'theme' || item.route === 'toggle_theme') {
      const current = localDb.getTheme();
      localDb.setTheme(current === 'dark' ? 'light' : 'dark');
    } else {
      onNavigate(item.route);
    }
    onClose();
    setQuery('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-box"
        style={{ maxWidth: '580px', padding: 0, overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border-color)', gap: '10px' }}>
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Type a command or search content (e.g. coffee, brew, approvals)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
            style={{ width: '100%', fontSize: '0.9375rem', color: 'var(--text-primary)' }}
          />
          <span style={{ fontSize: '0.75rem', padding: '2px 6px', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-muted)' }}>
            ESC
          </span>
        </div>

        <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '8px' }}>
          {allResults.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No matching commands or content found.
            </div>
          ) : (
            allResults.map((item) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    transition: 'background 100ms ease',
                    marginBottom: '2px'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                      <IconComponent size={15} style={{ color: 'var(--accent)' }} />
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{item.title}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.category}</span>
                </div>
              );
            })
          )}
        </div>

        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Command size={12} /> Avenzaq Global Search & Command Palette
          </div>
          <div>Use ↑ ↓ to navigate</div>
        </div>
      </div>
    </div>
  );
};
