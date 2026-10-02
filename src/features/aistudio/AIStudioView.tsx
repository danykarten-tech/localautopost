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
  Loader2,
  Code
} from 'lucide-react';
import { localDb } from '../../data/local/database';
import { localBrowserSession } from '../../domain/services/LocalBrowserSession';
import { localChatGPTExecutor, DiagnosticsState, DiagnosticItemStatus } from '../../domain/services/LocalChatGPTExecutor';
import { AIConnectionConfig } from '../../domain/models/types';

export const AIStudioView: React.FC = () => {
  const [aiConfig, setAiConfig] = useState<AIConnectionConfig>(localDb.getAIConnection());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; capturedText?: string } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsState>(localChatGPTExecutor.getDiagnostics());
  const [isTestingImage, setIsTestingImage] = useState(false);
  const [imageTestResult, setImageTestResult] = useState<{ success: boolean; message: string; assetUrl?: string; filename?: string } | null>(null);

  const handleTestImageSession = async () => {
    setIsTestingImage(true);
    setImageTestResult(null);
    try {
      const res = await localChatGPTExecutor.runRealImageSessionTest();
      setImageTestResult({
        success: res.success,
        message: res.message,
        assetUrl: res.asset?.url,
        filename: res.asset?.filename
      });
      setAiConfig(localDb.getAIConnection());
    } catch (e: any) {
      setImageTestResult({
        success: false,
        message: e.message || 'Real image session test failed.'
      });
    } finally {
      setIsTestingImage(false);
    }
  };

  useEffect(() => {
    const unsubscribeConfig = localBrowserSession.subscribe(config => {
      setAiConfig(config);
    });
    const unsubscribeDiag = localChatGPTExecutor.subscribeDiagnostics(diag => {
      setDiagnostics(diag);
    });
    return () => {
      unsubscribeConfig();
      unsubscribeDiag();
    };
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
      const res = await localChatGPTExecutor.runRealSessionTest();
      setTestResult(res);
      setAiConfig(localDb.getAIConnection());
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

  const renderDiagnosticBadge = (status: DiagnosticItemStatus) => {
    switch (status) {
      case 'PASSED':
        return <span style={{ color: 'var(--success)', fontWeight: 600 }}>✓ PASSED</span>;
      case 'CHECKING':
        return <span style={{ color: 'var(--accent)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Loader2 size={12} className="animate-spin" /> CHECKING</span>;
      case 'FAILED':
        return <span style={{ color: 'var(--error)', fontWeight: 600 }}>✕ FAILED</span>;
      case 'NOT TESTED':
      default:
        return <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>NOT TESTED</span>;
    }
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 className="heading-lg" style={{ fontSize: '1.75rem' }}>AI Session Control Center</h1>
          <p className="text-secondary" style={{ fontSize: '0.9375rem', marginTop: '4px' }}>
            Manage your local ChatGPT automation session and AI provider architecture.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span 
            className={`badge ${aiConfig.lastTestSuccess && isSessionConnected ? 'badge-approved' : 'badge-draft'}`}
            style={{ padding: '6px 12px', fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Zap size={14} />
            {aiConfig.providerType === 'mock' 
              ? 'MOCK LOCAL AI (DEMO)' 
              : (aiConfig.lastTestSuccess && isSessionConnected 
                  ? 'REAL CHATGPT SESSION VERIFIED' 
                  : (isSessionConnected ? 'LOCAL CHATGPT CONNECTED' : 'CHATGPT SESSION OFFLINE'))}
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
              Test Text Generation
            </button>

            <button 
              className="btn btn-primary" 
              onClick={handleTestImageSession} 
              disabled={isTestingImage || !isSessionConnected}
              style={{ flex: 1, height: '42px', fontSize: '0.875rem' }}
            >
              {isTestingImage ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Test Real Image Gen
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
                {testResult.success ? 'REAL CHATGPT SESSION VERIFIED' : '✕ Real Session Test Failed'}
              </div>
              <div>{testResult.message}</div>
              {testResult.capturedText && (
                <div style={{ marginTop: '10px', fontSize: '0.75rem', fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '6px', color: '#E2E8F0', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', marginBottom: '4px', fontWeight: 600 }}>
                    <Code size={13} /> Captured Response Text:
                  </div>
                  {testResult.capturedText}
                </div>
              )}
            </div>
          )}

          {/* Test Real Image Result Banner */}
          {imageTestResult && (
            <div 
              style={{ 
                marginTop: '16px', 
                padding: '14px 18px', 
                borderRadius: 'var(--radius-sm)', 
                background: imageTestResult.success ? 'var(--success-bg)' : 'var(--error-bg)', 
                border: `1px solid ${imageTestResult.success ? 'rgba(53, 201, 139, 0.3)' : 'rgba(240, 93, 108, 0.3)'}`,
                color: imageTestResult.success ? 'var(--success)' : 'var(--error)',
                fontSize: '0.875rem'
              }}
            >
              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                {imageTestResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                {imageTestResult.success ? 'REAL CHATGPT IMAGE VERIFIED & DOWNLOADED' : '✕ Real Image Generation Failed'}
              </div>
              <div>{imageTestResult.message}</div>
              {imageTestResult.assetUrl && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '14px', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
                  <img src={imageTestResult.assetUrl} alt="Generated Test Asset" style={{ width: '64px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#FFF' }}>Filename: {imageTestResult.filename}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>✓ File verified & saved to Media Library</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Diagnostics Panel (Part 3 Requirements) */}
        <div className="card card-elevated" style={{ padding: '24px', height: 'fit-content' }}>
          <h3 className="heading-sm" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={18} style={{ color: 'var(--accent)' }} /> Session Diagnostics
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
              <span>Browser</span>
              {renderDiagnosticBadge(diagnostics.browser)}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
              <span>ChatGPT Page</span>
              {renderDiagnosticBadge(diagnostics.chatgptPage)}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
              <span>Authenticated Session</span>
              {renderDiagnosticBadge(diagnostics.authenticatedSession)}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
              <span>Composer</span>
              {renderDiagnosticBadge(diagnostics.composer)}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
              <span>Prompt Injection</span>
              {renderDiagnosticBadge(diagnostics.promptInjection)}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
              <span>Prompt Submission</span>
              {renderDiagnosticBadge(diagnostics.promptSubmission)}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
              <span>Response Detection</span>
              {renderDiagnosticBadge(diagnostics.responseDetection)}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
              <span>Response Capture</span>
              {renderDiagnosticBadge(diagnostics.responseCapture)}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>End-to-End Test</span>
              {renderDiagnosticBadge(diagnostics.endToEndTest)}
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

