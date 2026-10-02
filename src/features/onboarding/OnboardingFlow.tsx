import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Building2, 
  Palette, 
  Layers, 
  Cpu, 
  Instagram, 
  Zap,
  Check
} from 'lucide-react';
import { localDb } from '../../data/local/database';
import { AvenzaqLogo } from '../../components/common/AvenzaqLogo';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);

  // Form state initialized with Northstar Coffee defaults
  const [workspaceName, setWorkspaceName] = useState('Northstar Coffee Co.');
  const [businessName, setBusinessName] = useState('Northstar Artisanal Coffee Roasters');
  const [website, setWebsite] = useState('https://northstarcoffee.co');
  const [industry, setIndustry] = useState('Specialty Coffee & Beverages');

  const [brandDesc, setBrandDesc] = useState('Northstar Coffee is an independent specialty coffee roaster dedicated to ethical sourcing, precision roasting, and elevated morning rituals.');
  const [targetAudience, setTargetAudience] = useState('Specialty coffee enthusiasts, remote professionals, home baristas aged 22-45.');
  const [brandTone, setBrandTone] = useState('Intelligent, warm, calm, artisanal');
  const [primaryColor, setPrimaryColor] = useState('#7C6CF2');

  const [selectedPillars, setSelectedPillars] = useState<string[]>([
    'Educational',
    'Product',
    'Behind the scenes',
    'Engagement'
  ]);

  const [aiConnected, setAiConnected] = useState(true);
  const [instaConnected, setInstaConnected] = useState(true);

  const [frequency, setFrequency] = useState('3x per week');
  const [postingTime, setPostingTime] = useState('09:00 AM');
  const [contentQuantity, setContentQuantity] = useState(5);
  const [approvalRequired, setApprovalRequired] = useState(true);

  const togglePillar = (pillar: string) => {
    if (selectedPillars.includes(pillar)) {
      setSelectedPillars(selectedPillars.filter(p => p !== pillar));
    } else {
      setSelectedPillars([...selectedPillars, pillar]);
    }
  };

  const handleFinish = () => {
    localDb.updateWorkspace({
      name: workspaceName,
      businessName,
      website,
      industry,
      isCompletedOnboarding: true
    });

    localDb.updateBrand({
      description: brandDesc,
      targetAudience,
      brandTone,
      primaryColor
    });

    localDb.updateAutomation({
      frequency,
      postingTime,
      contentQuantity,
      approvalRequired
    });

    onComplete();
  };

  const contentPreferenceOptions = [
    'Educational',
    'Promotional',
    'Inspirational',
    'Engagement',
    'Product',
    'Behind the scenes',
    'Industry insights',
    'Custom'
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', color: 'var(--text-primary)' }}>
      {/* Top Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <AvenzaqLogo size="lg" />
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '8px' }}>
          Phase 01 — Local-First Content Engine Setup
        </div>
      </div>

      {/* Progress Dots */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
          <div
            key={s}
            style={{
              width: s === step ? '28px' : '8px',
              height: '8px',
              borderRadius: '4px',
              backgroundColor: s === step ? 'var(--accent)' : s < step ? 'var(--text-secondary)' : 'var(--border-color)',
              transition: 'all 200ms ease'
            }}
          />
        ))}
      </div>

      {/* Container Box */}
      <div 
        className="card-elevated"
        style={{
          width: '100%',
          maxWidth: '560px',
          padding: '36px',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        {/* Step 1: Welcome */}
        {step === 1 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '54px', height: '54px', borderRadius: '14px', background: 'var(--accent-alpha-10)', border: '1px solid var(--accent-alpha-20)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', marginBottom: '20px' }}>
              <Sparkles size={28} />
            </div>
            <h1 className="heading-lg" style={{ marginBottom: '10px' }}>Let's build your content engine.</h1>
            <p className="text-secondary" style={{ fontSize: '0.9375rem', marginBottom: '28px', lineHeight: 1.6 }}>
              Avenzaq is your local-first social media content creation workspace. Generate concepts, bulk approve, schedule, and maintain full control right from your machine.
            </p>
            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => setStep(2)}>
              Get Started <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Step 2: Workspace */}
        {step === 2 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Building2 size={20} style={{ color: 'var(--accent)' }} />
              <h2 className="heading-md">Workspace Details</h2>
            </div>
            <p className="text-muted" style={{ fontSize: '0.8125rem', marginBottom: '20px' }}>Define your core brand identity and workspace container.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Workspace Name</label>
                <input className="input-field" value={workspaceName} onChange={e => setWorkspaceName(e.target.value)} placeholder="e.g. Northstar Coffee Co." />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Business Name</label>
                <input className="input-field" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="e.g. Northstar Artisanal Coffee Roasters" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Website</label>
                  <input className="input-field" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Industry</label>
                  <input className="input-field" value={industry} onChange={e => setIndustry(e.target.value)} placeholder="Specialty Coffee" />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px' }}>
              <button className="btn btn-ghost" onClick={() => setStep(1)}><ArrowLeft size={16} /> Back</button>
              <button className="btn btn-primary" onClick={() => setStep(3)}>Continue <ArrowRight size={16} /></button>
            </div>
          </div>
        )}

        {/* Step 3: Brand */}
        {step === 3 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Palette size={20} style={{ color: 'var(--accent)' }} />
              <h2 className="heading-md">Brand Identity & Voice</h2>
            </div>
            <p className="text-muted" style={{ fontSize: '0.8125rem', marginBottom: '20px' }}>Train local concept generation on your unique brand voice.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Brand Description</label>
                <textarea className="textarea-field" value={brandDesc} onChange={e => setBrandDesc(e.target.value)} rows={3} />
              </div>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Target Audience</label>
                <input className="input-field" value={targetAudience} onChange={e => setTargetAudience(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Brand Tone</label>
                  <input className="input-field" value={brandTone} onChange={e => setBrandTone(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Accent Color</label>
                  <input type="color" className="input-field" style={{ padding: '2px', cursor: 'pointer' }} value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px' }}>
              <button className="btn btn-ghost" onClick={() => setStep(2)}><ArrowLeft size={16} /> Back</button>
              <button className="btn btn-primary" onClick={() => setStep(4)}>Continue <ArrowRight size={16} /></button>
            </div>
          </div>
        )}

        {/* Step 4: Content Preferences */}
        {step === 4 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Layers size={20} style={{ color: 'var(--accent)' }} />
              <h2 className="heading-md">Content Preferences</h2>
            </div>
            <p className="text-muted" style={{ fontSize: '0.8125rem', marginBottom: '20px' }}>Select content pillars you want to regularly generate.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
              {contentPreferenceOptions.map(opt => {
                const selected = selectedPillars.includes(opt);
                return (
                  <button
                    key={opt}
                    onClick={() => togglePillar(opt)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: selected ? 'var(--accent-alpha-10)' : 'var(--bg-primary)',
                      border: `1px solid ${selected ? 'var(--accent)' : 'var(--border-color)'}`,
                      color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.875rem',
                      fontWeight: selected ? 600 : 500,
                      transition: 'all 120ms ease'
                    }}
                  >
                    <span>{opt}</span>
                    {selected && <Check size={16} style={{ color: 'var(--accent)' }} />}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px' }}>
              <button className="btn btn-ghost" onClick={() => setStep(3)}><ArrowLeft size={16} /> Back</button>
              <button className="btn btn-primary" onClick={() => setStep(5)}>Continue <ArrowRight size={16} /></button>
            </div>
          </div>
        )}

        {/* Step 5: AI Connection */}
        {step === 5 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Cpu size={20} style={{ color: 'var(--accent)' }} />
              <h2 className="heading-md">AI Connection</h2>
            </div>
            <p className="text-muted" style={{ fontSize: '0.8125rem', marginBottom: '20px' }}>
              Connect your preferred AI session to power content creation.
            </p>

            <div className="card" style={{ padding: '20px', marginBottom: '20px', backgroundColor: 'var(--bg-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Local AI Workstation Session</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Local Provider (Zero cloud transmit)</div>
                </div>
                <span className={`badge ${aiConnected ? 'badge-approved' : 'badge-pending'}`}>
                  {aiConnected ? 'Connected' : 'Not connected'}
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
                Your AI session runs through your local environment. Your credentials and prompt data stay private on your device.
              </p>
              <button 
                className={`btn ${aiConnected ? 'btn-secondary' : 'btn-primary'}`}
                onClick={() => setAiConnected(!aiConnected)}
              >
                {aiConnected ? 'Disconnect AI Session' : 'Connect AI Session'}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px' }}>
              <button className="btn btn-ghost" onClick={() => setStep(4)}><ArrowLeft size={16} /> Back</button>
              <button className="btn btn-primary" onClick={() => setStep(6)}>Continue <ArrowRight size={16} /></button>
            </div>
          </div>
        )}

        {/* Step 6: Instagram Integration */}
        {step === 6 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Instagram size={20} style={{ color: 'var(--accent)' }} />
              <h2 className="heading-md">Social Account Setup</h2>
            </div>
            <p className="text-muted" style={{ fontSize: '0.8125rem', marginBottom: '20px' }}>Configure target social channels for local scheduling.</p>

            <div className="card" style={{ padding: '20px', marginBottom: '20px', backgroundColor: 'var(--bg-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Instagram size={24} style={{ color: '#E1306C' }} />
                  <div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Instagram Business</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@northstarcoffee</div>
                  </div>
                </div>
                <span className={`badge ${instaConnected ? 'badge-approved' : 'badge-pending'}`}>
                  {instaConnected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Local Instagram profile metadata linked for visual previews and scheduling queues.
              </p>
              <button 
                className={`btn ${instaConnected ? 'btn-secondary' : 'btn-primary'}`}
                onClick={() => setInstaConnected(!instaConnected)}
              >
                {instaConnected ? 'Disconnect Instagram' : 'Connect Instagram'}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px' }}>
              <button className="btn btn-ghost" onClick={() => setStep(5)}><ArrowLeft size={16} /> Back</button>
              <button className="btn btn-primary" onClick={() => setStep(7)}>Continue <ArrowRight size={16} /></button>
            </div>
          </div>
        )}

        {/* Step 7: Automation Preferences */}
        {step === 7 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Zap size={20} style={{ color: 'var(--accent)' }} />
              <h2 className="heading-md">Automation Preferences</h2>
            </div>
            <p className="text-muted" style={{ fontSize: '0.8125rem', marginBottom: '20px' }}>Set default cadence and approval safeguards.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Posting Frequency</label>
                <select className="input-field" value={frequency} onChange={e => setFrequency(e.target.value)}>
                  <option value="Daily">Daily (7 posts/week)</option>
                  <option value="3x per week">3x per week (Mon, Wed, Fri)</option>
                  <option value="Weekly">Weekly (1 post/week)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Preferred Posting Time</label>
                  <input className="input-field" value={postingTime} onChange={e => setPostingTime(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Batch Quantity</label>
                  <input type="number" className="input-field" value={contentQuantity} onChange={e => setContentQuantity(Number(e.target.value))} min={1} max={20} />
                </div>
              </div>

              <div style={{ padding: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Approval Required</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Require manual approval before scheduling</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={approvalRequired} 
                  onChange={e => setApprovalRequired(e.target.checked)} 
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent)', cursor: 'pointer' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px' }}>
              <button className="btn btn-ghost" onClick={() => setStep(6)}><ArrowLeft size={16} /> Back</button>
              <button className="btn btn-primary" onClick={() => setStep(8)}>Continue <ArrowRight size={16} /></button>
            </div>
          </div>
        )}

        {/* Step 8: Complete */}
        {step === 8 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--success-bg)', border: '1px solid rgba(53, 201, 139, 0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)', marginBottom: '20px' }}>
              <CheckCircle2 size={32} />
            </div>
            <h1 className="heading-lg" style={{ marginBottom: '10px' }}>Your workspace is ready.</h1>
            <p className="text-secondary" style={{ fontSize: '0.9375rem', marginBottom: '28px', lineHeight: 1.6 }}>
              All settings for <strong style={{ color: 'var(--text-primary)' }}>{workspaceName}</strong> have been configured locally. You are ready to generate your first batch of AI content concepts.
            </p>
            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleFinish}>
              Create your first content <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
