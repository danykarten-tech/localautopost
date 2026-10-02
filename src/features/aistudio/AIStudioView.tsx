import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Play, 
  Zap, 
  Terminal, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { localDb } from '../../data/local/database';
import { localBrowserSession } from '../../domain/services/LocalBrowserSession';
import { AIConnectionConfig } from '../../domain/models/types';

export const AIStudioView: React.FC = () => {
  const [aiConfig, setAiConfig] = useState<AIConnectionConfig>(localDb.getAIConnection());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; responseText?: string } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const unsubscribe = localBrowserSession.subscribe(config => {
      setAiConfig(config);
    });
    return unsubscribe;
  }, []);

  const handleSwitchMode = (mode: 'mock' | 'local_session') => {
    const updated = localBrowserSession.setProviderMode(mode);
    setAiConfig(updated);
  };

  const handleConnectSession = async () => {
    setIsConnecting(true);
    try {
      const updated = await localBrowserSession.connectSession();
      setAiConfig(updated);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectSession = async () => {
    const updated = await localBrowserSession.disconnectSession();
    setAiConfig(updated);
  };

  const handleTestSession = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await localBrowserSession.testSession();
      setTestResult(res);
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e.message || 'Local session test failed.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const isSessionConnected = aiConfig.status === 'connected' && aiConfig.sessionState !== 'DISCONNECTED';

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 className="heading-lg" style={{ fontSize: '1.75rem' }}>AI Session</h1>
          <p className="text-secondary" style={{ fontSize: '0.9375rem', marginTop: '4px' }}>
            Manage your local ChatGPT automation session and AI provider architecture.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span 
            className={`badge ${isSessionConnected ? 'badge-approved' : 'badge-draft'}`}
            style={{ padding: '6px 12px', fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Zap size={14} />
            {aiConfig.providerType === 'mock' 
              ? 'MOCK LOCAL AI (DEMO)' 
              : (isSessionConnected ? 'LOCAL CHATGPT CONNECTED' : 'CHATGPT SESSION OFFLINE')}
          </span>
        </div>
      </div>

      {/* Security Guarantee Banner */}
      <div style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <ShieldCheck size={24} style={{ color: 'var(--success)', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            100% Local-First Session Architecture — Zero API Keys
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Avenzaq connects directly to your local browser environment. We never ask for ChatGPT passwords, API credentials, or cloud subscriptions.
          </div>
        </div>
      </div>

      {/* Main Status & Control Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '28px' }}>
        {/* Main Status Card */}
        <div className="card card-elevated" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Operational Control Center
              </div>
              <h2 className="heading-md" style={{ marginTop: '2px' }}>
                {aiConfig.providerType === 'mock' ? 'MOCK LOCAL AI ENGINE' : 'LOCAL CHATGPT SESSION'}
              </h2>
            </div>

            {/* Provider Switcher Tabs */}
            <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-primary)', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <button
                onClick={() => handleSwitchMode('mock')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: aiConfig.providerType === 'mock' ? 'var(--accent)' : 'transparent',
                  color: aiConfig.providerType === 'mock' ? '#FFF' : 'var(--text-secondary)'
                }}
              >
                Mock Local AI
              </button>
              <button
                onClick={() => handleSwitchMode('local_session')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: aiConfig.providerType === 'local_session' ? 'var(--accent)' : 'transparent',
                  color: aiConfig.providerType === 'local_session' ? '#FFF' : 'var(--text-secondary)'
                }}
              >
                Local ChatGPT Session
              </button>
            </div>
          </div>

          {/* Operational Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
            <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Connection Status</span>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, marginTop: '4px', color: isSessionConnected ? 'var(--success)' : 'var(--warning)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isSessionConnected ? 'var(--success)' : 'var(--warning)' }}></span>
                {isSessionConnected ? 'Connected' : 'Not Connected'}
              </div>
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Browser Status</span>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, marginTop: '4px', color: 'var(--text-primary)' }}>
                {aiConfig.browserStatus || 'Detected'}
              </div>
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ChatGPT Session</span>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, marginTop: '4px', color: aiConfig.chatgptSession === 'Ready' ? 'var(--success)' : 'var(--text-muted)' }}>
                {aiConfig.chatgptSession || 'Not Ready'}
              </div>
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Automation Pipeline</span>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, marginTop: '4px', color: aiConfig.promptAutomation === 'Ready' ? 'var(--accent)' : 'var(--text-muted)' }}>
                {aiConfig.promptAutomation || 'Not Ready'}
              </div>
            </div>
          </div>

          {/* Detailed State Tracker */}
          <div style={{ padding: '12px 16px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Current Session State:</span>
            <span style={{ fontSize: '0.8125rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)' }}>
              {aiConfig.sessionState || 'DISCONNECTED'}
            </span>
          </div>

          {/* Action Control Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {!isSessionConnected ? (
              <button 
                className="btn btn-primary" 
                onClick={handleConnectSession} 
                disabled={isConnecting}
                style={{ flex: 1, height: '42px', fontSize: '0.875rem' }}
              >
                {isConnecting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                Connect Local Session
              </button>
            ) : (
              <button 
                className="btn btn-secondary" 
                onClick={handleDisconnectSession}
                style={{ flex: 1, height: '42px', fontSize: '0.875rem', color: 'var(--error)' }}
              >
                <XCircle size={16} /> Disconnect Session
              </button>
            )}

            <button 
              className="btn btn-secondary" 
              onClick={handleTestSession} 
              disabled={isTesting}
              style={{ flex: 1, height: '42px', fontSize: '0.875rem' }}
            >
              {isTesting ? <Loader2 size={16} className="animate-spin" /> : <Terminal size={16} />}
              Test AI Session
            </button>
          </div>

          {/* Test AI Result Banner */}
          {testResult && (
            <div 
              style={{ 
                marginTop: '20px', 
                padding: '14px 18px', 
                borderRadius: 'var(--radius-sm)', 
                background: testResult.success ? 'var(--success-bg)' : 'var(--error-bg)', 
                border: `1px solid ${testResult.success ? 'rgba(53, 201, 139, 0.3)' : 'rgba(240, 93, 108, 0.3)'}`,
                color: testResult.success ? 'var(--success)' : 'var(--error)',
                fontSize: '0.875rem'
              }}
            >
              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                {testResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                {testResult.success ? '✓ Local ChatGPT Session Test Passed' : '✕ Local Session Test Failed'}
              </div>
              <div>{testResult.message}</div>
              {testResult.responseText && (
                <div style={{ marginTop: '8px', fontSize: '0.75rem', fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: '4px' }}>
                  Response: {testResult.responseText}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Diagnostics Panel (Section 9) */}
        <div className="card card-elevated" style={{ padding: '24px', height: 'fit-content' }}>
          <h3 className="heading-sm" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={18} style={{ color: 'var(--accent)' }} /> Session Diagnostics
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span>Browser Detection</span>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>✓ Detected</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span>ChatGPT Page</span>
              <span style={{ color: isSessionConnected ? 'var(--success)' : 'var(--text-muted)', fontWeight: 600 }}>
                {isSessionConnected ? '✓ Detected' : '● Waiting'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span>User Session</span>
              <span style={{ color: isSessionConnected ? 'var(--success)' : 'var(--text-muted)', fontWeight: 600 }}>
                {isSessionConnected ? '✓ Ready' : '● Waiting'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span>Prompt Input</span>
              <span style={{ color: isSessionConnected ? 'var(--success)' : 'var(--text-muted)', fontWeight: 600 }}>
                {isSessionConnected ? '✓ Detected' : '● Waiting'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span>Response Capture</span>
              <span style={{ color: isSessionConnected ? 'var(--success)' : 'var(--text-muted)', fontWeight: 600 }}>
                {isSessionConnected ? '✓ Ready' : '● Waiting'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Local Automation</span>
              <span style={{ color: isSessionConnected ? 'var(--success)' : 'var(--text-muted)', fontWeight: 600 }}>
                {isSessionConnected ? '✓ Ready' : '● Waiting'}
              </span>
            </div>
          </div>

          <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div>Last Tested: <strong style={{ color: 'var(--text-primary)' }}>{aiConfig.lastTested || 'Never tested'}</strong></div>
            <div>Generated Today: <strong style={{ color: 'var(--text-primary)' }}>{aiConfig.conceptsGeneratedToday || 0} concepts</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};

