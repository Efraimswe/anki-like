import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DeckDetailPage } from '@/pages/deck-detail';
import { DeckListPage } from '@/pages/deck-list';
import { ReviewSessionPage } from '@/pages/review-session';
import { SignInPage } from '@/pages/sign-in';
import { SignUpPage } from '@/pages/sign-up';
import LoadingSpinner from '@/shared/ui/loading-spinner';
import { AppLayout } from '@/widgets/app-layout';
import { SettingsFrame } from '@/widgets/settings-frame';
import ProtectedRoute from './ProtectedRoute';

const SettingsIndexPage = lazy(() =>
  import('@/pages/settings-index').then((module) => ({ default: module.SettingsIndexPage })),
);
const SettingsProfilePage = lazy(() =>
  import('@/pages/settings-profile').then((module) => ({ default: module.SettingsProfilePage })),
);
const SettingsSessionsPage = lazy(() =>
  import('@/pages/settings-sessions').then((module) => ({ default: module.SettingsSessionsPage })),
);

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/decks" element={<DeckListPage />} />
            <Route path="/decks/:id" element={<DeckDetailPage />} />
            <Route path="/decks/:id/review" element={<ReviewSessionPage />} />
            <Route
              path="/settings"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <SettingsFrame />
                </Suspense>
              }
            >
              <Route index element={<SettingsIndexPage />} />
              <Route path="profile" element={<SettingsProfilePage />} />
              <Route path="sessions" element={<SettingsSessionsPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/decks" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
