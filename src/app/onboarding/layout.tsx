import ProgressChrome from './_components/ProgressChrome';
import StepDots from './_components/StepDots';
import { OnboardingLocaleProvider } from '@/components/onboarding/OnboardingLocaleProvider';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="onboarding-root min-h-screen"
      style={{ background: 'var(--color-bg-page)' }}
    >
      <ProgressChrome />
      <main className="w-full">
        <OnboardingLocaleProvider>{children}</OnboardingLocaleProvider>
      </main>
      <StepDots />
    </div>
  );
}
