import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Calculator from './pages/Calculator'
import Admin from './pages/Admin'

const SESSION_KEY = 'shirmy_user'

export function getSession(): { name: string; code: string } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setSession(name: string, code: string) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ name, code }))
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY)
}

function RequireAuth({ children }: { children: JSX.Element }) {
  return getSession() ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/calc"
          element={
            <RequireAuth>
              <Calculator />
            </RequireAuth>
          }
        />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
