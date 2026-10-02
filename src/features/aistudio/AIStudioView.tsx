import React, { useState } from 'react';
import { 
  Cpu, 
  ShieldCheck, 
  Key,
  Layers,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { localDb } from '../../data/local/database';

export const AIStudioView: React.FC = () => {
  const [aiConfig, setAiConfig] = useState(localDb.getAIConnection());
  const [activeProviderType, setActiveProviderType] = useState<'mock' | 'local_session' | 'api'>(
    (aiConfig.providerType as any) || 'mock'
  );

  const handleSelectProvider = (type: 'mock' | 'local_session' | 'api') => {
    setActiveProviderType(type);
    localDb.updateAIConnection({
      providerType: type as any,
      providerName: type === 'mock' ? 'Mock Local AI Engine (Active)' : type === 'local_session' ? 'Local Session AI Provider' : 'API Key Provider'
    });
    setAiConfig(localDb.getAIConnection());
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 className="heading-lg" style={{ fontSize: '1.75rem' }}>AI Studio & Provider Architecture</h1>
          <p className="text-secondary" style={{ fontSize: '0.9375rem', marginTop: '4px' }}>
            Configure active generation providers, architectural boundaries, and session status.
          </p>
        </div>

        <span className="badge badge-approved" style={{ padding: '6px 12px', fontSize: '0.8125rem' }}>
          MOCK ENGINE ACTIVE
        </span>
      </div>

      {/* Security Guarantee (Section 38) */}
      <div style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <ShieldCheck size={26} style={{ color: 'var(--success)', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Zero Credential & Zero Paid API Requirement
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Avenzaq never requires or stores ChatGPT passwords, 2FA codes, or developer API keys. Generation runs fully locally via the Mock AI Provider.
          </div>
        </div>
      </div>

      {/* Provider Cards (Section 36) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        {/* Mock AI Provider */}
        <div 
          className="card card-interactive"
          onClick={() => handleSelectProvider('mock')}
          style={{
            border: activeProviderType === 'mock' ? '2px solid var(--accent)' : '1px solid var(--border-color)',
            padding: '20px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} style={{ color: 'var(--accent)' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Mock Local AI Engine</h3>
            </div>
            <span className="badge badge-published">ACTIVE (PHASE 3)</span>
          </div>

          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
            Dynamic, zero-latency local content generator supporting custom quantities (1-100), quality validation, and image prompt construction.
          </p>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
            <div>Quantities: <span style={{ color: 'var(--text-primary)' }}>1 – 100 concepts</span></div>
            <div>Latency: <span style={{ color: 'var(--success)' }}>Local Instant</span></div>
            <div>Status: <span style={{ color: 'var(--success)', fontWeight: 600 }}>Ready</span></div>
          </div>

          <button className={`btn ${activeProviderType === 'mock' ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '100%' }}>
            {activeProviderType === 'mock' ? 'Selected Provider' : 'Select Mock Provider'}
          </button>
        </div>

        {/* Local Session Provider (Phase 4 Boundary) */}
        <div 
          className="card card-interactive"
          style={{
            border: activeProviderType === 'local_session' ? '2px solid var(--accent)' : '1px solid var(--border-color)',
            padding: '20px',
            opacity: 0.85
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={20} style={{ color: 'var(--info)' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Local Session Provider</h3>
            </div>
            <span className="badge badge-pending">PHASE 4 BOUNDARY</span>
          </div>

          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
            Architectural boundary for future local browser session integration. No passwords or scraping executed in Phase 3.
          </p>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
            <div>Boundary Status: <span style={{ color: 'var(--warning)' }}>Prepared</span></div>
            <div>Phase: <span style={{ color: 'var(--text-secondary)' }}>Coming in Phase 4</span></div>
          </div>

          <button disabled className="btn btn-secondary" style={{ width: '100%', cursor: 'not-allowed' }}>
            Coming in Phase 4
          </button>
        </div>

        {/* API Provider */}
        <div className="card" style={{ padding: '20px', opacity: 0.6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key size={20} style={{ color: 'var(--text-muted)' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>API Provider</h3>
            </div>
            <span className="badge badge-draft">FUTURE</span>
          </div>

          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
            Reserved for user-controlled custom API key configurations in future phases.
          </p>

          <button disabled className="btn btn-secondary" style={{ width: '100%', cursor: 'not-allowed' }}>
            Future Option
          </button>
        </div>
      </div>
    </div>
  );
};
