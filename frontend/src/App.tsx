import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import DeckList from './pages/DeckList';
import DeckDetail from './pages/DeckDetail';
import ReviewSession from './pages/ReviewSession';
import Settings from './pages/Settings';
import AllCards from './pages/AllCards';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/decks" element={<DeckList />} />
              <Route path="/decks/:id" element={<DeckDetail />} />
              <Route path="/decks/:id/review" element={<ReviewSession />} />
              <Route path="/cards" element={<AllCards />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/decks" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
