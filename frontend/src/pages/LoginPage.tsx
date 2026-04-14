import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const { login, register } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      if (isRegister) await register(email, username, password)
      else await login(username, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to authenticate')
    }
  }

  return (
    <section className="card form-card stack">
      <div className="section-heading">
        <div>
          <h2>{isRegister ? 'Create your adventurer account' : 'Return to the realm'}</h2>
          <p>{isRegister ? 'Make an account to save characters, parties, and campaigns.' : 'Sign in to access your saved characters and campaigns.'}</p>
        </div>
        <div className="section-tags">
          <span className="tag">{isRegister ? 'New player setup' : 'Account login'}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form-grid">
        {isRegister ? (
          <label>
            Email address
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mage@realm.com" autoComplete="email" />
            <span className="field-hint">Used for account recovery and collaboration invites.</span>
          </label>
        ) : null}

        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Stormwarden" autoComplete="username" />
          <span className="field-hint">Pick the name your party will recognize in shared spaces.</span>
        </label>

        <label>
          Password
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Choose a password" autoComplete={isRegister ? 'new-password' : 'current-password'} />
          <span className="field-hint">{isRegister ? 'Choose a password you can remember.' : 'Enter the password for this account.'}</span>
        </label>

        {error ? <p className="error">{error}</p> : null}

        <button type="submit">{isRegister ? 'Register account' : 'Login'}</button>
      </form>

      <button className="linklike" onClick={() => setIsRegister((v) => !v)}>
        {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
      </button>
    </section>
  )
}