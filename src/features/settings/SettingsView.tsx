import React, { useState } from 'react';
import { 
  Building2, 
  Moon, 
  Sun, 
  Database, 
  Info,
  RotateCcw,
  Sparkles,
  Image as ImageIcon,
  HardDrive,
  Check
} from 'lucide-react';
import { localDb } from '../../data/local/database';
import { imageEngine } from '../../domain/services/ImageEngine';
import { ImageValidator } from '../../domain/services/ImageValidator';
import { ImageStyle, AspectRatioType } from '../../domain/models/types';

export const SettingsView: React.FC = () => {
  const [theme, setTheme] = useState(localDb.getTheme());
  const workspace = localDb.getWorkspace();
  const [workspaceName, setWorkspaceName] = useState(workspace.name);
  const [saved, setSaved] = useState(false);

  // Image Engine Settings State
  const [imgSettings, setImgSettings] = useState(imageEngine.getSettings());
  const [imgSaved, setImgSaved] = useState(false);

  const storageHealth = ImageValidator.checkLocalStorageAvailability();

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    localDb.setTheme(newTheme);
  };

  const handleSaveWorkspace = () => {
    localDb.updateWorkspace({ name: workspaceName });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveImageSettings = () => {
    imageEngine.updateSettings(imgSettings);
    setImgSaved(true);
    setTimeout(() => setImgSaved(false), 2000);
  };

  const handleResetData = () => {
    if (window.confirm('Reset local database back to default seed state?')) {
      localDb.resetToDefaults();
      window.location.reload();
    }
  };

  const handleResetOnboarding = () => {
    if (window.confirm('Re-trigger the Onboarding Wizard on next reload?')) {
      localDb.updateWorkspace({ isCompletedOnboarding: false });
      window.location.reload();
    }
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="heading-lg" style={{ fontSize: '1.75rem' }}>Application Settings</h1>
        <p className="text-secondary" style={{ fontSize: '0.9375rem', marginTop: '4px' }}>
          Manage local workspace configuration, AI image engine, storage pipeline, and preferences.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Appearance */}
        <div className="card">
          <h2 className="heading-md" style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Moon size={18} style={{ color: 'var(--accent)' }} /> Appearance & Theme
          </h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => handleThemeChange('dark')}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: theme === 'dark' ? 'var(--accent-alpha-10)' : 'var(--bg-elevated)',
                border: `1px solid ${theme === 'dark' ? 'var(--accent)' : 'var(--border-color)'}`,
                color: theme === 'dark' ? 'var(--accent)' : 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: 600,
                fontSize: '0.875rem'
              }}
            >
              <Moon size={16} /> Dark Theme (Default)
            </button>
            <button
              onClick={() => handleThemeChange('light')}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: theme === 'light' ? 'var(--accent-alpha-10)' : 'var(--bg-elevated)',
                border: `1px solid ${theme === 'light' ? 'var(--accent)' : 'var(--border-color)'}`,
                color: theme === 'light' ? 'var(--accent)' : 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: 600,
                fontSize: '0.875rem'
              }}
            >
              <Sun size={16} /> Light Theme
            </button>
          </div>
        </div>

        {/* AI Image Engine Settings */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 className="heading-md" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ImageIcon size={18} style={{ color: 'var(--accent)' }} /> AI Image Engine & Media Pipeline
            </h2>
            <span className="badge badge-scheduled">Phase 5 Engine</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Image Engine Provider</label>
              <select
                className="input-field"
                value={imgSettings.provider}
                onChange={e => setImgSettings({ ...imgSettings, provider: e.target.value as 'mock' | 'local_session' })}
              >
                <option value="mock">Mock Image Engine (Instant Local Assets)</option>
                <option value="local_session">Local Session Image Engine (Phase 6 Ready)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Default Visual Style</label>
              <select
                className="input-field"
                value={imgSettings.defaultStyle}
                onChange={e => setImgSettings({ ...imgSettings, defaultStyle: e.target.value as ImageStyle })}
              >
                <option value="Photorealistic">Photorealistic</option>
                <option value="Editorial">Editorial</option>
                <option value="Minimal">Minimal</option>
                <option value="Premium">Premium</option>
                <option value="Lifestyle">Lifestyle</option>
                <option value="Product Photography">Product Photography</option>
                <option value="3D Render">3D Render</option>
                <option value="Illustration">Illustration</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Default Aspect Ratio</label>
              <select
                className="input-field"
                value={imgSettings.defaultAspectRatio}
                onChange={e => setImgSettings({ ...imgSettings, defaultAspectRatio: e.target.value as AspectRatioType })}
              >
                <option value="1:1">1:1 Square (Instagram Feed)</option>
                <option value="4:5">4:5 Portrait (Instagram Feed Premium)</option>
                <option value="16:9">16:9 Landscape (Banner / Web)</option>
                <option value="9:16">9:16 Story / Reel Fullscreen</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Default Variants per Concept</label>
              <select
                className="input-field"
                value={imgSettings.defaultQuantity}
                onChange={e => setImgSettings({ ...imgSettings, defaultQuantity: parseInt(e.target.value) })}
              >
                <option value={1}>1 Version (Standard)</option>
                <option value={2}>2 Versions (A/B Test)</option>
                <option value={4}>4 Versions (Variant Suite)</option>
              </select>
            </div>
          </div>

          <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-color)', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Auto-Generate Image on Approval</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Automatically trigger local image pipeline when concept status changes to Approved</div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={imgSettings.autoGenerateAfterApproval}
                onChange={e => setImgSettings({ ...imgSettings, autoGenerateAfterApproval: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }}
              />
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{imgSettings.autoGenerateAfterApproval ? 'Enabled' : 'Disabled'}</span>
            </label>
          </div>

          <button className="btn btn-primary" onClick={handleSaveImageSettings}>
            {imgSaved ? (
              <>
                <Check size={16} /> Saved Image Engine Settings
              </>
            ) : (
              'Save Image Engine Settings'
            )}
          </button>
        </div>

        {/* Local Storage & Health */}
        <div className="card">
          <h2 className="heading-md" style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HardDrive size={18} style={{ color: 'var(--info)' }} /> Local Media Storage & Health Monitor
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            All workspace assets, concepts, and generated media are stored locally on your device without cloud transmission.
          </p>

          <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8125rem' }}>
              <span>LocalStorage Estimated Consumption:</span>
              <strong style={{ color: storageHealth.hasSpace ? 'var(--success)' : 'var(--error)' }}>
                {storageHealth.usedMB} MB used / ~{storageHealth.availableMB} MB remaining
              </strong>
            </div>
            <div style={{ height: '8px', borderRadius: '4px', backgroundColor: 'var(--bg-primary)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.max(5, (storageHealth.usedMB / 10) * 100))}%`,
                  backgroundColor: storageHealth.hasSpace ? 'var(--accent)' : 'var(--error)',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          </div>
        </div>

        {/* Workspace */}
        <div className="card">
          <h2 className="heading-md" style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={18} style={{ color: 'var(--info)' }} /> Workspace Details
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '480px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Workspace Name</label>
              <input
                className="input-field"
                value={workspaceName}
                onChange={e => setWorkspaceName(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" style={{ width: 'fit-content' }} onClick={handleSaveWorkspace}>
              {saved ? 'Saved!' : 'Update Workspace'}
            </button>
          </div>
        </div>

        {/* Local Storage & Reset */}
        <div className="card">
          <h2 className="heading-md" style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={18} style={{ color: 'var(--warning)' }} /> Developer Tools & Local Data Reset
          </h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={handleResetOnboarding}>
              <Sparkles size={15} /> Reset Onboarding Flow
            </button>
            <button className="btn btn-secondary" style={{ color: 'var(--error)' }} onClick={handleResetData}>
              <RotateCcw size={15} /> Reset Local Database to Defaults
            </button>
          </div>
        </div>

        {/* About */}
        <div className="card card-elevated">
          <h2 className="heading-md" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={18} style={{ color: 'var(--accent)' }} /> About Avenzaq
          </h2>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <div>Product: Avenzaq Local-First Workstation</div>
            <div>Version: 5.0.0 (Phase 5 Connected AI Image Engine)</div>
            <div>Tagline: "Your content. On autopilot."</div>
          </div>
        </div>
      </div>
    </div>
  );
};
