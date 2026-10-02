import React from 'react';
import { 
  HelpCircle, 
  BookOpen, 
  Cpu, 
  Sparkles, 
  CheckCircle2, 
  Calendar, 
  Instagram, 
  Wrench, 
  Mail 
} from 'lucide-react';

export const HelpCenterView: React.FC = () => {
  const helpArticles = [
    {
      icon: BookOpen,
      title: 'Getting Started Guide',
      desc: 'Learn how to set up your workspace brand voice, content pillars, and local storage.'
    },
    {
      icon: Cpu,
      title: 'AI Session Connection',
      desc: 'Understand how local environment session connection keeps your private data secure.'
    },
    {
      icon: Sparkles,
      title: 'Batch Concept Generation',
      desc: 'Best practices for writing objectives and picking visual styles to create high-converting posts.'
    },
    {
      icon: CheckCircle2,
      title: 'Approval Center Workflow',
      desc: 'How to use keyboard shortcuts and bulk selection to approve 20+ concepts in seconds.'
    },
    {
      icon: Calendar,
      title: 'Local Scheduling & Calendar',
      desc: 'Managing drag-and-drop posting queues and maintaining consistent content cadence.'
    },
    {
      icon: Instagram,
      title: 'Instagram Integration Metadata',
      desc: 'Connecting profile metadata for visual layout previews and aspect ratio checks.'
    },
    {
      icon: Wrench,
      title: 'Troubleshooting Local Engine',
      desc: 'Resolving local environment disconnects or resetting workspace state.'
    }
  ];

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="heading-lg" style={{ fontSize: '1.75rem' }}>Help Center & Documentation</h1>
        <p className="text-secondary" style={{ fontSize: '0.9375rem', marginTop: '4px' }}>
          Find answers, best practices, and guides for mastering Avenzaq.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
        {helpArticles.map(art => {
          const Icon = art.icon;
          return (
            <div key={art.title} className="card card-interactive" style={{ padding: '20px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--accent-alpha-10)', border: '1px solid var(--accent-alpha-20)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', marginBottom: '14px' }}>
                <Icon size={18} />
              </div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>{art.title}</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{art.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Support Box */}
      <div className="card card-elevated" style={{ padding: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 className="heading-md" style={{ marginBottom: '4px' }}>Need direct help with your workstation?</h2>
          <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Our team is available to assist with local configuration and feature requests.</p>
        </div>
        <button className="btn btn-primary">
          <Mail size={16} /> Contact Support
        </button>
      </div>
    </div>
  );
};
