import { useState } from 'react';

const API_BASE = (import.meta.env.VITE_BACKEND_URL as string) || "http://localhost:5000";

interface LoginProps {
  onNavigate: (page: 'landing' | 'signup' | 'dashboard') => void;
  onLoginSuccess: (jwt: string) => void;
}

export default function Login({ onNavigate, onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('📡 Sending login request to:', `${API_BASE}/api/auth/login`);
      console.log('📦 Data:', { email, password: '***' });
      
      const resp = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      console.log('📥 Response status:', resp.status);
      const data = await resp.json();
      console.log('📥 Response data:', data);

      if (resp.ok) {
        console.log('✅ Login successful, navigating to dashboard');
        onLoginSuccess(data.token);
      } else {
        setError(data.error || 'Login failed. Please check your credentials.');
      }
    } catch (e) {
      console.error('❌ Login error:', e);
      setError(`Network error: ${e instanceof Error ? e.message : 'Cannot connect to server. Make sure backend is running on port 5000'}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      console.log('🔗 Requesting Google OAuth URL from:', `${API_BASE}/api/auth/google/url`);
      const resp = await fetch(`${API_BASE}/api/auth/google/url`);
      console.log('📥 Response status:', resp.status);
      
      if (!resp.ok) {
        throw new Error(`Failed to get OAuth URL: ${resp.status}`);
      }
      
      const data = await resp.json();
      console.log('📥 Response data:', data);
      
      if (data.url) {
        console.log('✅ Redirecting to Google OAuth...');
        window.location.href = data.url;
      } else {
        throw new Error('No URL received from server');
      }
    } catch (e) {
      console.error('❌ Google login error:', e);
      setError(`Failed to connect with Google: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          {/* Logo */}
          <div className="auth-logo" onClick={() => onNavigate('landing')} style={{ cursor: 'pointer' }}>
            <span className="logo-icon">🥗</span>
            <span className="logo-text">NutriTrack AI</span>
          </div>

          {/* Header */}
          <div className="auth-header">
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to continue to your dashboard</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert-error" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn-auth-primary" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-divider">
            <span>or</span>
          </div>

          {/* Google Sign In */}
          <button className="btn-google btn-google-full" onClick={handleGoogleLogin} disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.184l-2.909-2.258c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853"/>
              <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Sign Up Link */}
          <p className="auth-footer">
            Don't have an account?{' '}
            <a onClick={() => onNavigate('signup')} className="auth-link">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
