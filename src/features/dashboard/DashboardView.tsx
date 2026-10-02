import React from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  Zap, 
  Activity,
  Instagram,
  Image as ImageIcon
} from 'lucide-react';
import { localDb } from '../../data/local/database';
import { Concept } from '../../domain/models/types';

interface DashboardViewProps {
  onNavigate: (route: string) => void;
  onEditConcept: (concept: Concept) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  onNavigate,
  onEditConcept
}) => {
  const concepts = localDb.getConcepts();
  const automation = localDb.getAutomation();
  const activities = localDb.getActivities();
  const workspace = localDb.getWorkspace();
  const mediaAssets = localDb.getMediaAssets();

  const scheduled = concepts.filter(c => c.status === 'scheduled');
  const pending = concepts.filter(c => c.status === 'pending');
  const approved = concepts.filter(c => c.status === 'approved');

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 className="heading-lg" style={{ fontSize: '1.75rem' }}>Good morning.</h1>
          <p className="text-secondary" style={{ fontSize: '0.9375rem', marginTop: '4px' }}>
            Here's what's happening with your content engine for <strong style={{ color: 'var(--text-primary)' }}>{workspace.name}</strong>.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigate('create')}>
          <Sparkles size={16} /> Create Content
        </button>
      </div>

      {/* Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div className="card card-interactive" onClick={() => onNavigate('calendar')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>Scheduled</span>
            <Calendar size={18} style={{ color: 'var(--info)' }} />
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{scheduled.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Ready for local publishing</div>
        </div>

        <div className="card card-interactive" onClick={() => onNavigate('approvals')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>Awaiting Approval</span>
            <Clock size={18} style={{ color: 'var(--warning)' }} />
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{pending.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '4px' }}>Action required in queue</div>
        </div>

        <div className="card card-interactive" onClick={() => onNavigate('approvals')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>Approved</span>
            <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{approved.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Ready to schedule</div>
        </div>

        <div className="card card-interactive" onClick={() => onNavigate('media')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>Local Media Assets</span>
            <ImageIcon size={18} style={{ color: 'var(--accent)' }} />
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{mediaAssets.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '4px' }}>Generated AI image pipeline</div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Approval Queue Section */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} style={{ color: 'var(--warning)' }} />
                <h2 className="heading-md">Approval Queue ({pending.length})</h2>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('approvals')}>
                View All <ArrowRight size={14} />
              </button>
            </div>

            {pending.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px border-color' }}>
                <CheckCircle2 size={24} style={{ color: 'var(--success)', margin: '0 auto 8px' }} />
                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>Approval Queue Clean</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>No concepts waiting for review.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {pending.slice(0, 3).map(item => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <img
                      src={item.visualUrl}
                      alt={item.title}
                      style={{ width: '52px', height: '52px', borderRadius: '6px', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                        {item.hook}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => onEditConcept(item)}
                      >
                        Review
                      </button>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => localDb.updateConceptStatus(item.id, 'approved')}
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Scheduled Content */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} style={{ color: 'var(--info)' }} />
                <h2 className="heading-md">Upcoming Posts</h2>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('calendar')}>
                Open Calendar <ArrowRight size={14} />
              </button>
            </div>

            {scheduled.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                <Calendar size={24} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>No Scheduled Posts</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Approve concepts from queue to schedule.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {scheduled.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img src={item.visualUrl} alt={item.title} style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{item.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <Instagram size={12} style={{ color: '#E1306C' }} />
                          <span>{item.scheduledDate} at {item.scheduledTime}</span>
                        </div>
                      </div>
                    </div>
                    <span className="badge badge-scheduled">Scheduled</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Automation Status Panel */}
          <div className="card card-elevated">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={18} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Local Engine Status</span>
              </div>
              <span className={`badge ${automation.isEnabled ? 'badge-approved' : 'badge-draft'}`}>
                {automation.isEnabled ? 'ACTIVE' : 'OFF'}
              </span>
            </div>
            
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
              Local batch mode configured for <strong style={{ color: 'var(--text-primary)' }}>{automation.frequency}</strong>. 
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Posting Days:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{automation.postingDays.join(', ')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Preferred Time:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{automation.postingTime}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Safety Gate:</span>
                <span style={{ color: 'var(--success)', fontWeight: 500 }}>Approval Required (ON)</span>
              </div>
            </div>

            <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={() => onNavigate('automation')}>
              Configure Engine Workflow
            </button>
          </div>

          {/* Activity Log */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Activity size={16} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Local Activity Log</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activities.map(act => (
                <div key={act.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{act.title}</span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{act.timestamp}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{act.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
