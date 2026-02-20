'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email.trim(), password);
      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '4rem auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Sign up</h1>
      <form onSubmit={handleSubmit}>
        {error && <p style={{ color: '#e66', marginBottom: '1rem' }}>{error}</p>}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: 4, color: '#aaa' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem', background: '#222', border: '1px solid #444', borderRadius: 4, color: '#fff' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: 4, color: '#aaa' }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            style={{ width: '100%', padding: '0.5rem', background: '#222', border: '1px solid #444', borderRadius: 4, color: '#fff' }}
          />
        </div>
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.6rem', background: '#1a5fb4', color: '#fff', border: 'none', borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <p style={{ marginTop: '1rem', color: '#888' }}>
        Already have an account? <Link href="/login">Log in</Link>
      </p>
      <p style={{ marginTop: '1rem' }}>
        <Link href="/">Back to home</Link>
      </p>
    </div>
  );
}
