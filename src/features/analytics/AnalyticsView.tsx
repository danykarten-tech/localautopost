import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle2, 
  Calendar, 
  Sparkles, 
  Info 
} from 'lucide-react';
import { localDb } from '../../data/local/database';

export const AnalyticsView: React.FC = () => {
  const concepts = localDb.getConcepts();

  const createdCount = concepts.length;
  const approvedCount = concepts.filter(c => c.status === 'approved').length;
  const scheduledCount = concepts.filter(c => c.status === 'scheduled').length;
  const publishedCount = concepts.filter(c => c.status === 'published').length;

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 className="heading-lg" style={{ fontSize: '1.75rem' }}>Content Analytics</h1>
          <p className="text-secondary" style={{ fontSize: '0.9375rem', marginTop: '4px' }}>
            Local performance tracking and content generation metrics.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <Info size={14} style={{ color: 'var(--info)' }} />
          <span>Local Demo Data • Phase 1</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div className="card">
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Posts Created</div>
          <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{createdCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '4px' }}>+12% vs last week</div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Posts Approved</div>
          <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{approvedCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '4px' }}>85% Approval Rate</div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Posts Scheduled</div>
          <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{scheduledCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--info)', marginTop: '4px' }}>Active in queue</div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Posts Published</div>
          <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{publishedCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Completed</div>
        </div>
      </div>

      {/* Content Distribution Visual */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="card">
          <h2 className="heading-md" style={{ marginBottom: '16px' }}>Weekly Generation Velocity</h2>
          <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '16px', padding: '20px 0', borderBottom: '1px solid var(--border-color)' }}>
            {[
              { day: 'Mon', count: 4 },
              { day: 'Tue', count: 8 },
              { day: 'Wed', count: 6 },
              { day: 'Thu', count: 12 },
              { day: 'Fri', count: 9 },
              { day: 'Sat', count: 3 },
              { day: 'Sun', count: 2 }
            ].map(d => (
              <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div 
                  style={{ 
                    width: '100%', 
                    height: `${d.count * 14}px`, 
                    backgroundColor: 'var(--accent)', 
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 300ms ease'
                  }} 
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="heading-md" style={{ marginBottom: '16px' }}>Pillar Breakdown</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Educational', pct: '40%', color: 'var(--accent)' },
              { label: 'Product Promotion', pct: '25%', color: 'var(--info)' },
              { label: 'Brand Awareness', pct: '20%', color: 'var(--warning)' },
              { label: 'Engagement', pct: '15%', color: 'var(--success)' }
            ].map(p => (
              <div key={p.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '4px' }}>
                  <span>{p.label}</span>
                  <span style={{ fontWeight: 600 }}>{p.pct}</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: p.pct, height: '100%', background: p.color }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
