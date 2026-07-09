import { SignUp } from '@clerk/nextjs';
import Owl from '@/components/ui/Owl';

export default function SignUpPage() {
  return (
    <div className="grid min-h-dvh w-full lg:grid-cols-[1.05fr_1fr]" style={{ background: 'var(--paper)' }}>
      <section className="flex min-h-dvh flex-col justify-between p-8 lg:p-16" style={{ background: 'var(--duo-green-haze)' }}>
        <div className="flex items-center gap-2.5">
          <Owl size={36} />
          <span className="font-display text-xl font-extrabold" style={{ color: 'var(--duo-green-shadow)' }}>Lexa</span>
        </div>

        <div className="drift max-w-md">
          <Owl size={120} className="owl-bob mb-6" />
          <h1 className="font-display text-4xl font-extrabold leading-tight lg:text-6xl" style={{ color: 'var(--ink)' }}>
            Start your<br /><span className="serif-em">streak</span>.
          </h1>
          <p className="mt-5 max-w-sm text-base font-bold" style={{ color: 'var(--ink-muted)' }}>
            Build your vocabulary, review daily, and remember more with every session.
          </p>
        </div>

        <p className="eyebrow" style={{ color: 'var(--duo-green-shadow)' }}>Lexa — learn with flashcards</p>
      </section>

      <section className="flex items-center justify-center p-6 lg:p-12" style={{ background: 'var(--paper)' }}>
        <SignUp />
      </section>
    </div>
  );
}
