import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import { ClerkProvider } from '@clerk/nextjs';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Lexa — learn with flashcards',
  description: 'Spaced repetition flashcards, the fun way.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${nunito.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: '#58CC02',
              colorBackground: '#FFFFFF',
              colorText: '#4B4B4B',
              colorTextSecondary: '#777777',
              colorInputBackground: '#FFFFFF',
              colorInputText: '#4B4B4B',
              fontFamily: 'var(--font-display), system-ui, sans-serif',
              borderRadius: '14px',
            },
            elements: {
              card: 'shadow-[0_8px_24px_rgba(0,0,0,0.10)] border-2 border-[#E5E5E5]',
              headerTitle: 'font-[family-name:var(--font-display)] font-extrabold',
              formButtonPrimary:
                'bg-[#58CC02] hover:brightness-105 shadow-[0_4px_0_#46A302] font-extrabold uppercase tracking-wide rounded-2xl',
              socialButtonsBlockButton: 'border-2 border-[#E5E5E5] rounded-2xl',
            },
          }}
        >
          <Providers>{children}</Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
