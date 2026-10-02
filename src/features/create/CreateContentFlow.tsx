import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Edit3, 
  Instagram, 
  Loader2,
  ArrowRight,
  Minus,
  Plus,
  AlertTriangle,
  Layers,
  Play
} from 'lucide-react';
import { localDb } from '../../data/local/database';
import { contentEngine, MAX_SAFE_QUANTITY, GenerationProgressPayload } from '../../domain/services/ContentEngine';
import { localBrowserSession } from '../../domain/services/LocalBrowserSession';
import { Concept, ContentObjective, ContentStyle, GenerationBatch } from '../../domain/models/types';

interface CreateContentFlowProps {
  onEditConcept: (concept: Concept) => void;
  onNavigate: (route: string) => void;
}

export const CreateContentFlow: React.FC<CreateContentFlowProps> = ({ 
  onEditConcept,
  onNavigate 
}) => {
  const [topic, setTopic] = useState('Specialty Coffee');
  const [objective, setObjective] = useState<ContentObjective>('Educational');
  const [style, setStyle] = useState<ContentStyle>('Minimal');
  const [tone, setTone] = useState('Artisanal & Intelligent');
  const [instructions, setInstructions] = useState('');

  // Flexible Quantity System State (Section 02 & 03)
  const [quantity, setQuantity] = useState<number>(() => localDb.getLastUsedQuantity());
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customInputValue, setCustomInputValue] = useState<string>('37');

  // Generation & Engine State
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressState, setProgressState] = useState<GenerationProgressPayload | null>(null);
  const [activeBatch, setActiveBatch] = useState<GenerationBatch | null>(null);
  const [generatedConcepts, setGeneratedConcepts] = useState<Concept[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // "Generate More" state
  const [showGenerateMore, setShowGenerateMore] = useState(false);
  const [additionalQty, setAdditionalQty] = useState(5);

  useEffect(() => {
    localDb.setLastUsedQuantity(quantity);
  }, [quantity]);

  const handleDecrement = () => {
    setQuantity(prev => Math.max(1, prev - 1));
    setIsCustomMode(false);
  };

  const handleIncrement = () => {
    setQuantity(prev => Math.min(MAX_SAFE_QUANTITY, prev + 1));
    setIsCustomMode(false);
  };

  const handlePresetSelect = (preset: number | 'Custom') => {
    if (preset === 'Custom') {
      setIsCustomMode(true);
      const val = parseInt(customInputValue, 10) || 10;
      setQuantity(Math.min(MAX_SAFE_QUANTITY, Math.max(1, val)));
    } else {
      setIsCustomMode(false);
      setQuantity(preset);
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setCustomInputValue(valStr);
    const parsed = parseInt(valStr, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      if (parsed > MAX_SAFE_QUANTITY) {
        setErrorMessage(`Large generations are limited to ${MAX_SAFE_QUANTITY} concepts per request.`);
      } else {
        setErrorMessage('');
      }
      setQuantity(Math.min(MAX_SAFE_QUANTITY, Math.max(1, parsed)));
    }
  };

  const handleGenerate = async (targetQty?: number) => {
    const qtyToGenerate = targetQty || quantity;
    if (qtyToGenerate > MAX_SAFE_QUANTITY) {
      setErrorMessage(`Large generations are limited to ${MAX_SAFE_QUANTITY} concepts per request.`);
      return;
    }

    setErrorMessage('');
    setIsGenerating(true);
    setProgressState(null);

    try {
      const { batch, concepts } = await contentEngine.startGenerationBatch(
        {
          id: `req_${Date.now()}`,
          workspaceId: localDb.getWorkspace().id,
          platform: 'instagram',
          objective,
          topic,
          quantity: qtyToGenerate,
          tone,
          style,
          additionalInstructions: instructions,
          createdAt: new Date().toISOString()
        },
        payload => setProgressState(payload)
      );

      setActiveBatch(batch);
      setGeneratedConcepts(concepts);
    } catch (err: any) {
      setErrorMessage(err.message || 'Generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancel = () => {
    if (activeBatch) {
      contentEngine.cancelGeneration(activeBatch.id);
    }
  };

  const handleGenerateMore = async () => {
    if (!activeBatch) return;
    setIsGenerating(true);
    setShowGenerateMore(false);
    try {
      const extraConcepts = await contentEngine.generateMoreConcepts(
        activeBatch.id,
        additionalQty,
        payload => setProgressState(payload)
      );
      setGeneratedConcepts(prev => [...prev, ...extraConcepts]);
      const updatedBatch = localDb.getGenerationBatch(activeBatch.id);
      if (updatedBatch) setActiveBatch(updatedBatch);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate additional concepts.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === generatedConcepts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(generatedConcepts.map(c => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkApprove = () => {
    localDb.bulkUpdateStatus(selectedIds, 'approved');
    setGeneratedConcepts(prev => prev.map(c => selectedIds.includes(c.id) ? { ...c, status: 'approved' } : c));
    setSelectedIds([]);
  };

  const handleBulkReject = () => {
    localDb.bulkUpdateStatus(selectedIds, 'rejected');
    setGeneratedConcepts(prev => prev.map(c => selectedIds.includes(c.id) ? { ...c, status: 'rejected' } : c));
    setSelectedIds([]);
  };

  const handleSingleApprove = (id: string) => {
    localDb.updateConceptStatus(id, 'approved');
    setGeneratedConcepts(prev => prev.map(c => c.id === id ? { ...c, status: 'approved' } : c));
  };

  const handleSingleReject = (id: string) => {
    localDb.updateConceptStatus(id, 'rejected');
    setGeneratedConcepts(prev => prev.map(c => c.id === id ? { ...c, status: 'rejected' } : c));
  };

  const objectivesList: ContentObjective[] = [
    'Product Promotion',
    'Educational',
    'Engagement',
    'Brand Awareness',
    'Storytelling',
    'Seasonal',
    'Offer',
    'Custom'
  ];

  const stylesList: ContentStyle[] = [
    'Minimal',
    'Editorial',
    'Bold',
    'Premium',
    'Lifestyle',
    'Educational',
    'Custom'
  ];

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="heading-lg" style={{ fontSize: '1.75rem' }}>Create Content Engine</h1>
        <p className="text-secondary" style={{ fontSize: '0.9375rem', marginTop: '4px' }}>
          Configure content parameters, choose exact batch quantities, and generate concepts on autopilot.
        </p>
      </div>

      {errorMessage && (
        <div style={{ padding: '16px 20px', background: 'var(--error-bg)', border: '1px solid rgba(240, 93, 108, 0.3)', color: 'var(--error)', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            <AlertTriangle size={18} /> {errorMessage}
          </div>
          {errorMessage.toLowerCase().includes('disconnected') && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button 
                className="btn btn-primary btn-sm"
                onClick={async () => {
                  await localBrowserSession.connectSession();
                  setErrorMessage('');
                  handleGenerate();
                }}
              >
                Reconnect Session & Retry
              </button>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => setErrorMessage('')}
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Creation Flow Form */}
      {!isGenerating && generatedConcepts.length === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Main Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Step 01: Topic */}
            <div className="card">
              <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent)', color: '#FFF', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
                <span>Topic & Brand Guidance</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Content Topic</label>
                  <input
                    className="input-field"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="e.g. Specialty Coffee, Cold Brew Science"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Brand Tone</label>
                    <input className="input-field" value={tone} onChange={e => setTone(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Additional Instructions</label>
                    <input className="input-field" value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="e.g. Emphasize home barista tips" />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 02: Objective */}
            <div className="card">
              <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent)', color: '#FFF', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
                <span>Content Objective</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {objectivesList.map(obj => (
                  <button
                    key={obj}
                    onClick={() => setObjective(obj)}
                    style={{
                      padding: '10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: objective === obj ? 'var(--accent-alpha-10)' : 'var(--bg-elevated)',
                      border: `1px solid ${objective === obj ? 'var(--accent)' : 'var(--border-color)'}`,
                      color: objective === obj ? 'var(--accent)' : 'var(--text-primary)',
                      fontSize: '0.8125rem',
                      fontWeight: objective === obj ? 600 : 500
                    }}
                  >
                    {obj}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 03: FLEXIBLE CONTENT QUANTITY SYSTEM (Section 02 & 03) */}
            <div className="card">
              <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent)', color: '#FFF', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
                <span>How many concepts do you want to create?</span>
              </div>
              <p className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '16px' }}>Select a preset or enter any custom batch size up to {MAX_SAFE_QUANTITY}.</p>

              {/* Incremental Counter Control: [-] 10 [+] */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px', justifyContent: 'center', background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <button
                  className="btn btn-secondary"
                  onClick={handleDecrement}
                  style={{ width: '38px', height: '38px', padding: 0, borderRadius: '50%' }}
                >
                  <Minus size={18} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isCustomMode ? (
                    <input
                      type="number"
                      min={1}
                      max={MAX_SAFE_QUANTITY}
                      value={customInputValue}
                      onChange={handleCustomInputChange}
                      style={{
                        width: '90px',
                        height: '42px',
                        textAlign: 'center',
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: 'var(--accent)',
                        background: 'var(--bg-primary)',
                        border: '2px solid var(--accent)',
                        borderRadius: 'var(--radius-sm)'
                      }}
                      autoFocus
                    />
                  ) : (
                    <span style={{ fontSize: '1.75rem', fontWeight: 700, minWidth: '60px', textAlign: 'center', color: 'var(--text-primary)' }}>
                      {quantity}
                    </span>
                  )}
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Concepts</span>
                </div>

                <button
                  className="btn btn-secondary"
                  onClick={handleIncrement}
                  style={{ width: '38px', height: '38px', padding: 0, borderRadius: '50%' }}
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* Quick Preset Selector Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {[2, 5, 10, 20, 50].map(preset => (
                  <button
                    key={preset}
                    onClick={() => handlePresetSelect(preset)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: !isCustomMode && quantity === preset ? 'var(--accent-alpha-10)' : 'var(--bg-primary)',
                      border: `1px solid ${!isCustomMode && quantity === preset ? 'var(--accent)' : 'var(--border-color)'}`,
                      color: !isCustomMode && quantity === preset ? 'var(--accent)' : 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: '0.8125rem'
                    }}
                  >
                    {preset}
                  </button>
                ))}
                <button
                  onClick={() => handlePresetSelect('Custom')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isCustomMode ? 'var(--accent-alpha-10)' : 'var(--bg-primary)',
                    border: `1px solid ${isCustomMode ? 'var(--accent)' : 'var(--border-color)'}`,
                    color: isCustomMode ? 'var(--accent)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.8125rem'
                  }}
                >
                  Custom
                </button>
              </div>

              {/* Large Batch Warning (Section 44) */}
              {quantity >= 50 && (
                <div style={{ marginTop: '14px', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--warning-bg)', border: '1px solid rgba(244, 183, 64, 0.3)', color: 'var(--warning)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={14} />
                  <span>Large batches ({quantity} concepts) are processed in chunks of 10 to keep your workstation fast.</span>
                </div>
              )}
            </div>

            {/* Step 04: Visual Style */}
            <div className="card">
              <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent)', color: '#FFF', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>4</span>
                <span>Visual Direction & Style</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {stylesList.map(st => (
                  <button
                    key={st}
                    onClick={() => setStyle(st)}
                    style={{
                      padding: '10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: style === st ? 'var(--accent-alpha-10)' : 'var(--bg-elevated)',
                      border: `1px solid ${style === st ? 'var(--accent)' : 'var(--border-color)'}`,
                      color: style === st ? 'var(--accent)' : 'var(--text-primary)',
                      fontSize: '0.8125rem',
                      fontWeight: style === st ? 600 : 500
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* DYNAMIC GENERATION CTA BUTTON (Section 04) */}
            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%', height: '48px', fontSize: '1.0625rem', fontWeight: 600 }}
              onClick={() => handleGenerate()}
            >
              <Sparkles size={20} /> Generate {quantity} Concepts
            </button>
          </div>

          {/* Right Summary Card (Section 04) */}
          <div className="card card-elevated" style={{ height: 'fit-content' }}>
            <h3 className="heading-sm" style={{ marginBottom: '14px' }}>Generation Summary</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Target Platform:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Instagram</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Objective:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{objective}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Topic:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{topic}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Style:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{style}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Requested Batch:</span>
                <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.9375rem' }}>{quantity} Concepts</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>AI Provider:</span>
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                  {localDb.getAIConnection().providerType === 'local_session' ? 'Local ChatGPT Session' : 'Mock Local Engine (MOCK)'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Provider Status:</span>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                  {localDb.getAIConnection().providerType === 'local_session' 
                    ? (localDb.getAIConnection().status === 'connected' ? 'CONNECTED (REAL SESSION)' : 'OFFLINE')
                    : 'READY (MOCK)'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Brand Kit Context:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Active</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Quality Validator:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Local Quality Validation</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress & Processing UI (Section 10 & 40 & Part 7 Real Steps) */}
      {isGenerating && (
        <div className="card-elevated" style={{ padding: '48px 40px', textAlign: 'center', maxWidth: '640px', margin: '40px auto' }}>
          <Loader2 size={42} className="animate-spin" style={{ color: 'var(--accent)', margin: '0 auto 20px' }} />
          <h2 className="heading-md" style={{ marginBottom: '8px' }}>Generating {quantity} content concepts...</h2>
          
          {progressState && (
            <div style={{ width: '100%', marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <span>Status: <strong style={{ color: 'var(--accent)' }}>{progressState.statusMessage || 'Processing concepts'}</strong></span>
                <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{progressState.completedQuantity} / {progressState.totalQuantity} ({progressState.percentage}%)</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                <div style={{ width: `${progressState.percentage}%`, height: '100%', background: 'var(--accent)', transition: 'width 200ms ease' }}></div>
              </div>

              {/* Step checklist */}
              <div style={{ background: 'var(--bg-primary)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'left', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>✓ Preparing prompt</div>
                <div>✓ Connecting to ChatGPT</div>
                <div>✓ Sending prompt</div>
                <div>✓ Waiting for response</div>
                <div>✓ Capturing response</div>
                <div>✓ Parsing concepts</div>
              </div>
            </div>
          )}

          <div style={{ marginTop: '24px' }}>
            <button className="btn btn-secondary btn-sm" style={{ color: 'var(--error)' }} onClick={handleCancel}>
              <XCircle size={14} /> Cancel Generation
            </button>
          </div>
        </div>
      )}

      {/* Campaign Batch Overview & Concept Grid (Section 13, 23) */}
      {!isGenerating && generatedConcepts.length > 0 && (
        <div>
          {/* Campaign Batch Header Info */}
          {activeBatch && (
            <div className="card" style={{ marginBottom: '24px', padding: '20px', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  CAMPAIGN BATCH • {activeBatch.status.toUpperCase()}
                </div>
                <h2 className="heading-md" style={{ marginTop: '2px' }}>{activeBatch.name}</h2>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '16px' }}>
                  <span>Requested: <strong>{activeBatch.requestedQuantity}</strong></span>
                  <span>Generated: <strong>{activeBatch.completedQuantity}</strong></span>
                  <span>Approved: <strong style={{ color: 'var(--success)' }}>{generatedConcepts.filter(c => c.status === 'approved').length}</strong></span>
                  <span>Pending: <strong style={{ color: 'var(--warning)' }}>{generatedConcepts.filter(c => c.status === 'pending').length}</strong></span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-secondary" onClick={() => setShowGenerateMore(!showGenerateMore)}>
                  <Plus size={16} /> Generate More
                </button>
                <button className="btn btn-primary" onClick={() => onNavigate('approvals')}>
                  Review in Approval Center <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* "Generate More" Panel */}
          {showGenerateMore && (
            <div className="card" style={{ marginBottom: '24px', padding: '16px 20px', background: 'var(--bg-elevated)', border: '1px solid var(--accent-alpha-20)' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '10px' }}>Add more concepts to this campaign</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Quantity:</span>
                {[2, 5, 10, 20].map(qty => (
                  <button
                    key={qty}
                    onClick={() => setAdditionalQty(qty)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: additionalQty === qty ? 'var(--accent-alpha-10)' : 'var(--bg-primary)',
                      border: `1px solid ${additionalQty === qty ? 'var(--accent)' : 'var(--border-color)'}`,
                      color: additionalQty === qty ? 'var(--accent)' : 'var(--text-primary)',
                      fontSize: '0.8125rem',
                      fontWeight: 600
                    }}
                  >
                    +{qty}
                  </button>
                ))}
                <button className="btn btn-primary btn-sm" onClick={handleGenerateMore}>
                  <Sparkles size={14} /> Add +{additionalQty} Concepts
                </button>
              </div>
            </div>
          )}

          {/* Controls Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="badge badge-approved" style={{ fontSize: '0.8125rem', padding: '4px 10px' }}>
                {generatedConcepts.length} Concepts Total
              </span>
              {selectedIds.length > 0 && (
                <span className="text-secondary" style={{ fontSize: '0.8125rem' }}>
                  {selectedIds.length} selected
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary btn-sm" onClick={toggleSelectAll}>
                {selectedIds.length === generatedConcepts.length ? 'Deselect All' : 'Select All'}
              </button>
              {selectedIds.length > 0 && (
                <>
                  <button className="btn btn-danger btn-sm" onClick={handleBulkReject}>
                    <XCircle size={14} /> Reject Selected ({selectedIds.length})
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={handleBulkApprove}>
                    <CheckCircle2 size={14} /> Approve Selected ({selectedIds.length})
                  </button>
                </>
              )}
              <button className="btn btn-ghost btn-sm" onClick={() => setGeneratedConcepts([])}>
                <RefreshCw size={14} /> New Campaign
              </button>
            </div>
          </div>

          {/* Concept Grid Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {generatedConcepts.map((item, idx) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  className="card card-interactive"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                    position: 'relative'
                  }}
                >
                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(item.id)}
                          style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                          CONCEPT #{item.conceptNumber || idx + 1}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {item.qualityScore !== undefined && (
                          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: item.qualityScore >= 80 ? 'var(--success)' : 'var(--warning)', background: 'var(--bg-elevated)', padding: '1px 6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                            Score: {item.qualityScore}
                          </span>
                        )}
                        <span className={`badge badge-${item.status}`}>
                          {item.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Image Preview */}
                    <div style={{ position: 'relative', height: '180px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '12px' }}>
                      <img src={item.visualUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(11, 13, 16, 0.85)', backdropFilter: 'blur(4px)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', color: '#FFF' }}>
                        {item.contentType}
                      </div>
                    </div>

                    {/* Title & Hook */}
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      {item.title}
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '10px' }}>
                      "{item.hook}"
                    </p>
                  </div>

                  {/* Footer Actions */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => onEditConcept(item)}>
                      <Edit3 size={13} /> Edit
                    </button>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-danger btn-sm" onClick={() => handleSingleReject(item.id)}>
                        <XCircle size={13} />
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={() => handleSingleApprove(item.id)}>
                        <CheckCircle2 size={13} /> Approve
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
