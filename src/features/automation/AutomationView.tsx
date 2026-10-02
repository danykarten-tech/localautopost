import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  ArrowDown, 
  CloudOff,
  Plus,
  Play,
  Pause,
  Square,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Activity,
  Globe,
  Monitor,
  KeyRound
} from 'lucide-react';
import { localDb } from '../../data/local/database';
import { automationService } from '../../domain/services/AutomationService';
import { automationOrchestrator, OrchestratorSummary } from '../../domain/services/AutomationOrchestrator';
import { localBrowserManager, LocalBrowserStatus } from '../../domain/services/browser/LocalBrowserManager';
import { chatGPTBrowserConnector, ChatGPTConnectorState } from '../../domain/services/browser/ChatGPTBrowserConnector';
import { instagramBrowserConnector, InstagramConnectorState } from '../../domain/services/browser/InstagramBrowserConnector';
import { automationReadinessGate, ReadinessEvaluation } from '../../domain/services/browser/AutomationReadinessGate';
import { AutomationRule, PublishJob, Concept } from '../../domain/models/types';

export const AutomationView: React.FC = () => {
  const [automation, setAutomation] = useState(localDb.getAutomation());
  const [rules, setRules] = useState<AutomationRule[]>(automationService.getRules());
  const [summary, setSummary] = useState<OrchestratorSummary>(automationOrchestrator.getOrchestratorSummary());

  const [browserStatus, setBrowserStatus] = useState<LocalBrowserStatus>(localBrowserManager.getStatus());
  const [cgState, setCgState] = useState<ChatGPTConnectorState>(chatGPTBrowserConnector.getState());
  const [instaState, setInstaState] = useState<InstagramConnectorState>(instagramBrowserConnector.getState());
  const [readiness, setReadiness] = useState<ReadinessEvaluation | null>(null);

  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleFreq, setNewRuleFreq] = useState('Daily');
  const [newRuleTime, setNewRuleTime] = useState('10:00 AM');
  const [newRuleAction, setNewRuleAction] = useState('Generate Content');
  const [showAddModal, setShowAddModal] = useState(false);
  const [runMessage, setRunMessage] = useState('');

  // Subscribe / Poll Orchestrator Status every second
  useEffect(() => {
    const timer = setInterval(async () => {
      setSummary(automationOrchestrator.getOrchestratorSummary());
      setBrowserStatus(localBrowserManager.getStatus());
      setCgState(chatGPTBrowserConnector.getState());
      setInstaState(instagramBrowserConnector.getState());

      const ev = await automationReadinessGate.evaluateGenerationReadiness().catch(() => null);
      setReadiness(ev);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const refreshSummary = async () => {
    setSummary(automationOrchestrator.getOrchestratorSummary());
    setBrowserStatus(localBrowserManager.getStatus());
    await chatGPTBrowserConnector.checkSession().catch(() => {});
    await instagramBrowserConnector.checkSession().catch(() => {});
    setCgState(chatGPTBrowserConnector.getState());
    setInstaState(instagramBrowserConnector.getState());
  };

  const handleLaunchBrowser = async () => {
    try {
      setRunMessage('Launching persistent local browser process...');
      await localBrowserManager.launch({ headless: false });
      setBrowserStatus(localBrowserManager.getStatus());
      await refreshSummary();
      setRunMessage('Local browser process launched cleanly.');
      setTimeout(() => setRunMessage(''), 3000);
    } catch (e: any) {
      alert(`Browser launch error: ${e.message}`);
    }
  };

  const handleRestartBrowser = async () => {
    try {
      setRunMessage('Restarting local browser process...');
      await localBrowserManager.restart();
      setBrowserStatus(localBrowserManager.getStatus());
      await refreshSummary();
      setRunMessage('Browser process restarted.');
      setTimeout(() => setRunMessage(''), 3000);
    } catch (e: any) {
      alert(`Restart error: ${e.message}`);
    }
  };

  const handleCloseBrowser = async () => {
    await localBrowserManager.close();
    setBrowserStatus(localBrowserManager.getStatus());
    await refreshSummary();
  };

  const handleOpenChatGPTLogin = async () => {
    await chatGPTBrowserConnector.openManualLogin();
    setCgState(chatGPTBrowserConnector.getState());
    setRunMessage('Opened ChatGPT in browser window. Please complete manual login.');
    setTimeout(() => setRunMessage(''), 4000);
  };

  const handleOpenInstagramLogin = async () => {
    await instagramBrowserConnector.openManualLogin();
    setInstaState(instagramBrowserConnector.getState());
    setRunMessage('Opened Instagram in browser window. Please complete manual login.');
    setTimeout(() => setRunMessage(''), 4000);
  };

  const handleToggleMaster = () => {
    const updated = !automation.isEnabled;
    localDb.updateAutomation({ isEnabled: updated });
    setAutomation(localDb.getAutomation());
    if (updated) {
      automationOrchestrator.startWorker();
    } else {
      automationOrchestrator.stopWorker();
    }
    refreshSummary();
  };

  const handlePauseOrchestrator = () => {
    automationOrchestrator.pauseWorker();
    refreshSummary();
  };

  const handleResumeOrchestrator = () => {
    automationOrchestrator.resumeWorker();
    refreshSummary();
  };

  const handleStopOrchestrator = () => {
    automationOrchestrator.stopWorker();
    refreshSummary();
  };

  const handleToggleTestMode = () => {
    const nextMode = !summary.isTestMode;
    automationOrchestrator.setTestMode(nextMode);
    refreshSummary();
  };

  const handleRetryJob = (jobId: string) => {
    try {
      automationOrchestrator.retryJob(jobId);
      setRunMessage(`Retrying publish job ${jobId}`);
      setTimeout(() => setRunMessage(''), 3000);
      refreshSummary();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleResolveActionRequired = (jobId: string) => {
    automationOrchestrator.resolveActionRequired(jobId);
    setRunMessage(`Resolved action required for ${jobId}. Resuming automation.`);
    setTimeout(() => setRunMessage(''), 3000);
    refreshSummary();
  };

  const handleToggleRule = (id: string, current: boolean) => {
    if (current) {
      automationService.disableRule(id);
    } else {
      automationService.enableRule(id);
    }
    setRules(automationService.getRules());
  };

  const handleDeleteRule = (id: string) => {
    automationService.deleteRule(id);
    setRules(automationService.getRules());
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;
    automationService.createRule(newRuleName, newRuleFreq, newRuleTime, newRuleAction);
    setRules(automationService.getRules());
    setNewRuleName('');
    setShowAddModal(false);
  };

  const handleRunNow = () => {
    const result = automationService.executeDueRules();
    setRunMessage(result.message);
    setTimeout(() => setRunMessage(''), 3000);
    refreshSummary();
  };

  const getConceptForJob = (job?: PublishJob): Concept | undefined => {
    if (!job) return undefined;
    return localDb.getConcepts().find(c => c.id === job.conceptId);
  };

  const workflowNodes = [
    { id: '1', title: 'Schedule Trigger', subtitle: '3x Weekly (Mon, Wed, Fri at 09:00 AM)', type: 'trigger' },
    { id: '2', title: 'Generate Concepts', subtitle: 'AI Session creates 5 hooks & angles', type: 'action' },
    { id: '3', title: 'Generate Captions & Media', subtitle: 'Applies Northstar Coffee voice rules', type: 'action' },
    { id: '4', title: 'Wait for Approval', subtitle: 'Safety Gate: Requires manual review in Approval Center', type: 'condition' },
    { id: '5', title: 'Prepare Local Schedule', subtitle: 'Places approved posts into local calendar queue', type: 'action' }
  ];

  const currentJobConcept = getConceptForJob(summary.currentJob);

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 className="heading-lg" style={{ fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={26} style={{ color: 'var(--accent)' }} /> Local Automation Orchestrator
          </h1>
          <p className="text-secondary" style={{ fontSize: '0.9375rem', marginTop: '4px' }}>
            Production local browser connection & session control workstation.
          </p>
        </div>

        {/* Runtime Control Buttons */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {summary.runtimeStatus === 'RUNNING' ? (
            <button className="btn btn-secondary" onClick={handlePauseOrchestrator}>
              <Pause size={15} /> Pause Automation
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleResumeOrchestrator}>
              <Play size={15} /> Resume Automation
            </button>
          )}

          <button className="btn btn-secondary" style={{ color: 'var(--error)' }} onClick={handleStopOrchestrator}>
            <Square size={15} /> Stop
          </button>

          <button 
            onClick={handleToggleTestMode}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              backgroundColor: summary.isTestMode ? 'var(--accent-alpha-10)' : 'rgba(53, 201, 139, 0.15)',
              color: summary.isTestMode ? 'var(--accent)' : 'var(--success)',
              border: `1px solid ${summary.isTestMode ? 'var(--accent-alpha-30)' : 'rgba(53, 201, 139, 0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ShieldCheck size={16} />
            {summary.isTestMode ? 'SAFE TEST MODE' : 'PRODUCTION MODE'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-secondary)', padding: '8px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Master Engine</span>
            <button
              onClick={handleToggleMaster}
              style={{
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: automation.isEnabled ? 'var(--success-bg)' : 'var(--bg-elevated)',
                color: automation.isEnabled ? 'var(--success)' : 'var(--text-muted)',
                border: `1px solid ${automation.isEnabled ? 'rgba(53, 201, 139, 0.3)' : 'var(--border-color)'}`,
                fontWeight: 600,
                fontSize: '0.75rem'
              }}
            >
              {automation.isEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {runMessage && (
        <div style={{ padding: '12px 16px', background: 'var(--success-bg)', border: '1px solid rgba(53, 201, 139, 0.3)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} /> {runMessage}
        </div>
      )}

      {/* REAL LOCAL CONNECTIONS CENTER PANEL */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--accent-alpha-20)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h2 className="heading-md" style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Monitor size={20} style={{ color: 'var(--accent)' }} /> Real Local Browser & Session Control Center
          </h2>
          <button className="btn btn-secondary btn-sm" onClick={refreshSummary}>
            <RefreshCw size={14} /> Refresh Sessions
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {/* 1. Local Browser Process */}
          <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>LOCAL BROWSER PROCESS</span>
              <span className={`badge ${browserStatus.isProcessRunning ? 'badge-success' : 'badge-error'}`}>
                {browserStatus.isProcessRunning ? 'RUNNING' : 'STOPPED'}
              </span>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Profile: <code style={{ fontSize: '0.75rem' }}>{browserStatus.profilePath.slice(-30)}</code>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Active Pages: <strong>{browserStatus.activePagesCount}</strong> • Health: <strong style={{ color: 'var(--success)' }}>{browserStatus.health}</strong>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {!browserStatus.isProcessRunning ? (
                <button className="btn btn-primary btn-sm" onClick={handleLaunchBrowser}>
                  Launch Browser
                </button>
              ) : (
                <>
                  <button className="btn btn-secondary btn-sm" onClick={handleRestartBrowser}>
                    Restart
                  </button>
                  <button className="btn btn-secondary btn-sm" style={{ color: 'var(--error)' }} onClick={handleCloseBrowser}>
                    Close
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 2. ChatGPT Real Session */}
          <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>CHATGPT REAL SESSION</span>
              <span className={`badge ${cgState.isReady ? 'badge-success' : cgState.requiresManualLogin ? 'badge-pending' : 'badge-error'}`}>
                {cgState.status}
              </span>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Session: <strong>{cgState.isReady ? 'Authenticated' : 'Login Required'}</strong>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '12px', lineClamp: 1, textOverflow: 'ellipsis', overflow: 'hidden' }}>
              URL: {cgState.currentUrl || 'Not opened'}
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="btn btn-primary btn-sm" onClick={handleOpenChatGPTLogin}>
                <KeyRound size={12} /> Open ChatGPT Login
              </button>
            </div>
          </div>

          {/* 3. Instagram Real Session */}
          <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>INSTAGRAM REAL SESSION</span>
              <span className={`badge ${instaState.isReady ? 'badge-success' : instaState.requiresManualLogin ? 'badge-pending' : 'badge-error'}`}>
                {instaState.status}
              </span>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Session: <strong>{instaState.isReady ? 'Authenticated' : 'Login Required'}</strong>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '12px', lineClamp: 1, textOverflow: 'ellipsis', overflow: 'hidden' }}>
              URL: {instaState.currentUrl || 'Not opened'}
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="btn btn-primary btn-sm" onClick={handleOpenInstagramLogin}>
                <KeyRound size={12} /> Open Instagram Login
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Orchestrator Runtime & Today Metrics Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '24px' }}>
        <div style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Automation Runtime</span>
          <div style={{ 
            fontSize: '0.9375rem', 
            fontWeight: 700, 
            marginTop: '6px', 
            color: summary.runtimeStatus === 'RUNNING' ? 'var(--success)' : summary.runtimeStatus === 'PAUSED' ? 'var(--warning)' : 'var(--error)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px' 
          }}>
            <span style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: summary.runtimeStatus === 'RUNNING' ? 'var(--success)' : summary.runtimeStatus === 'PAUSED' ? 'var(--warning)' : 'var(--error)' 
            }}></span> 
            {summary.runtimeStatus}
          </div>
        </div>

        <div style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Local Browser</span>
          <div style={{ fontSize: '0.9375rem', fontWeight: 700, marginTop: '6px', color: summary.browserStatus === 'Connected' ? 'var(--success)' : 'var(--warning)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: summary.browserStatus === 'Connected' ? 'var(--success)' : 'var(--warning)' }}></span> {summary.browserStatus.toUpperCase()}
          </div>
        </div>

        <div style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Instagram Session</span>
          <div style={{ fontSize: '0.9375rem', fontWeight: 700, marginTop: '6px', color: summary.instagramStatus === 'Authenticated' ? 'var(--success)' : 'var(--error)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: summary.instagramStatus === 'Authenticated' ? 'var(--success)' : 'var(--error)' }}></span> {summary.instagramStatus.toUpperCase()}
          </div>
        </div>

        <div style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Queue Size</span>
          <div style={{ fontSize: '0.9375rem', fontWeight: 700, marginTop: '6px', color: 'var(--accent)' }}>
            {summary.queueSize} JOBS WAITING
          </div>
        </div>

        <div style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Today's Posts</span>
          <div style={{ fontSize: '0.9375rem', fontWeight: 700, marginTop: '6px', color: 'var(--text-primary)' }}>
            {summary.todayStats.published} Published / {summary.todayStats.failed} Failed
          </div>
        </div>
      </div>

      {/* Middle Grid: Active Job & Next Queued Jobs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginBottom: '28px' }}>
        {/* Current Active Job Panel */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 className="heading-md" style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} style={{ color: 'var(--accent)' }} /> Active Publishing Worker Job
            </h2>
            {summary.currentJob ? (
              <span className="badge badge-success">{summary.currentJob.status}</span>
            ) : (
              <span className="badge" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>IDLE</span>
            )}
          </div>

          {summary.currentJob ? (
            <div style={{ display: 'flex', gap: '16px', background: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              {currentJobConcept?.visualUrl ? (
                <img 
                  src={currentJobConcept.visualUrl} 
                  alt="Current preview" 
                  style={{ width: '90px', height: '90px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--border-color)' }} 
                />
              ) : (
                <div style={{ width: '90px', height: '90px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  No Media
                </div>
              )}

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {currentJobConcept?.title || summary.currentJob.conceptId}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {summary.currentJob.caption}
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Attempt: <strong>{summary.currentJob.attempts}/{summary.currentJob.maxAttempts}</strong></span>
                  <span>Platform: <strong>{summary.currentJob.platform.toUpperCase()}</strong></span>
                  <span>Mode: <strong>{summary.currentJob.isTestMode ? 'Safe Test' : 'Production'}</strong></span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
              <Clock size={28} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
              <div>No active job currently executing. Worker will pull next eligible approved item.</div>
            </div>
          )}
        </div>

        {/* Next 5 Queued Jobs Panel */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 className="heading-md" style={{ fontSize: '1.1rem' }}>Next Queued Jobs ({summary.nextJobs.length})</h2>
            <button className="btn btn-ghost btn-sm" onClick={refreshSummary}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
            {summary.nextJobs.length > 0 ? (
              summary.nextJobs.map(job => {
                const c = getConceptForJob(job);
                return (
                  <div key={job.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{c?.title || job.conceptId}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Sched: {new Date(job.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Status: <strong style={{ color: 'var(--accent)' }}>{job.status}</strong>
                      </div>
                    </div>
                    {job.status === 'ACTION_REQUIRED' ? (
                      <button className="btn btn-primary btn-sm" onClick={() => handleResolveActionRequired(job.id)}>
                        Resolve
                      </button>
                    ) : (
                      <button className="btn btn-secondary btn-sm" onClick={() => handleRetryJob(job.id)}>
                        <RotateCcw size={12} /> Retry
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Queue empty. Approve concepts in Approval Center to auto-enqueue.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Log Feed */}
      <div className="card" style={{ padding: '20px', marginBottom: '28px' }}>
        <h2 className="heading-md" style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} style={{ color: 'var(--accent)' }} /> Structured Local Automation Event Log
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto', background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)', fontFamily: 'monospace', fontSize: '0.8125rem' }}>
          {summary.activityLogs.length > 0 ? (
            summary.activityLogs.map((log, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '12px', color: log.eventType.includes('FAILED') ? 'var(--error)' : log.eventType.includes('COMPLETED') || log.eventType.includes('VERIFIED') ? 'var(--success)' : 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                <span style={{ fontWeight: 700, width: '150px', flexShrink: 0, color: 'var(--accent)' }}>{log.eventType}</span>
                <span style={{ flex: 1 }}>{log.message}</span>
              </div>
            ))
          ) : (
            <div style={{ color: 'var(--text-muted)' }}>No local automation events recorded yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};
