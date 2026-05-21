import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { verifyToken } from '../lib/sheets'
import { setSession, getSession } from '../App'

const S = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' } as React.CSSProperties,
  card: { background: '#fff', borderRadius: 16, padding: '40px 48px', width: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.4)', textAlign: 'center' } as React.CSSProperties,
  logo: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 700, color: '#1a1a2e', marginBottom: 4 },
  sub: { fontSize: 14, color: '#666', marginBottom: 28 },
  label: { display: 'block', textAlign: 'left', fontSize: 13, color: '#444', marginBottom: 6, fontWeight: 600 } as React.CSSProperties,
  input: { width: '100%', padding: '12px 16px', fontSize: 16, letterSpacing: 3, textAlign: 'center', border: '2px solid #e0e0e0', borderRadius: 10, outline: 'none', marginBottom: 20, fontFamily: 'monospace' } as React.CSSProperties,
  btn: { width: '100%', padding: '13px', background: '#0f3460', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer' } as React.CSSProperties,
  err: { color: '#e53935', fontSize: 13, marginTop: 12 },
}

export default function Login() {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (getSession()) { navigate('/calc', { replace: true }); return }
    const params = new URLSearchParams(window.location.search)
    const t = params.get('token') || params.get('t')
    if (t) doLogin(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function doLogin(tok: string) {
    if (!tok.trim()) return
    setLoading(true)
    setError('')
    try {
      const user = await verifyToken(tok.trim())
      if (!user) {
        setError('Неверный токен или доступ отключён')
      } else {
        setSession(user.name, user.token)
        navigate('/calc', { replace: true })
      }
    } catch {
      setError('Ошибка соединения. Попробуйте ещё раз.')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) { e.preventDefault(); doLogin(token) }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>🪟</div>
        <div style={S.title}>Калькулятор ширм</div>
        <div style={S.sub}>Введите токен доступа</div>
        <form onSubmit={handleSubmit}>
          <label style={S.label}>Токен</label>
          <input style={S.input} type="text" value={token} onChange={e => setToken(e.target.value)} placeholder="Ваш токен" autoFocus autoComplete="off" spellCheck={false} disabled={loading} />
          <button style={S.btn} type="submit" disabled={loading}>
            {loading ? 'Проверяем...' : 'Войти'}
          </button>
        </form>
        {error && <div style={S.err}>{error}</div>}
      </div>
    </div>
  )
}
