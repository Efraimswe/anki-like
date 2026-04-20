'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import words from '@/data/b1-b2-random-word-style.json';

export default function RephrasingsPage() {
  const t = useTranslations('rephrase');
  const [word, setWord] = useState('');
  const [checks, setChecks] = useState(() => Array.from({ length: 20 }, () => false));

  const randomizeWord = () => {
    const nextWord = words[Math.floor(Math.random() * words.length)];
    setWord(nextWord);
  };

  const toggleCheck = (index: number) => {
    setChecks((prev) => prev.map((checked, currentIndex) => (currentIndex === index ? !checked : checked)));
  };

  return (
    <section className="space-y-6">
      <div className="premium-card p-8 md:p-10">
        <div className="space-y-3">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-(--color-accent)">
            {t('eyebrow')}
          </p>
          <h1 className="text-3xl font-bold heading">{t('title')}</h1>
          <p className="max-w-2xl text-(--color-text-secondary)">
            {t('description')}
          </p>
        </div>
      </div>

      <div className="premium-card p-8 md:p-10">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-(--color-text-muted)">
                {t('wordViewLabel')}
              </p>
              <div className="min-h-32 rounded-[2rem] border border-(--color-border) bg-(--color-bg-page) px-6 py-8 md:px-8 flex items-center">
                <span className="heading text-4xl md:text-6xl font-bold tracking-tight text-(--color-text-primary) break-all">
                  {word || t('pressRandomize')}
                </span>
              </div>
              <p className="text-sm text-(--color-text-secondary)">
                {t('sourcePool', { count: words.length })}
              </p>
            </div>

            <button
              type="button"
              onClick={randomizeWord}
              className="button-primary px-8 py-4 text-base md:text-lg self-start lg:self-auto"
            >
              {t('randomizeButton')}
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-(--color-text-muted)">
              {t('wordsLabel')}
            </p>
            <div className="grid grid-cols-5 gap-3 md:gap-4 w-fit">
              {checks.map((checked, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => toggleCheck(index)}
                  aria-pressed={checked}
                  className={`flex h-12 w-12 items-center justify-center rounded-full border transition-all ${
                    checked
                      ? 'border-green-600 bg-green-600 text-white'
                      : 'border-(--color-border-strong) bg-(--color-bg-page) text-transparent hover:border-green-500/60'
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
