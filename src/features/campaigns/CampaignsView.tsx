import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Plus, 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Image as ImageIcon, 
  Calendar, 
  Zap, 
  Clock, 
  AlertTriangle, 
  ChevronRight, 
  Filter, 
  ShieldCheck, 
  RefreshCw 
} from 'lucide-react';
import { localDb } from '../../data/local/database';
import { campaignEngine } from '../../domain/services/CampaignEngine';
import { automationOrchestrator } from '../../domain/services/AutomationOrchestrator';
import { 
  Campaign, 
  Concept, 
  PlatformType, 
  ContentObjective, 
  PublishJob 
} from '../../domain/models/types';

export const CampaignsView: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>(localDb.getCampaigns());
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [selectedConceptIds, setSelectedConceptIds] = useState<string[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');

  // New Campaign Form State
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignDesc, setNewCampaignDesc] = useState('');
  const [newCampaignPlatform, setNewCampaignPlatform] = useState<PlatformType>('instagram');
  const [newCampaignObjective, setNewCampaignObjective] = useState<ContentObjective>('Brand Awareness');
  const [newCampaignCount, setNewCampaignCount] = useState(10);
  const [newCampaignInterval, setNewCampaignInterval] = useState(24);

  // Poll database & orchestrator every 1s
  useEffect(() => {
    const list = localDb.getCampaigns();
    setCampaigns(list);
    if (!selectedCampaignId && list.length > 0) {
      setSelectedCampaignId(list[0].id);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCampaigns(localDb.getCampaigns());
      if (selectedCampaignId) {
        localDb.updateCampaignMetrics(selectedCampaignId);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedCampaignId]);

  const activeCampaign = campaigns.find(c => c.id === selectedCampaignId) || campaigns[0];

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName.trim()) return;

    setIsProcessing(true);
    setProgressMsg('Creating campaign...');

    try {
      const camp = campaignEngine.createCampaign({
        name: newCampaignName,
        description: newCampaignDesc,
        platform: newCampaignPlatform,
        objective: newCampaignObjective,
        targetConceptCount: newCampaignCount,
        postingIntervalHours: newCampaignInterval
      });

      setSelectedCampaignId(camp.id);
      setShowCreateModal(false);
      setNewCampaignName('');
      setNewCampaignDesc('');

      // Auto generate concepts for campaign
      setProgressMsg(`Generating ${camp.targetConceptCount} batch concepts...`);
      await campaignEngine.generateCampaignConcepts(camp.id);
      
      setCampaigns(localDb.getCampaigns());
      setProgressMsg('Batch concepts ready for human approval!');
      setTimeout(() => setProgressMsg(''), 3000);
    } catch (err: any) {
      alert(`Error creating campaign: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchApprove = async () => {
    if (!activeCampaign || selectedConceptIds.length === 0) return;
    setIsProcessing(true);
    setProgressMsg('Approving concepts...');

    try {
      await campaignEngine.approveCampaignConcepts(activeCampaign.id, selectedConceptIds);
      setSelectedConceptIds([]);
      setCampaigns(localDb.getCampaigns());
      setProgressMsg('Concepts approved!');
      setTimeout(() => setProgressMsg(''), 3000);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveAllValid = async () => {
    if (!activeCampaign) return;
    const concepts = localDb.getConcepts().filter(c => c.campaignId === activeCampaign.id || c.generationBatchId === activeCampaign.id);
    const pendingIds = concepts.filter(c => c.status === 'pending' || c.status === 'draft').map(c => c.id);

    if (pendingIds.length === 0) {
      alert('No pending concepts to approve.');
      return;
    }

    setIsProcessing(true);
    setProgressMsg(`Approving all ${pendingIds.length} pending concepts...`);
    try {
      await campaignEngine.approveCampaignConcepts(activeCampaign.id, pendingIds);
      setCampaigns(localDb.getCampaigns());
      setProgressMsg('All pending concepts approved!');
      setTimeout(() => setProgressMsg(''), 3000);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchReject = () => {
    if (!activeCampaign || selectedConceptIds.length === 0) return;
    campaignEngine.rejectCampaignConcepts(activeCampaign.id, selectedConceptIds);
    setSelectedConceptIds([]);
    setCampaigns(localDb.getCampaigns());
  };

  const handleRunFullBatchWorkflow = async () => {
    if (!activeCampaign) return;

    const concepts = localDb.getConcepts().filter(c => c.campaignId === activeCampaign.id || c.generationBatchId === activeCampaign.id);
    const approvedOrPending = concepts.filter(c => c.status === 'approved' || c.status === 'pending' || c.status === 'draft');
    
    if (approvedOrPending.length === 0) {
      alert('No valid concepts found to automate.');
      return;
    }

    setIsProcessing(true);
    const targetIds = approvedOrPending.map(c => c.id);

    try {
      setProgressMsg('Executing Batch Workflow: Approving & generating image assets...');
      await campaignEngine.executeBatchCampaignWorkflow(activeCampaign.id, targetIds, { isTestMode: true });

      setCampaigns(localDb.getCampaigns());
      setProgressMsg('Campaign Automation Pipeline Started! Jobs enqueued in Local Orchestrator.');
      setTimeout(() => setProgressMsg(''), 4000);
    } catch (err: any) {
      alert(`Workflow Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePauseCampaign = () => {
    if (!activeCampaign) return;
    campaignEngine.pauseCampaign(activeCampaign.id);
    setCampaigns(localDb.getCampaigns());
  };

  const handleResumeCampaign = () => {
    if (!activeCampaign) return;
    campaignEngine.resumeCampaign(activeCampaign.id);
    setCampaigns(localDb.getCampaigns());
  };

  const handleCancelCampaign = () => {
    if (!activeCampaign) return;
    if (confirm(`Are you sure you want to cancel campaign "${activeCampaign.name}"?`)) {
      campaignEngine.cancelCampaign(activeCampaign.id);
      setCampaigns(localDb.getCampaigns());
    }
  };

  const handleRetryFailed = () => {
    if (!activeCampaign) return;
    campaignEngine.retryCampaignFailures(activeCampaign.id);
    setCampaigns(localDb.getCampaigns());
  };

  // Concept Selection Helpers
  const campaignConcepts = activeCampaign 
    ? localDb.getConcepts().filter(c => c.campaignId === activeCampaign.id || c.generationBatchId === activeCampaign.id)
    : [];

  const filteredConcepts = campaignConcepts.filter(c => {
    if (filterTab === 'pending') return c.status === 'pending' || c.status === 'draft';
    if (filterTab === 'approved') return c.status === 'approved' || c.status === 'scheduled' || c.status === 'published';
    if (filterTab === 'rejected') return c.status === 'rejected';
    return true;
  });

  const toggleSelectAll = () => {
    if (selectedConceptIds.length === filteredConcepts.length) {
      setSelectedConceptIds([]);
    } else {
      setSelectedConceptIds(filteredConcepts.map(c => c.id));
    }
  };

  const toggleSelectConcept = (id: string) => {
    setSelectedConceptIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const orchestratorSummary = automationOrchestrator.getOrchestratorSummary();

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 className="heading-lg" style={{ fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={26} style={{ color: 'var(--accent)' }} /> Batch Campaign Automation Workstation
          </h1>
          <p className="text-secondary" style={{ fontSize: '0.9375rem', marginTop: '4px' }}>
            Local end-to-end campaign orchestrator: Create $\rightarrow$ Approve $\rightarrow$ Automate $\rightarrow$ Monitor.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Campaign Selection Dropdown */}
          {campaigns.length > 0 && (
            <select
              className="input-field"
              style={{ width: '220px', fontWeight: 600 }}
              value={selectedCampaignId}
              onChange={e => setSelectedCampaignId(e.target.value)}
            >
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.status})
                </option>
              ))}
            </select>
          )}

          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> New Campaign
          </button>
        </div>
      </div>

      {progressMsg && (
        <div style={{ padding: '12px 16px', background: 'var(--accent-alpha-10)', border: '1px solid var(--accent-alpha-30)', color: 'var(--accent)', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} /> {progressMsg}
        </div>
      )}

      {activeCampaign ? (
        <>
          {/* Campaign Header Details & Batch Control Bar */}
          <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 className="heading-md" style={{ fontSize: '1.3rem' }}>{activeCampaign.name}</h2>
                  <span className={`badge ${activeCampaign.status === 'RUNNING' ? 'badge-success' : activeCampaign.status === 'PAUSED' ? 'badge-pending' : 'badge-primary'}`}>
                    {activeCampaign.status}
                  </span>
                  <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                    {activeCampaign.platform.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {activeCampaign.description || 'Automated multi-concept social content campaign.'}
                </div>
              </div>

              {/* Batch Controls */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {activeCampaign.status === 'RUNNING' ? (
                  <button className="btn btn-secondary" onClick={handlePauseCampaign}>
                    <Pause size={14} /> Pause Campaign
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={handleResumeCampaign}>
                    <Play size={14} /> Resume Campaign
                  </button>
                )}

                <button className="btn btn-primary" style={{ backgroundColor: 'var(--accent)' }} onClick={handleRunFullBatchWorkflow} disabled={isProcessing}>
                  <Zap size={14} /> Run Full Batch Workflow
                </button>

                <button className="btn btn-secondary" style={{ color: 'var(--error)' }} onClick={handleCancelCampaign}>
                  <Square size={14} /> Cancel
                </button>
              </div>
            </div>

            {/* Campaign Summary Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Concepts</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '4px', color: 'var(--text-primary)' }}>
                  {campaignConcepts.length} / {activeCampaign.targetConceptCount}
                </div>
              </div>

              <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Approved</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '4px', color: 'var(--success)' }}>
                  {activeCampaign.approvedConceptCount} / {campaignConcepts.length}
                </div>
              </div>

              <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Image Assets</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '4px', color: 'var(--accent)' }}>
                  {activeCampaign.generatedAssetCount} / {activeCampaign.approvedConceptCount || campaignConcepts.length}
                </div>
              </div>

              <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Scheduled</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '4px', color: 'var(--warning)' }}>
                  {activeCampaign.scheduledPostCount} Posts
                </div>
              </div>

              <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Published</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '4px', color: 'var(--success)' }}>
                  {activeCampaign.publishedPostCount} Posts
                </div>
              </div>

              <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Action Req. / Fail</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '4px', color: activeCampaign.failedPostCount > 0 ? 'var(--error)' : 'var(--text-muted)' }}>
                  {activeCampaign.failedPostCount}
                </div>
              </div>
            </div>
          </div>

          {/* Live Automation Worker Status Card */}
          <div className="card" style={{ padding: '18px 20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--accent-alpha-20)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--accent-alpha-10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                <Zap size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Local Automation Orchestrator Worker: {orchestratorSummary.runtimeStatus}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Mode: {orchestratorSummary.isTestMode ? 'SAFE TEST MODE' : 'PRODUCTION'} • Queue: {orchestratorSummary.queueSize} items waiting • Browser: {orchestratorSummary.browserStatus}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary btn-sm" onClick={handleApproveAllValid}>
                <CheckCircle2 size={14} /> Approve All Pending
              </button>
              {activeCampaign.failedPostCount > 0 && (
                <button className="btn btn-secondary btn-sm" style={{ color: 'var(--error)' }} onClick={handleRetryFailed}>
                  <RotateCcw size={14} /> Retry Failed Jobs
                </button>
              )}
            </div>
          </div>

          {/* Batch Concept Management Section */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setFilterTab('all')}
                  className={`btn btn-sm ${filterTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  All Concepts ({campaignConcepts.length})
                </button>
                <button
                  onClick={() => setFilterTab('pending')}
                  className={`btn btn-sm ${filterTab === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Pending Review ({campaignConcepts.filter(c => c.status === 'pending' || c.status === 'draft').length})
                </button>
                <button
                  onClick={() => setFilterTab('approved')}
                  className={`btn btn-sm ${filterTab === 'approved' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Approved ({campaignConcepts.filter(c => c.status === 'approved' || c.status === 'scheduled' || c.status === 'published').length})
                </button>
                <button
                  onClick={() => setFilterTab('rejected')}
                  className={`btn btn-sm ${filterTab === 'rejected' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Rejected ({campaignConcepts.filter(c => c.status === 'rejected').length})
                </button>
              </div>

              {/* Bulk Action Controls */}
              {selectedConceptIds.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--accent-alpha-10)', padding: '6px 12px', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent)' }}>
                    {selectedConceptIds.length} Selected
                  </span>
                  <button className="btn btn-primary btn-sm" onClick={handleBatchApprove}>
                    <CheckCircle2 size={13} /> Approve Selected
                  </button>
                  <button className="btn btn-secondary btn-sm" style={{ color: 'var(--error)' }} onClick={handleBatchReject}>
                    <XCircle size={13} /> Reject Selected
                  </button>
                </div>
              )}
            </div>

            {/* Concepts Grid / List */}
            {filteredConcepts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredConcepts.map((concept, index) => (
                  <div 
                    key={concept.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-elevated)',
                      border: selectedConceptIds.includes(concept.id) ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px'
                    }}
                  >
                    <input 
                      type="checkbox"
                      checked={selectedConceptIds.includes(concept.id)}
                      onChange={() => toggleSelectConcept(concept.id)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />

                    {/* Media Thumbnail */}
                    {concept.visualUrl ? (
                      <img 
                        src={concept.visualUrl} 
                        alt="Media preview" 
                        style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--border-color)', flexShrink: 0 }} 
                      />
                    ) : (
                      <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.7rem', flexShrink: 0 }}>
                        <ImageIcon size={18} />
                      </div>
                    )}

                    {/* Concept Content details */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>#{index + 1}</span>
                        <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{concept.title}</h4>
                        <span className={`badge ${concept.status === 'approved' || concept.status === 'published' ? 'badge-success' : concept.status === 'rejected' ? 'badge-error' : 'badge-pending'}`}>
                          {concept.status.toUpperCase()}
                        </span>
                        {concept.qualityScore && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)' }}>
                            Score: {concept.qualityScore}%
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px', lineClamp: 1, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {concept.hook}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {concept.status !== 'approved' && concept.status !== 'published' && (
                        <button 
                          className="btn btn-secondary btn-sm" 
                          style={{ color: 'var(--success)' }}
                          onClick={async () => {
                            await campaignEngine.approveCampaignConcepts(activeCampaign.id, [concept.id]);
                            setCampaigns(localDb.getCampaigns());
                          }}
                        >
                          <CheckCircle2 size={13} /> Approve
                        </button>
                      )}
                      {concept.status !== 'rejected' && concept.status !== 'published' && (
                        <button 
                          className="btn btn-ghost btn-sm" 
                          style={{ color: 'var(--error)' }}
                          onClick={() => {
                            campaignEngine.rejectCampaignConcepts(activeCampaign.id, [concept.id]);
                            setCampaigns(localDb.getCampaigns());
                          }}
                        >
                          <XCircle size={13} /> Reject
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                No concepts found for current filter.
              </div>
            )}
          </div>
        </>
      ) : (
        <div style={{ padding: '60px', textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
          <Layers size={48} style={{ color: 'var(--accent)', margin: '0 auto 16px auto', opacity: 0.8 }} />
          <h2 className="heading-md">No Active Campaigns</h2>
          <p className="text-secondary" style={{ marginTop: '8px', maxWidth: '440px', margin: '8px auto 20px auto' }}>
            Create your first batch campaign to generate, approve, and automate content publish queues.
          </p>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> Create First Campaign
          </button>
        </div>
      )}

      {/* New Campaign Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-box" style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
            <h3 className="heading-md" style={{ marginBottom: '16px' }}>Create Batch Automation Campaign</h3>
            <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Campaign Name</label>
                <input
                  className="input-field"
                  value={newCampaignName}
                  onChange={e => setNewCampaignName(e.target.value)}
                  placeholder="e.g. October Toyota Service Campaign"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Campaign Objective & Description</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={newCampaignDesc}
                  onChange={e => setNewCampaignDesc(e.target.value)}
                  placeholder="Describe target goals, special offers, key messaging pillars..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Target Platform</label>
                  <select className="input-field" value={newCampaignPlatform} onChange={e => setNewCampaignPlatform(e.target.value as PlatformType)}>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="twitter">Twitter / X</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Content Quantity</label>
                  <select className="input-field" value={newCampaignCount} onChange={e => setNewCampaignCount(parseInt(e.target.value, 10))}>
                    <option value={5}>5 Concepts</option>
                    <option value={10}>10 Concepts</option>
                    <option value={20}>20 Concepts</option>
                    <option value={30}>30 Concepts</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Posting Interval (Hours Between Posts)</label>
                <select className="input-field" value={newCampaignInterval} onChange={e => setNewCampaignInterval(parseInt(e.target.value, 10))}>
                  <option value={4}>4 Hours (6 posts / day)</option>
                  <option value={12}>12 Hours (2 posts / day)</option>
                  <option value={24}>24 Hours (1 post / day)</option>
                  <option value={48}>48 Hours (1 post / 2 days)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isProcessing}>
                  {isProcessing ? 'Generating...' : 'Create & Generate Concepts'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
