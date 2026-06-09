import { useState } from 'react'
import { initializeApp, getApps } from 'firebase/app'
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyBdIUZeel6FclteVnnxWbW3_fT24qqv7Nk",
  authDomain: "propane-avatar-476809-q2.firebaseapp.com",
  projectId: "propane-avatar-476809-q2",
  storageBucket: "propane-avatar-476809-q2.firebasestorage.app",
  messagingSenderId: "199913414397",
  appId: "1:199913414397:web:83cef26b2fd2db59832894"
}

const app = getApps().length === 0 ? 
  initializeApp(firebaseConfig) : getApps()[0]
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()

export default function AuthModal({ onClose, mode = 'login' }) {
  const [isLogin, setIsLogin] = useState(mode === 'login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGoogle = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await signInWithPopup(auth, googleProvider)
      console.log('Google login success:', result.user)
      onClose && onClose(result.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEmail = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      let result
      if (isLogin) {
        result = await signInWithEmailAndPassword(
          auth, email, password)
      } else {
        result = await createUserWithEmailAndPassword(
          auth, email, password)
        await updateProfile(result.user, { 
          displayName: name 
        })
      }
      console.log('Email auth success:', result.user)
      onClose && onClose(result.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, 
      right: 0, bottom: 0, 
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 9999
    }}>
      <div style={{
        background: '#fff', padding: '40px',
        borderRadius: '8px', width: '420px',
        maxWidth: '90vw'
      }}>
        <button onClick={() => onClose && onClose()}
          style={{float: 'right', background: 'none',
            border: 'none', fontSize: '20px', 
            cursor: 'pointer'}}>×</button>
        
        <h2 style={{textAlign: 'center', 
          color: '#0A1628', marginBottom: '8px'}}>
          {isLogin ? 'Log In' : 'Create Account'}
        </h2>
        <p style={{textAlign: 'center', 
          color: '#666', marginBottom: '24px',
          fontSize: '14px'}}>
          Economical Research
        </p>

        <div style={{
          background: '#e8f5e9', padding: '8px 12px',
          borderRadius: '4px', marginBottom: '20px',
          fontSize: '12px', color: '#2e7d32'
        }}>
          🟢 Firebase Live — Real Authentication
        </div>

        {error && (
          <div style={{
            background: '#ffebee', color: '#c62828',
            padding: '8px 12px', borderRadius: '4px',
            marginBottom: '16px', fontSize: '13px'
          }}>{error}</div>
        )}

        <form onSubmit={handleEmail}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              style={{width: '100%', padding: '12px',
                border: '1px solid #ddd', borderRadius: '4px',
                marginBottom: '12px', boxSizing: 'border-box',
                fontSize: '14px'}}
            />
          )}
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{width: '100%', padding: '12px',
              border: '1px solid #ddd', borderRadius: '4px',
              marginBottom: '12px', boxSizing: 'border-box',
              fontSize: '14px'}}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{width: '100%', padding: '12px',
              border: '1px solid #ddd', borderRadius: '4px',
              marginBottom: '16px', boxSizing: 'border-box',
              fontSize: '14px'}}
          />
          <button type="submit" disabled={loading}
            style={{width: '100%', padding: '14px',
              background: '#0A1628', color: '#F4A726',
              border: 'none', borderRadius: '4px',
              fontSize: '15px', fontWeight: '600',
              cursor: 'pointer', marginBottom: '16px'}}>
            {loading ? 'Please wait...' : 
              isLogin ? 'Log In →' : 'Create Account →'}
          </button>
        </form>

        <div style={{textAlign: 'center', 
          color: '#999', marginBottom: '16px',
          fontSize: '13px'}}>OR</div>

        <button onClick={handleGoogle} disabled={loading}
          style={{width: '100%', padding: '14px',
            background: '#fff', color: '#333',
            border: '1px solid #ddd', borderRadius: '4px',
            fontSize: '15px', cursor: 'pointer',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '10px'}}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Sign in with Google
        </button>

        <p style={{textAlign: 'center', marginTop: '20px',
          fontSize: '13px', color: '#666'}}>
          {isLogin ? 
            "Don't have an account? " : 
            "Already have an account? "}
          <span onClick={() => setIsLogin(!isLogin)}
            style={{color: '#0A1628', cursor: 'pointer',
              fontWeight: '600'}}>
            {isLogin ? 'Sign up' : 'Log in'}
          </span>
        </p>
      </div>
    </div>
  )
}
