import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  className?: string;
}

export const AvenzaqLogo: React.FC<LogoProps> = ({ 
  size = 'md', 
  showWordmark = true, 
  className = '' 
}) => {
  const dimensions = {
    sm: { icon: 22, text: 'text-sm' },
    md: { icon: 28, text: 'text-base' },
    lg: { icon: 36, text: 'text-lg' },
    xl: { icon: 48, text: 'text-2xl' }
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`} style={{ userSelect: 'none' }}>
      {/* Abstract Avenzaq Geometric Mark */}
      <svg 
        width={dimensions.icon} 
        height={dimensions.icon} 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <rect width="32" height="32" rx="8" fill="var(--bg-elevated)" />
        <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" stroke="var(--border-color)" />
        {/* Precision geometric A structure */}
        <path 
          d="M16 6L24.5 23.5H20.2L16 14.8L11.8 23.5H7.5L16 6Z" 
          fill="url(#avenzaq_gradient)" 
        />
        <circle cx="16" cy="18.5" r="2" fill="var(--text-primary)" />
        <defs>
          <linearGradient id="avenzaq_gradient" x1="7.5" y1="6" x2="24.5" y2="23.5" gradientUnits="userSpaceOnUse">
            <stop stopColor="#7C6CF2" />
            <stop offset="1" stopColor="#5DA9FF" />
          </linearGradient>
        </defs>
      </svg>

      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span 
            className={`font-bold tracking-tight text-primary ${dimensions.text}`} 
            style={{ 
              letterSpacing: '-0.03em', 
              color: 'var(--text-primary)',
              fontSize: size === 'sm' ? '0.9375rem' : size === 'md' ? '1.125rem' : '1.375rem'
            }}
          >
            AVENZAQ
          </span>
          {size !== 'sm' && (
            <span 
              className="text-muted tracking-wide uppercase" 
              style={{ fontSize: '0.625rem', marginTop: '2px', letterSpacing: '0.12em', color: 'var(--text-muted)' }}
            >
              AUTOPILOT
            </span>
          )}
        </div>
      )}
    </div>
  );
};
