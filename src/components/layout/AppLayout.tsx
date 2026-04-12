'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';

const navItems = [
  {
    href: '/decks',
    label: 'Decks',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.429 9.75m11.142 0 4.179 2.25L12 17.25 2.25 12l4.179-2.25m11.142 0 4.179 2.25L12 22.5l-9.75-5.25 4.179-2.25" />
      </svg>
    ),
  },
  {
    href: '/rephrasings',
    label: 'Rephrasings',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 4.5h6m-9 7.5h9.75A2.25 2.25 0 0 0 16.5 18V5.25A2.25 2.25 0 0 0 14.25 3H6A2.25 2.25 0 0 0 3.75 5.25v12.5A2.25 2.25 0 0 0 6 20.25Zm12-12 2.25 2.25-6.75 6.75H11.25v-2.25L18 8.25Z" />
      </svg>
    ),
  },
  {
    href: '/fairy-tales',
    label: 'Fairy Tales',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6.75v10.5m0-10.5c-1.864-1.34-4.75-1.34-6.75 0v10.5c2-1.34 4.886-1.34 6.75 0m0-10.5c1.864-1.34 4.75-1.34 6.75 0v10.5c-2-1.34-4.886-1.34-6.75 0"
        />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    ),
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('sidebar-collapsed') === 'true' : false,
  );
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.to('.sidebar-island', { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' });
    gsap.to('.nav-item-gsap', { x: 0, opacity: 1, duration: 0.5, stagger: 0.08, delay: 0.4, ease: 'power2.out' });
    gsap.to('.outlet-gsap', { y: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: 'power2.out' });
  }, { scope: container });

  const toggle = () => {
    setCollapsed((prev) => {
      localStorage.setItem('sidebar-collapsed', String(!prev));
      return !prev;
    });
  };

  const isActive = (href: string) => pathname.startsWith(href);

  const sunIcon = (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
  );

  const moonIcon = (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
    </svg>
  );

  return (
    <div ref={container} className="min-h-screen flex flex-col lg:flex-row bg-(--color-bg-page) text-(--color-text-primary) p-4 md:p-4 lg:py-0 lg:pr-6 lg:pl-0 lg:gap-6">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between py-2 px-1 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-(--color-accent) to-orange-400 flex items-center justify-center text-white text-xs font-bold shadow-lg">
            {(user?.displayName || user?.email || '?')[0].toUpperCase()}
          </div>
          <span className="text-xl font-bold text-(--color-text-primary) heading truncate">Anki-Like</span>
        </div>
        <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-(--color-text-secondary) hover:text-white transition-all">
          {theme === 'dark' ? sunIcon : moonIcon}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar-island opacity-0 -translate-x-24 fixed top-0 bottom-0 left-0 z-30 hidden lg:flex flex-col sidebar-glass sidebar-rail shadow-2xl overflow-hidden ${collapsed ? 'w-20' : 'w-64'}`} style={{ transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <div className={`flex items-center justify-between h-20 px-6 ${collapsed ? 'flex-col gap-4 py-6' : ''}`}>
          {!collapsed && <span className="text-xl font-bold text-(--color-sidebar-text) heading truncate">Anki-Like</span>}
          <button onClick={toggle} className="p-2 rounded-xl text-(--color-sidebar-text-muted) hover:text-(--color-sidebar-text) hover:bg-(--color-sidebar-active-bg) transition-all" title={collapsed ? 'Expand' : 'Collapse'}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-2 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined} className={`nav-item-gsap flex items-center gap-4 rounded-2xl ${collapsed ? 'justify-center p-3' : 'px-4 py-3'} ${isActive(item.href) ? 'bg-(--color-sidebar-active-bg) text-(--color-sidebar-text) shadow-lg' : 'text-(--color-sidebar-text-muted) hover:text-(--color-sidebar-text) hover:bg-(--color-sidebar-active-bg) transition-colors duration-200'}`}>
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && <span className="text-sm font-semibold tracking-wide whitespace-nowrap">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 space-y-3">
          <button onClick={toggleTheme} className={`flex items-center gap-4 w-full rounded-2xl text-(--color-sidebar-text-muted) hover:text-(--color-sidebar-text) hover:bg-(--color-sidebar-active-bg) transition-all ${collapsed ? 'justify-center p-3' : 'px-4 py-3'}`}>
            {theme === 'dark' ? sunIcon : moonIcon}
            {!collapsed && <span className="text-sm font-semibold whitespace-nowrap">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          <div className={`flex items-center rounded-2xl bg-(--color-sidebar-active-bg) p-3 ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-(--color-accent) to-orange-400 flex items-center justify-center text-white text-sm font-bold shadow-lg">
              {(user?.displayName || user?.email || '?')[0].toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-(--color-sidebar-text) truncate whitespace-nowrap">{user?.displayName || user?.email}</p>
                <button onClick={signOut} className="text-[10px] uppercase font-bold text-(--color-sidebar-text-muted) hover:text-(--color-accent) transition-colors mt-0.5 whitespace-nowrap">Sign Out</button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className={`flex-1 transition-all duration-300 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'} ml-0 mb-20 lg:mb-0`}>
        <div className="outlet-gsap opacity-0 -translate-y-4 max-w-6xl mx-auto pt-8 pb-4">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 sidebar-glass flex items-center justify-around px-3 py-3 shadow-2xl backdrop-blur-xl border-t border-white/10">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={`flex flex-col items-center p-2 rounded-xl transition-all ${isActive(item.href) ? 'text-(--color-accent)' : 'text-(--color-text-muted) hover:text-(--color-text-secondary)'}`}>
            <span className="scale-110">{item.icon}</span>
            <span className="text-[9px] font-bold mt-1 uppercase tracking-widest">{item.label}</span>
          </Link>
        ))}
        <button onClick={signOut} className="flex flex-col items-center p-2 rounded-xl text-(--color-text-muted) hover:text-red-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
          </svg>
          <span className="text-[9px] font-bold mt-1 uppercase tracking-widest">Exit</span>
        </button>
      </nav>
    </div>
  );
}
