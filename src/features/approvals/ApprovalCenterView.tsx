import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Search, 
  Instagram, 
  Calendar,
  RefreshCw,
  Sparkles,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { localDb } from '../../data/local/database';
import { Concept } from '../../domain/models/types';
import { LocalSessionProvider } from '../../providers/ai/LocalSessionProvider';
import { MockAIProvider } from '../../providers/ai/MockAIProvider';
import { imageEngine } from '../../domain/services/ImageEngine';
import { automationOrchestrator } from '../../domain/services/AutomationOrchestrator';

interface ApprovalCenterViewProps {
  onEditConcept: (concept: Concept) => void;
  onNavigate: (route: string) => void;
}

export const ApprovalCenterView: React.FC<ApprovalCenterViewProps> = ({ 
  onEditConcept,
  onNavigate 
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [imageProgress, setImageProgress] = useState<{ completed: number; total: number; failed: number } | null>(null);

  const concepts = localDb.getConcepts();

  const filtered = concepts.filter(c => {
    const matchesStatus = filterStatus === 'all' ? true : c.status === filterStatus;
    const matchesSearch = searchQuery.trim() === '' || 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.hook.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.captionPreview.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(c => c.id));
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
    automationOrchestrator.enqueueBatch(selectedIds);
    setSelectedIds([]);
  };

  const handleBulkReject = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Are you sure you want to reject ${selectedIds.length} selected concept(s)?`)) {
      localDb.bulkUpdateStatus(selectedIds, 'rejected');
      setSelectedIds([]);
    }
  };

  const handleBulkGenerateImages = async () => {
    if (selectedIds.length === 0) return;
    setIsGeneratingImages(true);
    setImageProgress({ completed: 0, total: selectedIds.length, failed: 0 });

    try {
      await imageEngine.bulkGenerateImages(selectedIds, (completed, total, failed) => {
        setImageProgress({ completed, total, failed });
      });
    } finally {
      setIsGeneratingImages(false);
      setImageProgress(null);
      setSelectedIds([]);
    }
  };

  const handleSingleGenerateImage = async (conceptId: string) => {
    const aiConn = localDb.getAIConnection();
    if (aiConn.providerType === 'local_session' && aiConn.status !== 'connected') {
      alert('ChatGPT browser session required. Please connect your session in AI Studio.');
      return;
    }
    try {
      await imageEngine.generateImageForConcept(conceptId);
    } catch (e: any) {
      alert(e.message || 'Failed to generate image.');
    }
  };

  const handleSingleApprove = async (conceptId: string) => {
    localDb.updateConceptStatus(conceptId, 'approved');
    const settings = imageEngine.getSettings();
    if (settings.autoGenerateAfterApproval) {
      try {
        await handleSingleGenerateImage(conceptId);
      } catch (e: any) {
        console.warn('Auto image generation failed:', e.message);
      }
    }
  };

  const handleRegenerate = async (item: Concept) => {
    const ai = new MockAIProvider();
    const brand = localDb.getBrand();
    const toneVal = brand.toneOfVoice || brand.brandTone || 'Artisanal & Intelligent';
    const [newConcept] = await ai.generateConcepts({
      objective: item.objective || 'Educational',
      quantity: 1,
      platform: item.platform || 'instagram',
      style: item.style || 'Minimal',
      topic: item.title,
      tone: toneVal,
      brandVoice: toneVal,
      targetAudience: brand.targetAudience
    });

    localDb.updateConceptDetails(item.id, {
      title: newConcept.title,
      hook: newConcept.hook,
      fullCaption: newConcept.fullCaption,
      captionPreview: newConcept.captionPreview,
      visualUrl: newConcept.visualUrl,
      qualityScore: newConcept.qualityScore,
      qualityIssues: newConcept.qualityIssues,
      updatedAt: new Date().toISOString()
    });

    localDb.logActivity('concept_generated', 'Concept Regenerated', `Regenerated content variation for "${item.title}".`);
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 className="heading-lg" style={{ fontSize: '1.75rem' }}>Approval Center</h1>
          <p className="text-secondary" style={{ fontSize: '0.9375rem', marginTop: '4px' }}>
            Review your content, approve concepts, and generate visual assets.
          </p>
        </div>

        {selectedIds.length > 0 && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary btn-sm" style={{ color: 'var(--accent)' }} onClick={handleBulkGenerateImages} disabled={isGeneratingImages}>
              <ImageIcon size={14} /> Generate Images ({selectedIds.length})
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleBulkReject}>
              <XCircle size={14} /> Reject Selected ({selectedIds.length})
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleBulkApprove}>
              <CheckCircle2 size={14} /> Approve Selected ({selectedIds.length})
            </button>
          </div>
        )}
      </div>

      {/* Progress banner during bulk image generation */}
      {isGeneratingImages && imageProgress && (
        <div style={{ padding: '14px 18px', background: 'var(--accent-alpha-10)', border: '1px solid var(--accent-alpha-20)', borderRadius: 'var(--radius-md)', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Loader2 size={18} className="animate-spin" style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
              Generating images: {imageProgress.completed} / {imageProgress.total} completed
            </span>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => imageEngine.cancelImageGeneration('bulk')}>
            Cancel
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['all', 'pending', 'approved', 'scheduled', 'rejected'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8125rem',
                fontWeight: filterStatus === st ? 600 : 500,
                backgroundColor: filterStatus === st ? 'var(--accent-alpha-10)' : 'transparent',
                color: filterStatus === st ? 'var(--accent)' : 'var(--text-secondary)',
                border: `1px solid ${filterStatus === st ? 'var(--accent-alpha-20)' : 'transparent'}`
              }}
            >
              {st.toUpperCase()} ({st === 'all' ? concepts.length : concepts.filter(c => c.status === st).length})
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search queue..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '32px', height: '34px', fontSize: '0.8125rem' }}
            />
          </div>

          <button className="btn btn-secondary btn-sm" onClick={toggleSelectAll}>
            {selectedIds.length === filtered.length && filtered.length > 0 ? 'Deselect All' : 'Select Filtered'}
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="card" style={{ padding: '60px', textAlign: 'center', backgroundColor: 'var(--bg-secondary)' }}>
          <CheckCircle2 size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <h2 className="heading-md" style={{ marginBottom: '6px' }}>No content in this queue</h2>
          <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: '20px' }}>
            Generate new concepts or change your filter selection.
          </p>
          <button className="btn btn-primary" onClick={() => onNavigate('create')}>
            Create Content
          </button>
        </div>
      )}

      {/* Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        {filtered.map(item => {
          const isSelected = selectedIds.includes(item.id);

          return (
            <div
              key={item.id}
              className="card card-interactive"
              style={{
                display: 'flex',
                gap: '16px',
                padding: '16px',
                border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border-color)'
              }}
            >
              {/* Left Image */}
              <div style={{ position: 'relative', width: '130px', height: '130px', flexShrink: 0, borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                <img src={item.visualUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: '6px', left: '6px' }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(item.id)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--accent)', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Right Details */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Instagram size={13} style={{ color: '#E1306C' }} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Instagram • {item.contentType}</span>
                    </div>
                    <span className={`badge badge-${item.status}`}>
                      {item.status.toUpperCase()}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.title}
                  </h3>

                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.captionPreview}
                  </p>
                </div>

                {/* Footer Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent)', padding: 0 }} onClick={() => handleSingleGenerateImage(item.id)}>
                    <ImageIcon size={13} /> Gen Image
                  </button>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleRegenerate(item)}>
                      <RefreshCw size={13} />
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => onEditConcept(item)}>
                      <Edit3 size={13} /> Edit
                    </button>
                    {item.status !== 'approved' && item.status !== 'scheduled' && (
                      <button 
                        className="btn btn-primary btn-sm" 
                        onClick={() => handleSingleApprove(item.id)}
                      >
                        <CheckCircle2 size={13} /> Approve
                      </button>
                    )}
                    {item.status === 'approved' && (
                      <button 
                        className="btn btn-secondary btn-sm" 
                        style={{ color: 'var(--info)' }}
                        onClick={() => localDb.updateConceptStatus(item.id, 'scheduled')}
                      >
                        <Calendar size={13} /> Schedule
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
