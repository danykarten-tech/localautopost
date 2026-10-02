import React, { useState } from 'react';
import { 
  FileImage, 
  Search, 
  Upload, 
  Trash2, 
  Image as ImageIcon,
  Check,
  Link,
  Unlink,
  Download
} from 'lucide-react';
import { localDb } from '../../data/local/database';
import { MediaAsset, MediaItem } from '../../domain/models/types';
import { imageEngine } from '../../domain/services/ImageEngine';

export const MediaLibraryView: React.FC = () => {
  const [tab, setTab] = useState<'all' | 'generated' | 'uploaded' | 'used' | 'unused'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);

  const phase5Assets = localDb.getMediaAssets();
  const seedItems: MediaAsset[] = localDb.getMedia().map(m => ({
    id: m.id,
    workspaceId: m.workspaceId,
    type: 'image',
    filename: m.name,
    localPath: `Avenzaq/media/images/${m.category}/${m.name}`,
    mimeType: 'image/jpeg',
    width: 1080,
    height: 1350,
    fileSize: m.fileSize,
    source: m.category === 'generated' ? 'generated' : 'uploaded',
    status: 'completed',
    url: m.url,
    createdAt: m.createdAt,
    updatedAt: m.createdAt
  }));

  const allAssets = [...phase5Assets, ...seedItems];

  const filtered = allAssets.filter(m => {
    const isUsed = localDb.getConcepts().some(c => c.attachedMediaId === m.id || c.visualUrl === m.url);
    if (tab === 'generated' && m.source !== 'generated') return false;
    if (tab === 'uploaded' && m.source !== 'uploaded') return false;
    if (tab === 'used' && !isUsed) return false;
    if (tab === 'unused' && isUsed) return false;
    return m.filename.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleDelete = (asset: MediaAsset) => {
    const attachedConcept = localDb.getConcepts().find(c => c.attachedMediaId === asset.id || c.visualUrl === asset.url);
    if (attachedConcept) {
      if (!window.confirm(`"${asset.filename}" is currently attached to concept "${attachedConcept.title}". Delete and detach?`)) {
        return;
      }
    }
    imageEngine.deleteMediaAsset(asset.id);
    setSelectedAsset(null);
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 className="heading-lg" style={{ fontSize: '1.75rem' }}>Media Library</h1>
          <p className="text-secondary" style={{ fontSize: '0.9375rem', marginTop: '4px' }}>
            Local file storage directory for high-resolution generated assets and brand photography.
          </p>
        </div>

        <button className="btn btn-primary">
          <Upload size={16} /> Upload Asset
        </button>
      </div>

      {/* Tabs & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['all', 'generated', 'uploaded', 'used', 'unused'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8125rem',
                fontWeight: tab === t ? 600 : 500,
                backgroundColor: tab === t ? 'var(--accent-alpha-10)' : 'transparent',
                color: tab === t ? 'var(--accent)' : 'var(--text-secondary)',
                border: `1px solid ${tab === t ? 'var(--accent-alpha-20)' : 'transparent'}`,
                textTransform: 'capitalize'
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search media..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        {filtered.map(item => {
          const attachedConcept = localDb.getConcepts().find(c => c.attachedMediaId === item.id || c.visualUrl === item.url);

          return (
            <div
              key={item.id}
              className="card card-interactive"
              onClick={() => setSelectedAsset(item)}
              style={{ padding: '8px', cursor: 'pointer' }}
            >
              <div style={{ position: 'relative', height: '180px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '8px' }}>
                <img src={item.url} alt={item.filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: '6px', left: '6px' }}>
                  <span className={`badge ${item.source === 'generated' ? 'badge-published' : 'badge-draft'}`}>
                    {item.source.toUpperCase()}
                  </span>
                </div>
                {item.version && (
                  <div style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(11, 13, 16, 0.85)', backdropFilter: 'blur(4px)', padding: '1px 6px', borderRadius: '4px', fontSize: '0.6875rem', color: '#FFF' }}>
                    v{item.version}
                  </div>
                )}
              </div>

              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.filename}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                <span>{item.fileSize}</span>
                <span>{attachedConcept ? 'Attached' : 'Unused'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Media Preview Modal (Section 21) */}
      {selectedAsset && (
        <div className="modal-overlay" onClick={() => setSelectedAsset(null)}>
          <div className="modal-box" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
            <div style={{ position: 'relative', height: '320px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '16px' }}>
              <img src={selectedAsset.url} alt={selectedAsset.filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <h3 className="heading-md" style={{ marginBottom: '4px' }}>{selectedAsset.filename}</h3>
            
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div>Path: <code style={{ color: 'var(--accent)', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: '4px' }}>{selectedAsset.localPath}</code></div>
              <div>Dimensions: {selectedAsset.width}x{selectedAsset.height} • Size: {selectedAsset.fileSize} • Source: {selectedAsset.source}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
              <button className="btn btn-danger" onClick={() => handleDelete(selectedAsset)}>
                <Trash2 size={16} /> Delete Asset
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <a href={selectedAsset.url} target="_blank" rel="noopener noreferrer" download={selectedAsset.filename} className="btn btn-secondary">
                  <Download size={15} /> Download
                </a>
                <button className="btn btn-primary" onClick={() => setSelectedAsset(null)}>
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
