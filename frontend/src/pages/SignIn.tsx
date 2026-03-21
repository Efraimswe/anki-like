import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function SignIn() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.to(".auth-card-gsap", {
      scale: 1,
      opacity: 1,
      duration: 0.6,
      ease: "back.out(1.2)"
    })
    .to(".auth-item-gsap", {
      y: 0,
      opacity: 1,
      duration: 0.4,
      stagger: 0.08,
      ease: "power2.out"
    }, "-=0.3");
  }, { scope: container });

  useEffect(() => {
    if (user) {
      navigate('/decks');
    }
  }, [user, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/decks');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={container} className="min-h-screen flex items-center justify-center bg-(--color-bg-page) p-4 md:p-6">
      <div className="auth-card-gsap opacity-0 scale-95 w-full max-w-md">
        <div className="premium-card p-6 md:p-10 shadow-2xl border-none">
          <h2 className="auth-item-gsap opacity-0 -translate-y-4 text-2xl md:text-3xl font-extrabold text-(--color-accent) heading mb-8 tracking-tight">Sign In</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-4 rounded-2xl text-sm font-bold border border-red-100 dark:border-red-900/50 animate-in shake duration-300">
                {error}
              </div>
            )}
            <div className="auth-item-gsap opacity-0 translate-y-4 space-y-2">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted) ml-1">Email address</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                placeholder="you@example.com"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 bg-(--color-bg-page) border border-(--color-border) rounded-[1.25rem] font-medium focus:ring-2 focus:ring-(--color-accent-ring) outline-none transition-all placeholder:text-(--color-text-tertiary)/50"
              />
            </div>
            <div className="auth-item-gsap opacity-0 translate-y-4 space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted)">Password</label>
                <Link to="#" className="text-[10px] font-bold text-(--color-accent) hover:underline uppercase tracking-widest">Forgot?</Link>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-(--color-bg-page) border border-(--color-border) rounded-[1.25rem] font-medium focus:ring-2 focus:ring-(--color-accent-ring) outline-none transition-all placeholder:text-(--color-text-tertiary)/50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="auth-item-gsap opacity-0 translate-y-4 button-primary w-full py-4 text-lg mt-4 shadow-xl shadow-orange-500/20 active:scale-95 transition-transform"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authenticating...
                </span>
              ) : 'Access Account'}
            </button>
          </form>

          <div className="auth-item-gsap opacity-0 translate-y-4 mt-10 pt-8 border-t border-(--color-border) text-center">
            <p className="text-sm font-medium text-(--color-text-secondary)">
              Brand new here?{' '}
              <Link to="/sign-up" className="text-(--color-accent) font-bold hover:underline ml-1">Create an account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
