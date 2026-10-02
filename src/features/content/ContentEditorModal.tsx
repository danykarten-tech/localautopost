import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Calendar, 
  Instagram, 
  Save, 
  Wand2,
  Image as ImageIcon,
  Loader2,
  Check,
  Edit2
} from 'lucide-react';
import { localDb } from '../../data/local/database';
import { Concept, ContentStatus, MediaAsset } from '../../domain/models/types';
import { LocalSessionProvider } from '../../providers/ai/LocalSessionProvider';
import { imageEngine } from '../../domain/services/ImageEngine';

interface ContentEditorModalProps {
  concept: Concept | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ContentEditorModal: React.FC<ContentEditorModalProps> = ({
  concept,
  isOpen,
  onClose
}) => {
  const [title, setTitle] = useState('');
  const [hook, setHook] = useState('');
  const [fullCaption, setFullCaption] = useState('');
  const [cta, setCta] = useState('');
  const [hashtagsStr, setHashtagsStr] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00 AM');
  const [status, setStatus] = useState<ContentStatus>('pending');
  const [isRefining, setIsRefining] = useState(false);

  // Phase 5 Image Generation & Version State
  const [promptText, setPromptText] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [showPromptEdit, setShowPromptEdit] = useState(false);

  useEffect(() => {
    if (concept) {
      setTitle(concept.title);
      setHook(concept.hook);
      setFullCaption(concept.fullCaption || concept.captionPreview);
      setCta(concept.cta || '');
      setHashtagsStr(concept.hashtags ? concept.hashtags.join(' ') : '');
      setScheduledDate(concept.scheduledDate || new Date().toISOString().split('T')[0]);
      setScheduledTime(concept.scheduledTime || '09:00 AM');
      setStatus(concept.status);
      setPromptText(typeof concept.imagePrompt === 'string' ? concept.imagePrompt : concept.visualDirection || concept.title);

      const assets = localDb.getMediaAssets().filter(m => m.contentId === concept.id);
      setMediaAssets(assets);
    }
  }, [concept]);

  if (!isOpen || !concept) return null;

  const handleSave = (newStatus?: ContentStatus) => {
    const targetStatus = newStatus || status;
    localDb.updateConceptDetails(concept.id, {
      title,
      hook,
      fullCaption,
      captionPreview: fullCaption.slice(0, 120) + '...',
      cta,
      hashtags: hashtagsStr.split(' ').filter(h => h.startsWith('#')),
      scheduledDate,
      scheduledTime,
      status: targetStatus
    });
    onClose();
  };

  const handleAIRefine = async () => {
    setIsRefining(true);
    const ai = new LocalSessionProvider();
    const refined = await ai.refineCaption(fullCaption, 'Make it more engaging and add bullet points.');
    setFullCaption(refined);
    setIsRefining(false);
  };

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    try {
      const { mediaAssets: newAssets, updatedConcept } = await imageEngine.generateImageForConcept(concept.id, {
        promptText
      });
      const allAssets = localDb.getMediaAssets().filter(m => m.contentId === concept.id);
      setMediaAssets(allAssets);
    } catch (e: any) {
      alert(e.message || 'Image generation failed.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSetPrimary = (assetId: string) => {
    imageEngine.setPrimaryMediaAsset(concept.id, assetId);
    const allAssets = localDb.getMediaAssets().filter(m => m.contentId === concept.id);
    setMediaAssets(allAssets);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-box"
        style={{
          maxWidth: '1100px',
          width: '95%',
          height: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className={`badge badge-${status}`}>{status.toUpperCase()}</span>
            <span style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Editing: {title}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* 3-Column Layout */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '260px 1fr 340px', overflow: 'hidden', background: 'var(--bg-primary)' }}>
          {/* LEFT: Settings & Schedule */}
          <div style={{ padding: '20px', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-secondary)' }}>
            <h3 className="heading-sm">Settings</h3>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Platform</label>
              <div style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem' }}>
                <Instagram size={14} style={{ color: '#E1306C' }} /> Instagram
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Scheduled Date</label>
              <input
                type="date"
                className="input-field"
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Scheduled Time</label>
              <input
                type="text"
                className="input-field"
                value={scheduledTime}
                onChange={e => setScheduledTime(e.target.value)}
                placeholder="09:00 AM"
              />
            </div>

            <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Visual Direction:</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, background: 'var(--bg-primary)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                {concept.visualDirection}
              </div>
            </div>
          </div>

          {/* CENTER: Visual Preview & Version Gallery */}
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)', overflowY: 'auto' }}>
            <div style={{ width: '100%', maxWidth: '380px', aspectRatio: '4/5', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)', position: 'relative', marginBottom: '16px' }}>
              <img src={concept.visualUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', background: 'rgba(11, 13, 16, 0.85)', backdropFilter: 'blur(8px)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#FFF' }}>{title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>"{hook}"</div>
              </div>
            </div>

            {/* Image Generator & Prompt Controls */}
            <div style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleGenerateImage} disabled={isGeneratingImage}>
                  {isGeneratingImage ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                  {isGeneratingImage ? 'Generating Image...' : 'Generate New Version'}
                </button>

                <button className="btn btn-secondary btn-sm" onClick={() => setShowPromptEdit(!showPromptEdit)}>
                  <Edit2 size={14} /> Prompt
                </button>
              </div>

              {showPromptEdit && (
                <div style={{ padding: '10px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Image Prompt:</label>
                  <textarea
                    className="textarea-field"
                    value={promptText}
                    onChange={e => setPromptText(e.target.value)}
                    rows={3}
                    style={{ fontSize: '0.75rem' }}
                  />
                </div>
              )}

              {/* Version Thumbnails */}
              {mediaAssets.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Image Versions ({mediaAssets.length}):</div>
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                    {mediaAssets.map(asset => (
                      <div
                        key={asset.id}
                        onClick={() => handleSetPrimary(asset.id)}
                        style={{
                          position: 'relative',
                          width: '54px',
                          height: '54px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          border: asset.url === concept.visualUrl ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                      >
                        <img src={asset.url} alt={asset.filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {asset.url === concept.visualUrl && (
                          <div style={{ position: 'absolute', top: '2px', right: '2px', background: 'var(--accent)', borderRadius: '50%', padding: '1px', color: '#FFF' }}>
                            <Check size={10} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Content Details Editor */}
          <div style={{ padding: '20px', borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="heading-sm">Content Information</h3>
              <button 
                className="btn btn-ghost btn-sm" 
                style={{ color: 'var(--accent)' }}
                onClick={handleAIRefine}
                disabled={isRefining}
              >
                <Wand2 size={13} /> {isRefining ? 'Refining...' : 'AI Refine'}
              </button>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Concept Title</label>
              <input className="input-field" value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Hook / Headline</label>
              <input className="input-field" value={hook} onChange={e => setHook(e.target.value)} />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Full Caption</label>
              <textarea 
                className="textarea-field" 
                value={fullCaption} 
                onChange={e => setFullCaption(e.target.value)} 
                rows={8}
                style={{ fontSize: '0.8125rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Call-To-Action (CTA)</label>
              <input className="input-field" value={cta} onChange={e => setCta(e.target.value)} />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Hashtags</label>
              <input className="input-field" value={hashtagsStr} onChange={e => setHashtagsStr(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)' }}>
          <button className="btn btn-secondary" onClick={() => handleSave('draft')}>
            <Save size={15} /> Save Draft
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" style={{ color: 'var(--info)' }} onClick={() => handleSave('scheduled')}>
              <Calendar size={15} /> Schedule
            </button>
            <button className="btn btn-primary" onClick={() => handleSave('approved')}>
              <CheckCircle2 size={15} /> Approve & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
