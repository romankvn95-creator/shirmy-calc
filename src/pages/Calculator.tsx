import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSession, clearSession } from '../App'
import { startHeartbeat } from '../lib/sheets'

// ─── Ценообразование ────────────────────────────────────────────────
// Высота 150 см, ширина 55–60 см → 2 000 ₽/секция
// Высота 180 см, ширина 55–60 см → 2 500 ₽/секция
// Высота 180 см, ширина 60–65 см → 3 200 ₽/секция
// Выше 180 см: +10% за каждые 200 мм над 180 см
// Нестандартная ширина (<55 или >65): +5%

function getSectionPrice(heightCm: number, widthCm: number): number {
  const isWide = widthCm > 60 // >60cm → дороже
  const isNonStd = widthCm < 55 || widthCm > 65

  let base: number
  if (heightCm <= 150) {
    base = 2000 // любая стандартная ширина
  } else {
    // Базовая цена для 180 см
    base = isWide ? 3200 : 2500
    // Надбавка за каждые 200 мм свыше 180 см
    if (heightCm > 180) {
      const extraBlocks = Math.ceil((heightCm - 180) / 20)
      base = base * Math.pow(1.1, extraBlocks)
    }
  }

  if (isNonStd) base *= 1.05
  return Math.round(base)
}

// ─── Цвета ткани ────────────────────────────────────────────────────
const COLORS = [
  { id: 'white', label: 'Белый', hex: '#f5f5f5', border: '#ccc' },
  { id: 'black', label: 'Чёрный', hex: '#222', border: '#555' },
  { id: 'beige', label: 'Бежевый', hex: '#d4b896', border: '#b8956d' },
  { id: 'gray', label: 'Серый', hex: '#9e9e9e', border: '#757575' },
]

// ─── SVG: Вид спереди ───────────────────────────────────────────────
function FrontView({
  sections,
  widthCm,
  heightCm,
  colorHex,
}: {
  sections: number
  widthCm: number
  heightCm: number
  colorHex: string
}) {
  const svgW = 480
  const svgH = 220
  const padX = 40
  const padY = 20
  const drawW = svgW - padX * 2
  const drawH = svgH - padY * 2

  const sectionW = drawW / sections
  const ratio = widthCm / heightCm
  const sH = Math.min(drawH, sectionW / ratio)
  const sW = sectionW
  const yOff = padY + (drawH - sH) / 2

  const hasWheels = heightCm >= 200

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', maxWidth: 480 }}>
      {/* Секции */}
      {Array.from({ length: sections }).map((_, i) => {
        const x = padX + i * sW
        return (
          <g key={i}>
            <rect
              x={x + 2}
              y={yOff}
              width={sW - 4}
              height={sH}
              fill={colorHex}
              stroke="#555"
              strokeWidth={1.5}
              rx={2}
            />
            {/* Декоративная линия посередине */}
            <line
              x1={x + sW / 2}
              y1={yOff + 8}
              x2={x + sW / 2}
              y2={yOff + sH - 8}
              stroke="#aaa"
              strokeWidth={0.8}
              strokeDasharray="4,3"
            />
            {/* Колёса */}
            {hasWheels && (
              <>
                <ellipse cx={x + sW * 0.25} cy={yOff + sH + 6} rx={5} ry={4} fill="#555" />
                <ellipse cx={x + sW * 0.75} cy={yOff + sH + 6} rx={5} ry={4} fill="#555" />
              </>
            )}
          </g>
        )
      })}
      {/* Стрелка высоты */}
      <line x1={padX - 18} y1={yOff} x2={padX - 18} y2={yOff + sH} stroke="#333" strokeWidth={1.2} markerEnd="url(#arr)" markerStart="url(#arr)" />
      <defs>
        <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#333" />
        </marker>
      </defs>
      <text x={padX - 22} y={yOff + sH / 2} textAnchor="middle" fontSize={10} fill="#333" transform={`rotate(-90,${padX - 22},${yOff + sH / 2})`}>
        {heightCm} см{hasWheels ? ' + колёса' : ''}
      </text>
      {/* Общая ширина */}
      <line x1={padX} y1={yOff + sH + 20} x2={padX + drawW} y2={yOff + sH + 20} stroke="#333" strokeWidth={1.2} />
      <text x={padX + drawW / 2} y={yOff + sH + 34} textAnchor="middle" fontSize={11} fill="#333" fontWeight="600">
        {(sections * widthCm).toFixed(0)} см общая ширина
      </text>
      {/* Подпись */}
      <text x={svgW / 2} y={14} textAnchor="middle" fontSize={11} fill="#888" fontWeight="600">ВИД СПЕРЕДИ</text>
    </svg>
  )
}

// ─── SVG: Вид сверху (гармошка) ─────────────────────────────────────
function TopView({
  sections,
  widthCm,
  heightCm,
}: {
  sections: number
  widthCm: number
  heightCm: number
}) {
  const svgW = 480
  const svgH = 140
  const padX = 50
  const padY = 30

  const depthPx = 28 // глубина сложенной секции
  const totalPx = svgW - padX * 2
  const secPx = totalPx / sections
  const hasWheels = heightCm >= 200

  // Строим ломаную линию гармошки
  const pts: { x: number; y: number }[] = []
  for (let i = 0; i <= sections; i++) {
    const x = padX + i * secPx
    const y = padY + (i % 2 === 0 ? 0 : depthPx)
    pts.push({ x, y })
  }
  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ')

  const totalWidthCm = sections * widthCm
  const midY = padY + depthPx / 2

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', maxWidth: 480 }}>
      <text x={svgW / 2} y={14} textAnchor="middle" fontSize={11} fill="#888" fontWeight="600">
        ВИД СВЕРХУ (ГАРМОШКА)
      </text>

      {/* Заполнение гармошки */}
      {Array.from({ length: sections }).map((_, i) => {
        const x1 = padX + i * secPx
        const x2 = padX + (i + 1) * secPx
        const y1 = padY + (i % 2 === 0 ? 0 : depthPx)
        const y2 = padY + ((i + 1) % 2 === 0 ? 0 : depthPx)
        return (
          <polygon
            key={i}
            points={`${x1},${y1} ${x2},${y2} ${x2},${y2 === padY ? padY + depthPx : padY} ${x1},${y1 === padY ? padY + depthPx : padY}`}
            fill={i % 2 === 0 ? 'rgba(15,52,96,0.08)' : 'rgba(15,52,96,0.14)'}
            stroke="none"
          />
        )
      })}

      {/* Линия гармошки */}
      <polyline points={polyline} fill="none" stroke="#0f3460" strokeWidth={2} strokeLinejoin="round" />

      {/* Шарниры */}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#0f3460" />
      ))}

      {/* Колёса */}
      {hasWheels &&
        pts.map((p, i) => (
          <ellipse key={i} cx={p.x} cy={p.y} rx={6} ry={3} fill="none" stroke="#e53935" strokeWidth={1.5} />
        ))}

      {/* Подписи ширины секций */}
      {Array.from({ length: sections }).map((_, i) => {
        const cx = padX + (i + 0.5) * secPx
        const cy = midY + (i % 2 === 0 ? -6 : 6)
        return (
          <text key={i} x={cx} y={cy} textAnchor="middle" fontSize={9} fill="#333">
            {widthCm} см
          </text>
        )
      })}

      {/* Стрелка общей ширины */}
      <defs>
        <marker id="arrT" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#e53935" />
        </marker>
        <marker id="arrTL" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
          <path d="M0,0 L6,3 L0,6 Z" fill="#e53935" />
        </marker>
      </defs>
      <line
        x1={padX} y1={padY + depthPx + 18}
        x2={padX + totalPx} y2={padY + depthPx + 18}
        stroke="#e53935" strokeWidth={1.5}
        markerEnd="url(#arrT)" markerStart="url(#arrTL)"
      />
      <text
        x={padX + totalPx / 2} y={padY + depthPx + 32}
        textAnchor="middle" fontSize={11} fill="#e53935" fontWeight="700"
      >
        Ширина проёма: {totalWidthCm.toFixed(0)} см
      </text>

      {hasWheels && (
        <text x={svgW / 2} y={svgH - 4} textAnchor="middle" fontSize={10} fill="#e53935">
          🔴 Красные кружки = колёса (высота ≥ 200 см)
        </text>
      )}
    </svg>
  )
}

// ─── Основной компонент ──────────────────────────────────────────────
export default function Calculator() {
  const navigate = useNavigate()
  const session = getSession()

  // Heartbeat каждые 2 мин — фиксирует присутствие в таблице (колонка J)
  useEffect(() => {
    if (!session) return
    const stop = startHeartbeat(session.code)
    return stop
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [openingCm, setOpeningCm] = useState(200) // ширина проёма
  const [heightCm, setHeightCm] = useState(180) // высота секции
  const [customHeight, setCustomHeight] = useState('')
  const [widthMode, setWidthMode] = useState<'auto' | 'custom'>('auto')
  const [customWidthCm, setCustomWidthCm] = useState(60)
  const [color, setColor] = useState(COLORS[0])
  const [clientName, setClientName] = useState('')
  const [note, setNote] = useState('')

  // Авто-подбор числа секций и ширины под проём
  function autoSections(opening: number, h: number): { n: number; w: number } {
    // Целевая ширина секции: 55–65 см
    // Берём столько секций, чтобы каждая была 55–65 см
    for (let w = 65; w >= 55; w--) {
      const n = Math.round(opening / w)
      if (n < 2) continue
      const actual = opening / n
      if (actual >= 55 && actual <= 65) return { n, w: Math.round(actual) }
    }
    // Fallback
    const n = Math.max(2, Math.round(opening / 60))
    return { n, w: Math.round(opening / n) }
  }

  const actualH = customHeight ? parseFloat(customHeight) || heightCm : heightCm
  const { n: autoN, w: autoW } = autoSections(openingCm, actualH)
  const sectionW = widthMode === 'auto' ? autoW : customWidthCm
  const sectionCount = widthMode === 'auto' ? autoN : Math.max(2, Math.round(openingCm / customWidthCm))

  const pricePerSection = getSectionPrice(actualH, sectionW)
  const totalPrice = pricePerSection * sectionCount
  const isNonStd = sectionW < 55 || sectionW > 65
  const hasWheels = actualH >= 200

  function handleLogout() {
    clearSession()
    navigate('/')
  }

  function handleKP() {
    const lines = [
      `КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ`,
      ``,
      clientName ? `Клиент: ${clientName}` : '',
      `Дата: ${new Date().toLocaleDateString('ru-RU')}`,
      ``,
      `ПАРАМЕТРЫ ШИРМЫ:`,
      `  Ширина проёма: ${openingCm} см`,
      `  Высота секции: ${actualH} см${hasWheels ? ' (на колёсах)' : ''}`,
      `  Ширина секции: ${sectionW} см${isNonStd ? ' (+5% нестандарт)' : ''}`,
      `  Количество секций: ${sectionCount} шт.`,
      `  Цвет ткани: ${color.label}`,
      ``,
      `РАСЧЁТ СТОИМОСТИ:`,
      `  Цена за секцию: ${pricePerSection.toLocaleString('ru-RU')} ₽`,
      `  Количество: ${sectionCount} шт.`,
      `  ─────────────────────────────`,
      `  ИТОГО: ${totalPrice.toLocaleString('ru-RU')} ₽`,
      ``,
      note ? `Примечания: ${note}` : '',
      ``,
      `Производство и продажа ширм на заказ`,
      `Авито / АК — с 2019 года`,
    ].filter(l => l !== null)

    const text = lines.join('\n')
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `КП_${clientName || 'клиент'}_${new Date().toISOString().slice(0,10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* Шапка */}
      <div style={{
        background: '#0f3460', color: '#fff', padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24 }}>🪟</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Калькулятор ширм и перегородок</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>Менеджер: {session?.name}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={{
          background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
          padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
        }}>
          Выйти
        </button>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {/* Левая колонка — параметры */}
        <div style={{ flex: '1 1 340px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Блок: Размеры */}
          <Card title="📐 Размеры">
            <Field label={`Ширина проёма: ${openingCm} см`}>
              <input type="range" min={80} max={500} step={10} value={openingCm}
                onChange={e => setOpeningCm(+e.target.value)} style={{ width: '100%' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888' }}>
                <span>80 см</span><span>500 см</span>
              </div>
            </Field>

            <Field label="Высота секции">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[150, 180, 200, 210].map(h => (
                  <button key={h} onClick={() => { setHeightCm(h); setCustomHeight('') }}
                    style={btnStyle(heightCm === h && !customHeight)}>
                    {h} см
                  </button>
                ))}
                <input type="number" placeholder="другая" min={100} max={300}
                  value={customHeight}
                  onChange={e => { setCustomHeight(e.target.value); setHeightCm(0) }}
                  style={{ width: 80, padding: '6px 10px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14 }}
                />
              </div>
              {hasWheels && (
                <div style={{ marginTop: 6, fontSize: 12, color: '#e53935', fontWeight: 600 }}>
                  🔴 Высота ≥ 200 см — ширма на колёсах
                </div>
              )}
            </Field>

            <Field label="Ширина секции">
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <button onClick={() => setWidthMode('auto')} style={btnStyle(widthMode === 'auto')}>
                  Авто (под проём)
                </button>
                <button onClick={() => setWidthMode('custom')} style={btnStyle(widthMode === 'custom')}>
                  Задать вручную
                </button>
              </div>
              {widthMode === 'custom' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="number" min={30} max={100} value={customWidthCm}
                    onChange={e => setCustomWidthCm(+e.target.value)}
                    style={{ width: 80, padding: '6px 10px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14 }} />
                  <span style={{ fontSize: 14, color: '#555' }}>см / секция</span>
                </div>
              )}
              {isNonStd && (
                <div style={{ marginTop: 6, fontSize: 12, color: '#f57c00', fontWeight: 600 }}>
                  ⚠️ Нестандартная ширина — +5% к цене
                </div>
              )}
            </Field>
          </Card>

          {/* Блок: Цвет */}
          <Card title="🎨 Цвет ткани">
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <div key={c.id} onClick={() => setColor(c)} style={{
                  cursor: 'pointer', textAlign: 'center',
                  opacity: color.id === c.id ? 1 : 0.5,
                  transform: color.id === c.id ? 'scale(1.08)' : 'scale(1)',
                  transition: 'all 0.15s',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 8,
                    background: c.hex,
                    border: `3px solid ${color.id === c.id ? '#0f3460' : c.border}`,
                    boxShadow: color.id === c.id ? '0 0 0 2px #0f3460' : 'none',
                    margin: '0 auto 4px',
                  }} />
                  <div style={{ fontSize: 12, color: '#555' }}>{c.label}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Блок: Клиент */}
          <Card title="📋 КП / Заметки">
            <Field label="Имя клиента (для КП)">
              <input type="text" value={clientName} onChange={e => setClientName(e.target.value)}
                placeholder="Иван Иванов / Салон 'Стиль'"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14 }} />
            </Field>
            <Field label="Заметки">
              <textarea value={note} onChange={e => setNote(e.target.value)}
                placeholder="Особые пожелания, адрес доставки..."
                rows={3}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 13, resize: 'vertical' }} />
            </Field>
          </Card>
        </div>

        {/* Правая колонка — результат */}
        <div style={{ flex: '1 1 340px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Итог */}
          <Card title="💰 Расчёт стоимости">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 14 }}>
              <Row label="Секций" value={`${sectionCount} шт.`} />
              <Row label="Ширина секции" value={`${sectionW} см`} />
              <Row label="Высота секции" value={`${actualH} см`} />
              <Row label="Общая ширина" value={`${(sectionCount * sectionW).toFixed(0)} см`} />
              <Row label="Цена / секция" value={`${pricePerSection.toLocaleString('ru-RU')} ₽`} />
              <Row label="Цвет" value={color.label} />
            </div>
            <div style={{
              marginTop: 16, padding: '14px', background: '#0f3460', borderRadius: 10,
              textAlign: 'center',
            }}>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>ИТОГО</div>
              <div style={{ color: '#fff', fontSize: 32, fontWeight: 800 }}>
                {totalPrice.toLocaleString('ru-RU')} ₽
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 }}>
                {sectionCount} × {pricePerSection.toLocaleString('ru-RU')} ₽
              </div>
            </div>
            <button onClick={handleKP} style={{
              marginTop: 12, width: '100%', padding: '12px',
              background: '#e53935', color: '#fff', border: 'none',
              borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}>
              📄 Скачать КП (.txt)
            </button>
          </Card>

          {/* Вид спереди */}
          <Card title="🔲 Вид спереди">
            <FrontView sections={sectionCount} widthCm={sectionW} heightCm={actualH} colorHex={color.hex} />
            <div style={{ textAlign: 'center', fontSize: 12, color: '#888', marginTop: 4 }}>
              {sectionCount} секц. × {sectionW} см = {(sectionCount * sectionW).toFixed(0)} см
            </div>
          </Card>

          {/* Вид сверху */}
          <Card title="🔀 Вид сверху (гармошка)">
            <TopView sections={sectionCount} widthCm={sectionW} heightCm={actualH} />
          </Card>
        </div>
      </div>
    </div>
  )
}

// ─── Мелкие UI-компоненты ────────────────────────────────────────────
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '18px 20px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: '#0f3460', marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <div style={{ color: '#888' }}>{label}</div>
      <div style={{ fontWeight: 600, color: '#222', textAlign: 'right' }}>{value}</div>
    </>
  )
}
function btnStyle(active: boolean): React.CSSProperties {
  return {
    padding: '7px 16px',
    borderRadius: 8,
    border: active ? '2px solid #0f3460' : '1.5px solid #d0d0d0',
    background: active ? '#0f3460' : '#fff',
    color: active ? '#fff' : '#444',
    fontWeight: active ? 700 : 500,
    cursor: 'pointer',
    fontSize: 13,
    transition: 'all 0.15s',
  }
}
