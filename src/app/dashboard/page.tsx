import { redirect } from 'next/navigation';

// /dashboard is the onboarding completion target — send users to the main app
export default function DashboardPage() {
  redirect('/decks');
}
