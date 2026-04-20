'use client';

import Image from 'next/image';

type LeoSize = 'md' | 'lg';

interface LeoCharacterProps {
  className?: string;
  animate?: 'float' | 'wave' | 'none';
  size?: LeoSize;
  showNametag?: boolean;
  speechBubble?: string;
}

const SIZE_PX: Record<LeoSize, number> = { md: 240, lg: 320 };

export function LeoCharacter({
  className = '',
  animate = 'float',
  size = 'md',
  showNametag = false,
  speechBubble,
}: LeoCharacterProps) {
  const px = SIZE_PX[size];
  const animClass = animate === 'float' ? 'leo-float' : animate === 'wave' ? 'leo-wave' : '';

  return (
    <div className={`relative flex flex-col items-center ${className}`} style={{ width: px }}>
      {/* floating character */}
      <div className={`relative ${animClass}`} style={{ width: px, height: px }}>
        <Image
          src="/leo.png"
          alt="Leo - your English tutor"
          width={px}
          height={px}
          style={{ filter: 'drop-shadow(0 16px 32px rgba(0,0,0,0.18))' }}
          priority
        />
      </div>

      {/* pulsing shadow plate */}
      <div
        style={{
          width: px * 0.55,
          height: 14,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.12)',
          marginTop: -8,
          animation: 'shadow-pulse 4s ease-in-out infinite',
        }}
      />

      {/* nametag */}
      {showNametag && (
        <div
          style={{
            marginTop: 10,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 9999,
            padding: '4px 12px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--color-success)',
              display: 'inline-block',
              animation: 'pulse-rec 1.4s ease-out infinite',
            }}
          />
          <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--color-text-primary)' }}>Leo</span>
        </div>
      )}

      {/* speech bubble */}
      {speechBubble && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: '100%',
            marginLeft: 12,
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 16,
            padding: '12px 16px',
            maxWidth: 220,
            boxShadow: 'var(--shadow-card)',
            fontSize: '0.875rem',
            lineHeight: 1.5,
            color: 'var(--color-text-primary)',
          }}
        >
          {/* arrow */}
          <span
            style={{
              position: 'absolute',
              left: -8,
              top: 16,
              width: 0,
              height: 0,
              borderTop: '8px solid transparent',
              borderBottom: '8px solid transparent',
              borderRight: '8px solid var(--color-bg-surface)',
            }}
          />
          {speechBubble}
        </div>
      )}
    </div>
  );
}
