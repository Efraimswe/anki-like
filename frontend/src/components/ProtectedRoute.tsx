import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ThemeProvider } from '../hooks/useTheme';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--color-bg-page)">
        <p className="text-(--color-text-tertiary)">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <ThemeProvider>
      <Outlet />
    </ThemeProvider>
  );
}
