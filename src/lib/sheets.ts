// Авторизация и трекинг через Apps Script (Google Sheets остаётся приватным)
//
// Структура таблицы (строки 2+):
// A: Имя менеджера  B: Токен  C: Активен  D: Телефон
// E: Дата добавления  F: Ссылка  G: Комментарий
// H: Последний вход  I: Посещений  J: Онлайн до

const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL as string

export type SheetUser = {
  name:     string
  token:    string
  enabled:  boolean
  phone:    string
  link:     string
  comment:  string
}

/** Проверяет токен через Apps Script doGet (таблица остаётся приватной). */
export async function verifyToken(token: string): Promise<SheetUser | null> {
  const url = `${SCRIPT_URL}?token=${encodeURIComponent(token.trim())}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Script error ' + res.status)
  const data = await res.json()
  if (!data.ok) return null
  return {
    name:    data.name    ?? '',
    token:   data.token   ?? '',
    enabled: true,
    phone:   data.phone   ?? '',
    link:    data.link    ?? '',
    comment: data.comment ?? '',
  }
}

/** Отправляет событие в Apps Script (fire-and-forget). */
function postScript(payload: object) {
  if (!SCRIPT_URL) return
  fetch(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {})
}

/** Фиксирует вход: обновляет «Последний вход» и «Посещений». */
export function trackVisit(token: string) {
  postScript({ action: 'visit', token })
}

/** Пинг каждые 2 мин: обновляет «Онлайн до» (колонка J). */
export function startHeartbeat(token: string): () => void {
  postScript({ action: 'ping', token }) // сразу
  const id = setInterval(() => postScript({ action: 'ping', token }), 2 * 60 * 1000)
  return () => clearInterval(id)
}
