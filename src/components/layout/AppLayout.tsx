'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { Layers, Trophy } from 'lucide-react';
import Owl from '@/components/ui/Owl';

const NAV_ITEMS = [
  { href: '/decks', label: 'Learn', Icon: Layers },
  { href: '/skills', label: 'Skills', Icon: Trophy },
];

function Wordmark() {
  return (
    <Link href="/decks" className="flex items-center gap-2.5">
      <Owl size={36} />
      <span className="font-display text-xl font-extrabold tracking-tight" style={{ color: 'var(--duo-green)' }}>
        Lexa
      </span>
    </Link>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <div className="min-h-dvh flex flex-col">
      {/* —— Top bar (≥1024px) —— */}
      <header className="nav-topbar hidden lg:block">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Wordmark />
            <nav className="flex items-center gap-2">
              {NAV_ITEMS.map(({ href, label, Icon }) => (
                <Link key={href} href={href} className="nav-pill" data-active={isActive(href)}>
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2.5} />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
          </div>
          <UserButton appearance={{ elements: { userButtonAvatarBox: { width: 36, height: 36 } } }} />
        </div>
      </header>

      {/* —— Mobile top header (<1024px) —— */}
      <header className="lg:hidden flex items-center justify-between px-5 h-14 border-b-2" style={{ borderColor: 'var(--rule)' }}>
        <Wordmark />
        <UserButton appearance={{ elements: { userButtonAvatarBox: { width: 34, height: 34 } } }} />
      </header>

      {/* —— Main —— */}
      <main className="flex-1 pb-24 lg:pb-0">
        <div className="mx-auto w-full max-w-5xl px-5 pt-6 pb-10 lg:px-8 lg:pt-10">
          {children}
        </div>
      </main>

      {/* —— Bottom tab bar (<1024px) —— */}
      <nav className="nav-tabbar flex lg:hidden">
        {NAV_ITEMS.map(({ href, label, Icon }) => (
          <Link key={href} href={href} className="nav-tab btn-spring" data-active={isActive(href)}>
            <Icon className="h-6 w-6" strokeWidth={2.5} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
