interface OwlProps {
  size?: number;
  className?: string;
  label?: string;
}

/**
 * Duo Owl mascot (copied from the Lovelife project).
 * All-gray chunky owl with a stern, focused look: angled feather brows
 * hood the eyes and a small furrow sits between them. Orange beak + feet.
 * Decorative by default; pass `label` to expose an accessible name.
 */
export default function Owl({ size = 96, className, label }: OwlProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        <radialGradient id="duo-owl-body" cx="0.42" cy="0.3" r="0.85">
          <stop offset="0%" stopColor="#eef1f4" />
          <stop offset="55%" stopColor="#c4cbd3" />
          <stop offset="100%" stopColor="#969ea9" />
        </radialGradient>
        <linearGradient id="duo-owl-wing" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#aab2bc" />
          <stop offset="100%" stopColor="#828b96" />
        </linearGradient>
      </defs>

      {/* ear tufts — peek out behind the head */}
      <path d="M20 14 C 16 6 19 3 22 4 C 24.5 5 24.5 10 23 15 Z" fill="#828b96" />
      <path d="M44 14 C 48 6 45 3 42 4 C 39.5 5 39.5 10 41 15 Z" fill="#828b96" />

      {/* body — chunky rounded blob */}
      <ellipse cx="32" cy="35" rx="23" ry="25" fill="url(#duo-owl-body)" />

      {/* wings — frame the sides */}
      <path d="M11 31 C 6.5 34 7 46 12 51 C 14.5 45 14.5 38 14 33 Z" fill="url(#duo-owl-wing)" />
      <path d="M53 31 C 57.5 34 57 46 52 51 C 49.5 45 49.5 38 50 33 Z" fill="url(#duo-owl-wing)" />

      {/* light face + belly panel */}
      <ellipse cx="32" cy="37" rx="18.5" ry="21" fill="#f7f9fb" />

      {/* eyes — big white discs */}
      <circle cx="24" cy="30.5" r="7.6" fill="#ffffff" stroke="#cdd5dd" strokeWidth="1.4" />
      <circle cx="40" cy="30.5" r="7.6" fill="#ffffff" stroke="#cdd5dd" strokeWidth="1.4" />
      {/* pupils — pulled toward the center for an intense, focused stare */}
      <circle cx="26" cy="31.4" r="3.9" fill="#2b333f" />
      <circle cx="38" cy="31.4" r="3.9" fill="#2b333f" />
      {/* catch-light */}
      <circle cx="24.6" cy="29.8" r="1.4" fill="#ffffff" />
      <circle cx="36.6" cy="29.8" r="1.4" fill="#ffffff" />

      {/* stern angled brows — outer high, inner low, hooding the eyes */}
      <path d="M13.5 22 Q 21.5 20.2 30 25 L 28.6 28.2 Q 20.8 24 13 25.2 Z" fill="#6f7986" />
      <path d="M50.5 22 Q 42.5 20.2 34 25 L 35.4 28.2 Q 43.2 24 51 25.2 Z" fill="#6f7986" />
      {/* furrow between the brows */}
      <path d="M32 24.5 L 32 27.8" stroke="#6f7986" strokeWidth="1.6" strokeLinecap="round" />

      {/* beak — orange Duo diamond */}
      <path d="M32 35 L 27.6 38.4 Q 32 43.4 36.4 38.4 Z" fill="#ff9600" />
      <path
        d="M29.2 39.4 Q 32 41 34.8 39.4"
        stroke="#cc7600"
        strokeWidth="0.9"
        fill="none"
        strokeLinecap="round"
      />

      {/* feet — orange three-toe */}
      <path
        d="M26 58.5 L 23.8 60.8 M 26 58.5 L 26 61.2 M 26 58.5 L 28.2 60.8"
        stroke="#ff9600"
        strokeWidth="2.3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M38 58.5 L 35.8 60.8 M 38 58.5 L 38 61.2 M 38 58.5 L 40.2 60.8"
        stroke="#ff9600"
        strokeWidth="2.3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
