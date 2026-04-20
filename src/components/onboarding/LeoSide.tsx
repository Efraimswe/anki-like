'use client';

import Image from 'next/image';

interface LeoSideProps {
  speech: string;
  nametag?: string;
  /** Extra content to render below the speech bubble (e.g. selected-value chip) */
  extra?: React.ReactNode;
}

export function LeoSide({ speech, nametag = 'Leo', extra }: LeoSideProps) {
  return (
    <div className="onb-leo-stack onb-panel-leo">
      {/* nametag */}
      <div className="onb-leo-nametag">
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--color-success)',
            display: 'inline-block',
            animation: 'pulse-rec 1.4s ease-out infinite',
            flexShrink: 0,
          }}
        />
        {nametag}
      </div>

      {/* floating Leo image with shadow */}
      <div className="leo-float onb-leo-anchor">
        <Image
          src="/leo.png"
          alt="Leo - your English tutor"
          width={240}
          height={240}
          priority
        />
      </div>
      <div className="onb-leo-shadow" aria-hidden />

      {/* speech bubble */}
      <div className="onb-speech-bubble">
        {speech}
      </div>

      {extra && (
        <div style={{ marginTop: 10, width: '100%' }}>
          {extra}
        </div>
      )}
    </div>
  );
}
