'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { NextIntlClientProvider, useMessages } from 'next-intl';
import { readDraft } from '@/lib/onboarding/clientState';
import { LOCALES } from '@/i18n/routing';
import { isRTL } from '@/i18n/rtl';

type Messages = Record<string, unknown>;

export function OnboardingLocaleProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const parentMessages = useMessages();
  const [locale, setLocale] = useState('en');
  const [messages, setMessages] = useState<Messages>(parentMessages as Messages);
  const loadedLocale = useRef<string | null>(null);

  useEffect(() => {
    async function load() {
      const lang = readDraft().nativeLanguage;
      if (!lang || !(LOCALES as readonly string[]).includes(lang)) return;
      if (loadedLocale.current === lang) return;
      const msgs = (await import(`../../../messages/${lang}.json`)).default as Messages;
      loadedLocale.current = lang;
      setLocale(lang);
      setMessages(msgs);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== 'onboardingDraft') return;
      const lang = readDraft().nativeLanguage;
      if (!lang || !(LOCALES as readonly string[]).includes(lang)) return;
      import(`../../../messages/${lang}.json`).then((m) => {
        loadedLocale.current = lang;
        setLocale(lang);
        setMessages(m.default as Messages);
      });
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <div dir={isRTL(locale) ? 'rtl' : 'ltr'}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </div>
  );
}
