import React, { useState } from 'react';
import { 
  FileText, 
  Grid, 
  List, 
  Search, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Sparkles,
  Instagram
} from 'lucide-react';
import { localDb } from '../../data/local/database';
import { Concept } from '../../domain/models/types';

interface ContentListViewProps {
  onEditConcept: (concept: Concept) => void;
  onNavigate: (route: string) => void;
}

export const ContentListView: React.FC<ContentListViewProps> = ({ 
  onEditConcept,
  onNavigate 
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const concepts = localDb.getConcepts();

  const filtered = concepts.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.hook.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 className="heading-lg" style={{ fontSize: '1.75rem' }}>Content Repository</h1>
          <p className="text-secondary" style={{ fontSize: '0.9375rem', marginTop: '4px' }}>
            Browse and manage all created concepts, drafts, and scheduled posts.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigate('create')}>
          <Sparkles size={16} /> New Concepts
        </button>
      </div>

      {/* Control Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search content..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '6px 10px',
              borderRadius: '4px',
              backgroundColor: viewMode === 'grid' ? 'var(--bg-secondary)' : 'transparent',
              color: viewMode === 'grid' ? 'var(--text-primary)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.8125rem'
            }}
          >
            <Grid size={15} /> Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '6px 10px',
              borderRadius: '4px',
              backgroundColor: viewMode === 'list' ? 'var(--bg-secondary)' : 'transparent',
              color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.8125rem'
            }}
          >
            <List size={15} /> List
          </button>
        </div>
      </div>

      {/* Grid Mode */}
      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {filtered.map(item => (
            <div key={item.id} className="card card-interactive" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ position: 'relative', height: '160px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '12px' }}>
                  <img src={item.visualUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                    <span className={`badge badge-${item.status}`}>{item.status.toUpperCase()}</span>
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Instagram size={12} style={{ color: '#E1306C' }} /> {item.contentType}
                </div>

                <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.hook}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {item.scheduledDate || 'Unscheduled'}
                </span>
                <button className="btn btn-secondary btn-sm" onClick={() => onEditConcept(item)}>
                  <Edit3 size={13} /> Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List Mode */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {filtered.map((item, idx) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-color)' : 'none',
                background: 'var(--bg-secondary)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                <img src={item.visualUrl} alt={item.title} style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover' }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.hook}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <span className={`badge badge-${item.status}`}>{item.status.toUpperCase()}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: '100px' }}>{item.scheduledDate || 'Draft'}</span>
                <button className="btn btn-secondary btn-sm" onClick={() => onEditConcept(item)}>
                  <Edit3 size={13} /> Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
