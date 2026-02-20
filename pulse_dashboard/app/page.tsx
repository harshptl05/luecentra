'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('pulse_access_token') : null;
    if (t) {
      router.replace('/dashboard');
    } else {
      setChecking(false);
    }
  }, [router]);

  if (checking) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: '4rem auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Pulse</h1>
      <p style={{ color: '#888', marginBottom: '2rem' }}>AI meeting assistant. Sign in to manage your subscription and download the app.</p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link href="/login" style={{ padding: '0.6rem 1.2rem', background: '#333', color: '#fff', borderRadius: 6, textDecoration: 'none' }}>
          Log in
        </Link>
        <Link href="/register" style={{ padding: '0.6rem 1.2rem', background: '#444', color: '#fff', borderRadius: 6, textDecoration: 'none' }}>
          Sign up
        </Link>
      </div>
    </div>
  );
}
