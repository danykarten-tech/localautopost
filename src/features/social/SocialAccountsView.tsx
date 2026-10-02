import React, { useState } from 'react';
import { 
  Instagram, 
  Facebook, 
  Linkedin, 
  Twitter, 
  Video, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw 
} from 'lucide-react';
import { localDb } from '../../data/local/database';

export const SocialAccountsView: React.FC = () => {
  const [accounts, setAccounts] = useState(localDb.getSocialAccounts());

  const handleToggleInsta = () => {
    const insta = accounts.find(a => a.platform === 'instagram');
    if (insta) {
      const nextStatus = insta.status === 'connected' ? 'not_connected' : 'connected';
      localDb.updateSocialAccountStatus(insta.id, nextStatus);
      setAccounts(localDb.getSocialAccounts());
    }
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="heading-lg" style={{ fontSize: '1.75rem' }}>Social Accounts</h1>
        <p className="text-secondary" style={{ fontSize: '0.9375rem', marginTop: '4px' }}>
          Manage platform publishing targets and account status metadata.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        {accounts.map(acc => {
          const isInsta = acc.platform === 'instagram';

          return (
            <div key={acc.id} className="card card-interactive" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {acc.platform === 'instagram' && <Instagram size={22} style={{ color: '#E1306C' }} />}
                    {acc.platform === 'facebook' && <Facebook size={22} style={{ color: '#1877F2' }} />}
                    {acc.platform === 'linkedin' && <Linkedin size={22} style={{ color: '#0A66C2' }} />}
                    {acc.platform === 'tiktok' && <Video size={22} style={{ color: '#FE2C55' }} />}
                    {acc.platform === 'twitter' && <Twitter size={22} style={{ color: '#1DA1F2' }} />}
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{acc.platformName}</h3>
                    {acc.handle ? (
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{acc.handle} • {acc.followerCount}</span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Not linked</span>
                    )}
                  </div>
                </div>

                {isInsta ? (
                  <span className={`badge ${acc.status === 'connected' ? 'badge-approved' : 'badge-pending'}`}>
                    {acc.status === 'connected' ? 'HEALTHY' : 'NOT CONNECTED'}
                  </span>
                ) : (
                  <span className="badge badge-draft">PHASE 2</span>
                )}
              </div>

              {isInsta ? (
                <div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Connected locally. Metadata synchronized for preview cards and schedule queues.
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={handleToggleInsta}>
                      {acc.status === 'connected' ? 'Disconnect' : 'Connect Account'}
                    </button>
                    {acc.status === 'connected' && (
                      <button className="btn btn-ghost btn-sm">
                        <RefreshCw size={13} /> Recheck Connection
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Integration setup will be available in the next integration phase.
                  </p>
                  <button disabled className="btn btn-secondary btn-sm" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                    Coming Soon
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
