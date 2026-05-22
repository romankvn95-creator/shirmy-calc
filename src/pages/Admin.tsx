// Панель администратора — управление пользователями ведётся в Google Таблице
// VITE_ADMIN_SHEET_URL задаётся в GitHub Secrets

const SHEET_URL = import.meta.env.VITE_ADMIN_SHEET_URL as string

export default function Admin() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: '40px 48px',
        width: 380,
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>📊</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>
          Управление менеджерами
        </div>
        <div style={{ fontSize: 14, color: '#666', marginBottom: 28, lineHeight: 1.5 }}>
          Добавление, удаление и управление токенами<br />
          доступа — напрямую в Google Таблице.
        </div>
        {SHEET_URL ? (
          <a
            href={SHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '13px 28px',
              background: '#0f3460',
              color: '#fff',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Открыть таблицу →
          </a>
        ) : (
          <div style={{ color: '#e53935', fontSize: 13 }}>
            VITE_ADMIN_SHEET_URL не задан
          </div>
        )}
        <div style={{ marginTop: 20, fontSize: 12, color: '#aaa' }}>
          <a href="/" style={{ color: '#0f3460' }}>← Назад ко входу</a>
        </div>
      </div>
    </div>
  )
}
