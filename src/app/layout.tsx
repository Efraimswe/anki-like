import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import DevResetButton from '@/components/DevResetButton';
import { getLocale, getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import { isRTL } from '@/i18n/rtl';

export const metadata: Metadata = {
  title: 'Anki-Like',
  description: 'Spaced repetition flashcard app',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} dir={isRTL(locale) ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}<DevResetButton /></Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
