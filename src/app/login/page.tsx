'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>HOSI-LINK</h1>
          <p>Healthcare Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>Demo accounts (password: any 6+ chars)</p>
          <ul>
            <li>Paramedic: paramedic@hosi.link</li>
            <li>ICU Manager: icu@hosi.link</li>
            <li>Blood Bank: blood@hosi.link</li>
            <li>Admin: admin@hosi.link</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1E3A5F 0%, #4A90A4 100%);
        }

        .login-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          padding: 48px;
          width: 100%;
          max-width: 420px;
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .login-header h1 {
          color: #1E3A5F;
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .login-header p {
          color: #718096;
          font-size: 14px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          color: #1A202C;
          font-size: 14px;
          font-weight: 500;
        }

        .form-group input {
          padding: 12px 16px;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-group input:focus {
          outline: none;
          border-color: #4A90A4;
          box-shadow: 0 0 0 3px rgba(74, 144, 164, 0.1);
        }

        .error-message {
          background: #FED7D7;
          color: #C53030;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
        }

        .login-button {
          background: #1E3A5F;
          color: white;
          padding: 14px 24px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .login-button:hover:not(:disabled) {
          background: #2D4A6F;
        }

        .login-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-footer {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #E2E8F0;
          text-align: center;
        }

        .login-footer p {
          color: #718096;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .login-footer ul {
          list-style: none;
          font-size: 12px;
          color: #4A5568;
        }

        .login-footer li {
          margin: 4px 0;
        }
      `}</style>
    </div>
  )
}