import { useEffect, useState } from 'react';
import './AuthControls.css';

function AuthControls() {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');

    const isSignup = mode === 'signup';
    const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';
    const body = isSignup ? { name, email, password } : { email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Request failed.');

      setUser(data.user);
      setPassword('');
      setOpen(false);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    if (response.ok) setUser(null);
  }

  return (
    <div className="auth-controls">
      {user ? (
        <>
          <span className="auth-greeting">Hi, {user.name}</span>
          <button className="auth-button" onClick={handleLogout}>
            Log out
          </button>
        </>
      ) : (
        <button
          className="auth-button"
          onClick={() => {
            setMode('login');
            setMessage('');
            setOpen(true);
          }}
        >
          Login
        </button>
      )}

      {open && (
        <div className="auth-overlay">
          <section className="auth-card" role="dialog" aria-modal="true">
            <button
              className="auth-close"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              ×
            </button>

            <h2>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h2>

            <form onSubmit={handleSubmit}>
              {mode === 'signup' && (
                <label>
                  Name
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                </label>
              )}

              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  required
                />
              </label>

              {message && <p className="auth-message">{message}</p>}

              <button className="auth-submit" disabled={busy}>
                {busy ? 'Please wait…' : mode === 'signup' ? 'Sign up' : 'Log in'}
              </button>
            </form>

            <p className="auth-switch">
              {mode === 'signup' ? 'Already registered?' : 'New to ProDSA?'}{' '}
              <button
                onClick={() => {
                  setMode(mode === 'signup' ? 'login' : 'signup');
                  setMessage('');
                }}
              >
                {mode === 'signup' ? 'Log in' : 'Create account'}
              </button>
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

export default AuthControls;