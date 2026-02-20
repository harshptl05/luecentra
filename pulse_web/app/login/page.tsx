'use client'

import { useRouter } from 'next/navigation'
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/utils/firebase'
import { Chrome, Mail } from 'lucide-react'
import { useState, useEffect } from 'react'

const MIN_PASSWORD_LENGTH = 8

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isElectronMode, setIsElectronMode] = useState(false)
  const [showSignUp, setShowSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const mode = urlParams.get('mode')
    setIsElectronMode(mode === 'electron')
  }, [])

  const completeAuthInApp = async (user: { uid: string; email: string | null; displayName: string | null; getIdToken: () => Promise<string> }) => {
    const isInElectron = isElectronMode ||
      (typeof window !== 'undefined' && window.navigator.userAgent.includes('Electron')) ||
      (typeof window !== 'undefined' && typeof (window as any).require === 'function')
    if (isInElectron) {
      try {
        const idToken = await user.getIdToken()
        const deepLinkUrl = `pickleglass://auth-success?` + new URLSearchParams({
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          token: idToken
        }).toString()
        window.location.href = deepLinkUrl
      } catch {
        router.push('/settings')
      }
    } else {
      router.push('/settings')
    }
  }

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider()
    setIsLoading(true)
    setError(null)
    try {
      const result = await signInWithPopup(auth, provider)
      if (result.user) await completeAuthInApp(result.user)
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        setError('Sign in failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Please enter your email address.')
      return
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (showSignUp && !name.trim()) {
      setError('Please enter your name.')
      return
    }
    setIsLoading(true)
    try {
      if (showSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password)
        const user = cred.user
        if (name.trim() && user) {
          const { updateProfile } = await import('firebase/auth')
          await updateProfile(user, { displayName: name.trim() })
        }
        if (user) await completeAuthInApp(user)
      } else {
        const cred = await signInWithEmailAndPassword(auth, trimmedEmail, password)
        if (cred.user) await completeAuthInApp(cred.user)
      }
    } catch (err: any) {
      const code = err?.code
      if (code === 'auth/email-already-in-use') {
        setError('This email is already registered. Try logging in instead.')
      } else if (code === 'auth/weak-password') {
        setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Invalid email or password.')
      } else {
        setError(err?.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-full bg-gray-50 flex flex-col items-center justify-center px-8 py-12">
      <div className="text-center mb-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Pulse Glass</h1>
        <p className="text-gray-600 mt-2 text-lg">Sign in with your Google account to sync your data across all devices.</p>
        {isElectronMode ? (
          <p className="text-sm text-blue-600 mt-3 font-medium">🔗 Login requested from Electron app</p>
        ) : (
          <p className="text-sm text-gray-500 mt-3">Local mode will run if you don't sign in.</p>
        )}
      </div>
      
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Chrome className="h-5 w-5" />
            <span>{isLoading ? 'Signing in...' : 'Sign in with Google'}</span>
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          <form onSubmit={handleEmailSignUp} className="space-y-4">
            {showSignUp && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={showSignUp ? 'Min 8 characters' : 'Your password'}
                autoComplete={showSignUp ? 'new-password' : 'current-password'}
              />
              {showSignUp && (
                <p className="mt-1 text-xs text-gray-500">Use a secure password, at least 8 characters.</p>
              )}
            </div>
            {error && (
              <p className="text-sm text-red-600" role="alert">{error}</p>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mail className="h-4 w-4" />
              {showSignUp ? 'Create account' : 'Log in with email'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            {showSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => { setShowSignUp(!showSignUp); setError(null); }}
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              {showSignUp ? 'Log in' : 'Sign up'}
            </button>
          </p>
          
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                if (isElectronMode) {
                  window.location.href = 'pickleglass://auth-success?uid=default_user&email=contact@pulse.com&displayName=Default%20User'
                } else {
                  router.push('/settings')
                }
              }}
              className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
            >
              Continue in local mode
            </button>
          </div>
        </div>
        
        <p className="text-center text-xs text-gray-500 mt-6">
          By signing in, you agree to our{' '}
          <a href="/settings/privacy" className="text-blue-600 hover:text-blue-700 underline">Terms of Service</a>
          {' '}and{' '}
          <a href="/settings/privacy" className="text-blue-600 hover:text-blue-700 underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  )
} 