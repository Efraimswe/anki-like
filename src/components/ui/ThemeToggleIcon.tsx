'use client';

import { useEffect, useId, useRef } from 'react';
import { gsap } from 'gsap';

interface Props {
  theme: string;
  className?: string;
  size?: number;
}

export default function ThemeToggleIcon({ theme, className, size = 20 }: Props) {
  const reactId = useId();
  const maskId = `tt-mask-${reactId.replace(/:/g, '')}`;

  const svgRef = useRef<SVGSVGElement>(null);
  const sunRef = useRef<SVGCircleElement>(null);
  const maskRef = useRef<SVGCircleElement>(null);
  const raysRef = useRef<SVGGElement>(null);
  const initializedRef = useRef(false);
  const isMoon = theme === 'dark';

  useEffect(() => {
    if (!sunRef.current || !maskRef.current || !raysRef.current || !svgRef.current) return;
    const rays = Array.from(raysRef.current.children);

    if (!initializedRef.current) {
      if (isMoon) {
        gsap.set(sunRef.current, { attr: { r: 9 } });
        gsap.set(maskRef.current, { attr: { r: 8 } });
        gsap.set(rays, { scale: 0, svgOrigin: '12 12' });
        gsap.set(svgRef.current, { rotate: -45, transformOrigin: '50% 50%' });
      }
      initializedRef.current = true;
      return;
    }

    gsap.to(sunRef.current, {
      attr: { r: isMoon ? 9 : 6 },
      duration: 0.6,
      ease: 'back.out(1.7)',
      overwrite: true,
    });
    gsap.to(maskRef.current, {
      attr: { r: isMoon ? 8 : 0 },
      duration: 0.6,
      ease: 'back.out(1.7)',
      overwrite: true,
    });
    gsap.to(rays, {
      scale: isMoon ? 0 : 1,
      duration: 0.4,
      ease: 'power2.inOut',
      stagger: { from: 'random', amount: 0.2 },
      svgOrigin: '12 12',
      overwrite: true,
    });
    gsap.to(svgRef.current, {
      rotate: isMoon ? -45 : 0,
      duration: 0.5,
      ease: 'power3.out',
      transformOrigin: '50% 50%',
      overwrite: true,
    });
  }, [isMoon]);

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <mask id={maskId}>
          <rect width="24" height="24" fill="white" />
          <circle ref={maskRef} cx="17" cy="7" r="0" fill="black" />
        </mask>
      </defs>
      <circle ref={sunRef} cx="12" cy="12" r="6" mask={`url(#${maskId})`} fill="currentColor" />
      <g ref={raysRef} stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none">
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </g>
    </svg>
  );
}
