import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Instagram, 
  Clock, 
  Plus 
} from 'lucide-react';
import { localDb } from '../../data/local/database';
import { Concept } from '../../domain/models/types';

interface CalendarViewProps {
  onEditConcept: (concept: Concept) => void;
  onNavigate: (route: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ 
  onEditConcept,
  onNavigate 
}) => {
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'list'>('month');
  const [currentMonth, setCurrentMonth] = useState('October 2026');
  const concepts = localDb.getConcepts();

  // Simple calendar grid simulation for Oct 2026
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  const getConceptsForDay = (day: number) => {
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const dateStr = `2026-10-${dayStr}`;
    return concepts.filter(c => c.scheduledDate === dateStr);
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="heading-lg" style={{ fontSize: '1.75rem' }}>Content Calendar</h1>
          <p className="text-secondary" style={{ fontSize: '0.9375rem', marginTop: '4px' }}>
            Schedule and organize your posts across days and weeks.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {/* View Toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
            {(['month', 'week', 'day', 'list'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  backgroundColor: viewMode === mode ? 'var(--bg-secondary)' : 'transparent',
                  color: viewMode === mode ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: '0.8125rem',
                  fontWeight: viewMode === mode ? 600 : 500,
                  textTransform: 'capitalize'
                }}
              >
                {mode}
              </button>
            ))}
          </div>

          <button className="btn btn-primary" onClick={() => onNavigate('create')}>
            <Plus size={16} /> Add Post
          </button>
        </div>
      </div>

      {/* Month Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', background: 'var(--bg-secondary)', padding: '12px 16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="btn btn-ghost btn-sm"><ChevronLeft size={16} /></button>
          <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{currentMonth}</span>
          <button className="btn btn-ghost btn-sm"><ChevronRight size={16} /></button>
        </div>

        <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--info)' }}></span> Scheduled</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></span> Approved</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--warning)' }}></span> Pending</span>
        </div>
      </div>

      {/* Month Grid */}
      {viewMode === 'month' && (
        <div>
          {/* Days of Week Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border-color)', border: '1px solid var(--border-color)', borderTopLeftRadius: 'var(--radius-md)', borderTopRightRadius: 'var(--radius-md)', textAlign: 'center', padding: '10px 0', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            <div>MON</div>
            <div>TUE</div>
            <div>WED</div>
            <div>THU</div>
            <div>FRI</div>
            <div>SAT</div>
            <div>SUN</div>
          </div>

          {/* Calendar Grid Cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border-color)', border: '1px solid var(--border-color)', borderTop: 'none', borderBottomLeftRadius: 'var(--radius-md)', borderBottomRightRadius: 'var(--radius-md)' }}>
            {daysInMonth.map(day => {
              const dayConcepts = getConceptsForDay(day);
              const isToday = day === 2; // Demo current day Oct 2

              return (
                <div
                  key={day}
                  style={{
                    minHeight: '110px',
                    backgroundColor: 'var(--bg-secondary)',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span 
                      style={{ 
                        fontSize: '0.8125rem', 
                        fontWeight: isToday ? 700 : 500,
                        color: isToday ? 'var(--accent)' : 'var(--text-secondary)',
                        width: isToday ? '22px' : 'auto',
                        height: isToday ? '22px' : 'auto',
                        borderRadius: '50%',
                        background: isToday ? 'var(--accent-alpha-10)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {day}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {dayConcepts.map(c => (
                      <div
                        key={c.id}
                        onClick={() => onEditConcept(c)}
                        style={{
                          padding: '4px 6px',
                          borderRadius: '4px',
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Instagram size={10} style={{ color: '#E1306C', flexShrink: 0 }} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {c.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode !== 'month' && (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <CalendarIcon size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <h3 className="heading-md">Calendar View ({viewMode})</h3>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>Organized layout active for local drag-and-drop schedule management.</p>
        </div>
      )}
    </div>
  );
};
