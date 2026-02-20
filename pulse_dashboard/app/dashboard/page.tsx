'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMe, getBillingStatus, createCheckoutSession, getPortalSession, getSignedDownloadUrl, logout } from '@/lib/api';

type User = { id: string; email: string } | null;
type SubStatus = 'premium_active' | 'premium_grace' | 'inactive' | null;

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User>(null);
  const [subStatus, setSubStatus] = useState<SubStatus>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutMsg, setCheckoutMsg] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const check = searchParams.get('checkout');
    if (check === 'success') setCheckoutMsg('Payment successful. Your subscription is now active.');
    if (check === 'cancel') setCheckoutMsg('Checkout was cancelled.');
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const u = await getMe();
        if (cancelled) return;
        if (!u) {
          router.replace('/login');
          return;
        }
        setUser(u);
        if (cancelled) return;
        const billing = await getBillingStatus();
        if (!cancelled) setSubStatus(billing.premium_active ? 'premium_active' : 'inactive');
      } catch (_) {
        if (!cancelled) router.replace('/login');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  async function handleUpgrade() {
    setActionError('');
    setActionLoading(true);
    try {
      const { url } = await createCheckoutSession();
      if (url) window.location.href = url;
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to start checkout');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleManageBilling() {
    setActionError('');
    setActionLoading(true);
    try {
      const { url } = await getPortalSession();
      if (url) window.location.href = url;
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to open billing portal');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDownload() {
    setActionError('');
    setActionLoading(true);
    try {
      const { url } = await getSignedDownloadUrl();
      if (url) window.open(url, '_blank');
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to get download');
    } finally {
      setActionLoading(false);
    }
  }

  function handleLogout() {
    logout();
    router.replace('/');
    router.refresh();
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ maxWidth: 560, margin: '2rem auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem' }}>Dashboard</h1>
        <button onClick={handleLogout} style={{ padding: '0.4rem 0.8rem', background: 'transparent', border: '1px solid #555', color: '#ccc', borderRadius: 4, cursor: 'pointer' }}>
          Log out
        </button>
      </div>
      <p style={{ color: '#888', marginBottom: '1.5rem' }}>Signed in as {user.email}</p>

      {checkoutMsg && <p style={{ padding: '0.75rem', background: '#1a3d1a', borderRadius: 6, marginBottom: '1rem' }}>{checkoutMsg}</p>}
      {actionError && <p style={{ color: '#e66', marginBottom: '1rem' }}>{actionError}</p>}

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Subscription</h2>
        {subStatus === 'premium_active' ? (
          <div>
            <p style={{ color: '#6a6', marginBottom: '0.75rem' }}>You have an active subscription.</p>
            <button onClick={handleManageBilling} disabled={actionLoading} style={{ padding: '0.5rem 1rem', background: '#333', color: '#fff', border: 'none', borderRadius: 6, cursor: actionLoading ? 'not-allowed' : 'pointer' }}>
              Manage billing
            </button>
          </div>
        ) : (
          <div>
            <p style={{ color: '#888', marginBottom: '0.75rem' }}>Subscribe to unlock the app and downloads.</p>
            <button onClick={handleUpgrade} disabled={actionLoading} style={{ padding: '0.5rem 1rem', background: '#1a5fb4', color: '#fff', border: 'none', borderRadius: 6, cursor: actionLoading ? 'not-allowed' : 'pointer' }}>
              {actionLoading ? 'Opening...' : 'Upgrade'}
            </button>
          </div>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Downloads</h2>
        {subStatus === 'premium_active' ? (
          <div>
            <p style={{ color: '#888', marginBottom: '0.75rem' }}>Download the Pulse app for macOS. Link expires in 15 minutes.</p>
            <button onClick={handleDownload} disabled={actionLoading} style={{ padding: '0.5rem 1rem', background: '#1a5fb4', color: '#fff', border: 'none', borderRadius: 6, cursor: actionLoading ? 'not-allowed' : 'pointer' }}>
              {actionLoading ? 'Preparing...' : 'Download DMG'}
            </button>
          </div>
        ) : (
          <p style={{ color: '#666' }}>Subscribe to get access to the DMG download.</p>
        )}
      </section>
    </div>
  );
}
