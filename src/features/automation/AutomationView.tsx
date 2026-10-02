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
  Activity
} from 'lucide-react';
import { localDb } from '../../data/local/database';
import { automationService } from '../../domain/services/AutomationService';
import { automationOrchestrator, OrchestratorSummary } from '../../domain/services/AutomationOrchestrator';
import { AutomationRule, PublishJob, Concept } from '../../domain/models/types';

export const AutomationView: React.FC = () => {
  const [automation, setAutomation] = useState(localDb.getAutomation());
  const [rules, setRules] = useState<AutomationRule[]>(automationService.getRules());
  const [summary, setSummary] = useState<OrchestratorSummary>(automationOrchestrator.getOrchestratorSummary());

  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleFreq, setNewRuleFreq] = useState('Daily');
  const [newRuleTime, setNewRuleTime] = useState('10:00 AM');
  const [newRuleAction, setNewRuleAction] = useState('Generate Content');
  const [showAddModal, setShowAddModal] = useState(false);
  const [runMessage, setRunMessage] = useState('');

  // Subscribe / Poll Orchestrator Status every second
  useEffect(() => {
    const timer = setInterval(() => {
      setSummary(automationOrchestrator.getOrchestratorSummary());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const refreshSummary = () => {
    setSummary(automationOrchestrator.getOrchestratorSummary());
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

  const handleStartOrchestrator = () => {
    automationOrchestrator.startWorker();
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

  // Helper to find concept metadata for a publish job
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
            Production local publishing worker managing approved social queues with zero remote APIs.
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

      {/* Local Mode Notice */}
      <div 
        style={{
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--accent-alpha-10)',
          border: '1px solid var(--accent-alpha-20)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <CloudOff size={22} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Local Browser Orchestration — Zero Meta/Instagram API Keys
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Continuous local worker ticks every 1.5s, acquires publishing lock, and publishes via local browser session while computer is running.
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

      {/* Main Grid: Visual Workflow & Local Rules Management */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
        {/* Active Workflow Nodes */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 className="heading-md" style={{ marginBottom: '20px', width: '100%' }}>Visual Workflow Pipeline</h2>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%', maxWidth: '440px' }}>
            {workflowNodes.map((node, index) => (
              <React.Fragment key={node.id}>
                <div
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-elevated)',
                    border: node.type === 'condition' ? '1px solid var(--warning)' : '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      STEP 0{index + 1} • {node.type}
                    </div>
                    {node.type === 'condition' && <span className="badge badge-pending">SAFETY GATE</span>}
                  </div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {node.title}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {node.subtitle}
                  </div>
                </div>

                {index < workflowNodes.length - 1 && (
                  <ArrowDown size={16} style={{ color: 'var(--accent)', margin: '2px 0' }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Local Rules Management */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="heading-md">Local Automation Rules ({rules.length})</h2>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
                <Plus size={14} /> Add Rule
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {rules.map(rule => (
                <div 
                  key={rule.id}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{rule.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {rule.frequency} at {rule.time} • Action: <strong style={{ color: 'var(--accent)' }}>{rule.action}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => handleToggleRule(rule.id, rule.isEnabled)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: rule.isEnabled ? 'var(--success-bg)' : 'var(--bg-primary)',
                        color: rule.isEnabled ? 'var(--success)' : 'var(--text-muted)',
                        border: `1px solid ${rule.isEnabled ? 'rgba(53, 201, 139, 0.3)' : 'var(--border-color)'}`
                      }}
                    >
                      {rule.isEnabled ? 'ON' : 'OFF'}
                    </button>

                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => handleDeleteRule(rule.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Rule Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-box" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <h3 className="heading-md" style={{ marginBottom: '16px' }}>Create Local Automation Rule</h3>
            <form onSubmit={handleAddRule} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Rule Name</label>
                <input
                  className="input-field"
                  value={newRuleName}
                  onChange={e => setNewRuleName(e.target.value)}
                  placeholder="e.g. Daily Content Generation"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Frequency</label>
                  <select className="input-field" value={newRuleFreq} onChange={e => setNewRuleFreq(e.target.value)}>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="3x per week">3x per week</option>
                    <option value="Realtime">Realtime</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Trigger Time</label>
                  <input className="input-field" value={newRuleTime} onChange={e => setNewRuleTime(e.target.value)} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Automation Action</label>
                <select className="input-field" value={newRuleAction} onChange={e => setNewRuleAction(e.target.value)}>
                  <option value="Generate Content">Generate Content</option>
                  <option value="Move to Scheduled">Move Approved to Scheduled</option>
                  <option value="Publish Queue">Publish Local Queue</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Rule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
