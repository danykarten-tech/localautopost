import React, { useState } from 'react';
import { 
  Palette, 
  Type, 
  Sparkles, 
  Users, 
  Camera, 
  Check, 
  Save 
} from 'lucide-react';
import { localDb } from '../../data/local/database';

export const BrandKitView: React.FC = () => {
  const brand = localDb.getBrand();
  const [description, setDescription] = useState(brand.description);
  const [audience, setAudience] = useState(brand.targetAudience);
  const [brandTone, setBrandTone] = useState(brand.brandTone);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localDb.updateBrand({
      description,
      targetAudience: audience,
      brandTone
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 className="heading-lg" style={{ fontSize: '1.75rem' }}>Brand Kit & Voice</h1>
          <p className="text-secondary" style={{ fontSize: '0.9375rem', marginTop: '4px' }}>
            Manage brand DNA, color tokens, typography, and AI voice constraints.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleSave}>
          <Save size={16} /> {saved ? 'Saved!' : 'Save Brand Settings'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '28px' }}>
        {/* Main Brand Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Brand Voice */}
          <div className="card">
            <h2 className="heading-md" style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} style={{ color: 'var(--accent)' }} /> Brand Description & Mission
            </h2>
            <textarea
              className="textarea-field"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          {/* Target Audience & Tone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="card">
              <h3 className="heading-sm" style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={16} style={{ color: 'var(--info)' }} /> Target Audience
              </h3>
              <input
                className="input-field"
                value={audience}
                onChange={e => setAudience(e.target.value)}
              />
            </div>

            <div className="card">
              <h3 className="heading-sm" style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Type size={16} style={{ color: 'var(--warning)' }} /> Tone of Voice
              </h3>
              <input
                className="input-field"
                value={brandTone}
                onChange={e => setBrandTone(e.target.value)}
              />
            </div>
          </div>

          {/* Content Guardrails */}
          <div className="card">
            <h3 className="heading-sm" style={{ marginBottom: '12px' }}>Brand Rules & Guardrails</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {brand.contentRules.map((rule, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.8125rem' }}>
                  <Check size={14} style={{ color: 'var(--success)' }} />
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Colors & Assets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card">
            <h3 className="heading-sm" style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Palette size={16} style={{ color: 'var(--accent)' }} /> Brand Color Palette
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: brand.primaryColor }}></div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Primary Brand</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{brand.primaryColor}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: brand.secondaryColor }}></div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Secondary Surface</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{brand.secondaryColor}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: brand.accentColor }}></div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Highlight Accent</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{brand.accentColor}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="heading-sm" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Camera size={16} style={{ color: 'var(--info)' }} /> Visual Aesthetic Direction
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {brand.visualStyle}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
