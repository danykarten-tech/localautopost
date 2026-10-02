import React, { useState } from 'react';
import { 
  Zap, 
  ArrowDown, 
  CloudOff,
  Plus,
  Play,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { localDb } from '../../data/local/database';
import { automationService } from '../../domain/services/AutomationService';
import { AutomationRule } from '../../domain/models/types';

export const AutomationView: React.FC = () => {
  const [automation, setAutomation] = useState(localDb.getAutomation());
  const [rules, setRules] = useState<AutomationRule[]>(automationService.getRules());

  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleFreq, setNewRuleFreq] = useState('Daily');
  const [newRuleTime, setNewRuleTime] = useState('10:00 AM');
  const [newRuleAction, setNewRuleAction] = useState('Generate Content');
  const [showAddModal, setShowAddModal] = useState(false);
  const [runMessage, setRunMessage] = useState('');

  const handleToggleMaster = () => {
    const updated = !automation.isEnabled;
    localDb.updateAutomation({ isEnabled: updated });
    setAutomation(localDb.getAutomation());
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
  };

  const workflowNodes = [
    { id: '1', title: 'Schedule Trigger', subtitle: '3x Weekly (Mon, Wed, Fri at 09:00 AM)', type: 'trigger' },
    { id: '2', title: 'Generate Concepts', subtitle: 'AI Session creates 5 hooks & angles', type: 'action' },
    { id: '3', title: 'Generate Captions & Media', subtitle: 'Applies Northstar Coffee voice rules', type: 'action' },
    { id: '4', title: 'Wait for Approval', subtitle: 'Safety Gate: Requires manual review in Approval Center', type: 'condition' },
    { id: '5', title: 'Prepare Local Schedule', subtitle: 'Places approved posts into local calendar queue', type: 'action' }
  ];

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 className="heading-lg" style={{ fontSize: '1.75rem' }}>Local Automation</h1>
          <p className="text-secondary" style={{ fontSize: '0.9375rem', marginTop: '4px' }}>
            Configure visual local content workflows and execution rules.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={handleRunNow}>
            <Play size={15} /> Execute Active Rules
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-secondary)', padding: '10px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Automation Engine</span>
            <button
              onClick={handleToggleMaster}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: automation.isEnabled ? 'var(--success-bg)' : 'var(--bg-elevated)',
                color: automation.isEnabled ? 'var(--success)' : 'var(--text-muted)',
                border: `1px solid ${automation.isEnabled ? 'rgba(53, 201, 139, 0.3)' : 'var(--border-color)'}`,
                fontWeight: 600,
                fontSize: '0.8125rem'
              }}
            >
              {automation.isEnabled ? 'ENGINE ON' : 'ENGINE OFF'}
            </button>
          </div>
        </div>
      </div>

      {runMessage && (
        <div style={{ padding: '12px 16px', background: 'var(--success-bg)', border: '1px solid rgba(53, 201, 139, 0.3)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} /> {runMessage}
        </div>
      )}

      {/* Section 18 / 42 Local Limitation Notice */}
      <div 
        style={{
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--accent-alpha-10)',
          border: '1px solid var(--accent-alpha-20)',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <CloudOff size={22} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Local Automation Execution Mode
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {automation.localModeNotice} Automation rules trigger locally while your computer is on. Cloud workers are reserved for future cloud integration phases.
          </div>
        </div>
      </div>

      {/* Main Grid */}
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
