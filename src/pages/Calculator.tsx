import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSession, clearSession } from '../App'
import { startHeartbeat } from '../lib/sheets'
import { generateKpHtml } from '../lib/pdf'

function getSectionPrice(heightCm: number, widthCm: number): number {
  const isWide = widthCm > 60
  const isNonStd = widthCm < 55 || widthCm > 65
  let base: number
  if (heightCm <= 150) {
    base = 2000
  } else {
    base = isWide ? 3200 : 2500
    if (heightCm > 180) {
      const extraBlocks = Math.ceil((heightCm - 180) / 20)
      base = base * Math.pow(1.1, extraBlocks)
    }
  }
  if (isNonStd) base *= 1.05
  return Math.round(base)
}

const COLORS = [
  { id: 'white', label: 'White', hex: '#f5f5f5', border: '#ccc' },
  { id: 'black', label: 'Black', hex: '#222', border: '#555' },
  { id: 'beige', label: 'Beige', hex: '#d4b896', border: '#b8956d' },
  { id: 'gray',  label: 'Gray',  hex: '#9e9e9e', border: '#757575' },
]

const COLOR_LABELS: Record<string, string> = {
  white: 'Белый',
  black: 'Чёрный',
  beige: 'Бежевый',
  gray:  'Серый',
}

function FrontView({ sections, widthCm, heightCm, colorHex, svgId }: {
  sections: number; widthCm: number; heightCm: number; colorHex: string; svgId?: string
}) {
  const svgW = 480, svgH = 220, padX = 40, padY = 20
  const drawW = svgW - padX * 2, drawH = svgH - padY * 2
  const sW = drawW / sections
  const ratio = widthCm / heightCm
  const sH = Math.min(drawH, sW / ratio)
  const yOff = padY + (drawH - sH) / 2
  const hasWheels = heightCm >= 200
  return (
    <svg id={svgId} viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', maxWidth: 480 }}>
      {Array.from({ length: sections }).map((_, i) => {
        const x = padX + i * sW
        return (
          <g key={i}>
            <rect x={x+2} y={yOff} width={sW-4} height={sH} fill={colorHex} stroke="#555" strokeWidth={1.5} rx={2} />
            <line x1={x+sW/2} y1={yOff+8} x2={x+sW/2} y2={yOff+sH-8} stroke="#aaa" strokeWidth={0.8} strokeDasharray="4,3" />
            {hasWheels && (
              <>
                <ellipse cx={x+sW*0.25} cy={yOff+sH+6} rx={5} ry={4} fill="#555" />
                <ellipse cx={x+sW*0.75} cy={yOff+sH+6} rx={5} ry={4} fill="#555" />
              </>
            )}
          </g>
        )
      })}
      <line x1={padX-18} y1={yOff} x2={padX-18} y2={yOff+sH} stroke="#333" strokeWidth={1.2} markerEnd="url(#arr)" markerStart="url(#arr)" />
      <defs>
        <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#333" />
        </marker>
      </defs>
      <text x={padX-22} y={yOff+sH/2} textAnchor="middle" fontSize={10} fill="#333" transform={`rotate(-90,${padX-22},${yOff+sH/2})`}>
        {heightCm} {hasWheels ? 'cm+wheels' : 'cm'}
      </text>
      <line x1={padX} y1={yOff+sH+20} x2={padX+drawW} y2={yOff+sH+20} stroke="#333" strokeWidth={1.2} />
      <text x={padX+drawW/2} y={yOff+sH+34} textAnchor="middle" fontSize={11} fill="#333" fontWeight="600">
        {(sections*widthCm).toFixed(0)} cm total width
      </text>
      <text x={svgW/2} y={14} textAnchor="middle" fontSize={11} fill="#888" fontWeight="600">FRONT VIEW</text>
    </svg>
  )
}

function TopView({ sections, widthCm, heightCm, svgId }: {
  sections: number; widthCm: number; heightCm: number; svgId?: string
}) {
  const svgW = 480, svgH = 140, padX = 50, padY = 30
  const depthPx = 28, totalPx = svgW - padX*2, secPx = totalPx / sections
  const hasWheels = heightCm >= 200
  const pts: { x: number; y: number }[] = []
  for (let i = 0; i <= sections; i++) {
    pts.push({ x: padX + i*secPx, y: padY + (i%2===0 ? 0 : depthPx) })
  }
  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ')
  const midY = padY + depthPx/2
  return (
    <svg id={svgId} viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', maxWidth: 480 }}>
      <text x={svgW/2} y={14} textAnchor="middle" fontSize={11} fill="#888" fontWeight="600">TOP VIEW</text>
      {Array.from({ length: sections }).map((_, i) => {
        const x1=padX+i*secPx, x2=padX+(i+1)*secPx
        const y1=padY+(i%2===0?0:depthPx), y2=padY+((i+1)%2===0?0:depthPx)
        return (
          <polygon key={i}
            points={`${x1},${y1} ${x2},${y2} ${x2},${y2===padY?padY+depthPx:padY} ${x1},${y1===padY?padY+depthPx:padY}`}
            fill={i%2===0?'rgba(15,52,96,0.08)':'rgba(15,52,96,0.14)'} stroke="none" />
        )
      })}
      <polyline points={polyline} fill="none" stroke="#0f3460" strokeWidth={2} strokeLinejoin="round" />
      {pts.map((p,i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill="#0f3460" />)}
      {hasWheels && pts.map((p,i) => (
        <ellipse key={i} cx={p.x} cy={p.y} rx={6} ry={3} fill="none" stroke="#e53935" strokeWidth={1.5} />
      ))}
      {Array.from({ length: sections }).map((_, i) => {
        const cx=padX+(i+0.5)*secPx, cy=midY+(i%2===0?-6:6)
        return <text key={i} x={cx} y={cy} textAnchor="middle" fontSize={9} fill="#333">{widthCm}cm</text>
      })}
      <defs>
        <marker id="arrT" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#e53935" />
        </marker>
        <marker id="arrTL" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
          <path d="M0,0 L6,3 L0,6 Z" fill="#e53935" />
        </marker>
      </defs>
      <line x1={padX} y1={padY+depthPx+18} x2={padX+totalPx} y2={padY+depthPx+18} stroke="#e53935" strokeWidth={1.5} markerEnd="url(#arrT)" markerStart="url(#arrTL)" />
      <text x={padX+totalPx/2} y={padY+depthPx+32} textAnchor="middle" fontSize={11} fill="#e53935" fontWeight="700">
        Opening: {(sections*widthCm).toFixed(0)} cm
      </text>
      {hasWheels && (
        <text x={svgW/2} y={svgH-4} textAnchor="middle" fontSize={10} fill="#e53935">wheels</text>
      )}
    </svg>
  )
}

export default function Calculator() {
  const navigate = useNavigate()
  const session = getSession()

  useEffect(() => {
    if (!session) return
    const stop = startHeartbeat(session.code)
    return stop
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [openingCm, setOpeningCm] = useState(200)
  const [heightCm, setHeightCm]   = useState(180)
  const [customHeight, setCustomHeight] = useState('')
  const [widthMode, setWidthMode]  = useState<'auto'|'custom'>('auto')
  const [customWidthCm, setCustomWidthCm] = useState(60)
  const [color, setColor]    = useState(COLORS[0])
  const [clientName, setClientName] = useState('')
  const [note, setNote]      = useState('')
  const [copied, setCopied]  = useState(false)

  function autoSections(opening: number): { n: number; w: number } {
    for (let w = 65; w >= 55; w--) {
      const n = Math.round(opening / w)
      if (n < 2) continue
      const actual = opening / n
      if (actual >= 55 && actual <= 65) return { n, w: Math.round(actual) }
    }
    const n = Math.max(2, Math.round(opening / 60))
    return { n, w: Math.round(opening / n) }
  }

  const actualH = customHeight ? parseFloat(customHeight) || heightCm : heightCm
  const { n: autoN, w: autoW } = autoSections(openingCm)
  const sectionW     = widthMode === 'auto' ? autoW : customWidthCm
  const sectionCount = widthMode === 'auto' ? autoN : Math.max(2, Math.round(openingCm / customWidthCm))
  const pricePerSection = getSectionPrice(actualH, sectionW)
  const totalPrice   = pricePerSection * sectionCount
  const isNonStd     = sectionW < 55 || sectionW > 65
  const hasWheels    = actualH >= 200
  const colorLabel   = COLOR_LABELS[color.id] || color.label

  function handleLogout() { clearSession(); navigate('/') }

  function buildKpText(): string {
    const date = new Date().toLocaleDateString('ru-RU')
    const lines = [
      'КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ',
      '',
      clientName ? ('Клиент: ' + clientName) : '',
      'Дата: ' + date,
      session?.name ? ('Менеджер: ' + session.name) : '',
      '',
      'КОНФИГУРАЦИЯ ШИРМЫ:',
      '  Ширина проёма:     ' + openingCm + ' см',
      '  Высота секции:     ' + actualH + ' см' + (hasWheels ? ' (на колёсах)' : ''),
      '  Ширина секции:     ' + sectionW + ' см' + (isNonStd ? ' (+5% нестандарт)' : ''),
      '  Количество секций: ' + sectionCount + ' шт.',
      '  Общая ширина:      ' + (sectionCount * sectionW).toFixed(0) + ' см',
      '  Цвет ткани:        ' + colorLabel,
      '',
      'РАСЧЁТ СТОИМОСТИ:',
      '  Цена за секцию:    ' + pricePerSection.toLocaleString('ru-RU') + ' руб.',
      '  Количество:        ' + sectionCount + ' шт.',
      '  ─────────────────────────────────',
      '  ИТОГО:             ' + totalPrice.toLocaleString('ru-RU') + ' руб.',
      '',
      note ? ('Примечания: ' + note) : '',
      '',
      'Срок изготовления: 5 рабочих дней',
      'Производство и продажа ширм на заказ',
    ]
    return lines.filter(l => l !== '').join('\n')
  }

  async function handleCopyText() {
    const text = buildKpText()
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  function handlePDF() {
    const frontSvg = (document.getElementById('shirmy-front-svg') as SVGElement | null)?.outerHTML ?? ''
    const topSvg   = (document.getElementById('shirmy-top-svg')   as SVGElement | null)?.outerHTML ?? ''
    const html = generateKpHtml({
      clientName, note, managerName: session?.name ?? '',
      openingCm, actualH, sectionW, sectionCount, colorLabel,
      pricePerSection, totalPrice, hasWheels, isNonStd, frontSvg, topSvg,
    })
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const win  = window.open(url, '_blank')
    if (win) win.addEventListener('load', () => { setTimeout(() => { win.print(); URL.revokeObjectURL(url) }, 300) })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <div style={{ background: '#0f3460', color: '#fff', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24 }}>🪟</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Калькулятор ширм и перегородок</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>Менеджер: {session?.name}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
          Выйти
        </button>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 340px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card title="📐 Размеры">
            <Field label={'Ширина проёма: ' + openingCm + ' см'}>
              <input type="range" min={80} max={500} step={10} value={openingCm} onChange={e => setOpeningCm(+e.target.value)} style={{ width: '100%' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888' }}>
                <span>80 см</span><span>500 см</span>
              </div>
            </Field>
            <Field label="Высота секции">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[150, 180, 200, 210].map(h => (
                  <button key={h} onClick={() => { setHeightCm(h); setCustomHeight('') }} style={btnStyle(heightCm === h && !customHeight)}>
                    {h} см
                  </button>
                ))}
                <input type="number" placeholder="другая" min={100} max={300} value={customHeight} onChange={e => { setCustomHeight(e.target.value); setHeightCm(0) }} style={{ width: 80, padding: '6px 10px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14 }} />
              </div>
              {hasWheels && <div style={{ marginTop: 6, fontSize: 12, color: '#e53935', fontWeight: 600 }}>🔴 Высота ≥ 200 см — ширма на колёсах</div>}
            </Field>
            <Field label="Ширина секции">
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <button onClick={() => setWidthMode('auto')} style={btnStyle(widthMode === 'auto')}>Авто (под проём)</button>
                <button onClick={() => setWidthMode('custom')} style={btnStyle(widthMode === 'custom')}>Задать вручную</button>
              </div>
              {widthMode === 'custom' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="number" min={30} max={100} value={customWidthCm} onChange={e => setCustomWidthCm(+e.target.value)} style={{ width: 80, padding: '6px 10px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14 }} />
                  <span style={{ fontSize: 14, color: '#555' }}>см / секция</span>
                </div>
              )}
              {isNonStd && <div style={{ marginTop: 6, fontSize: 12, color: '#f57c00', fontWeight: 600 }}>⚠️ Нестандартная ширина — +5% к цене</div>}
            </Field>
          </Card>

          <Card title="🎨 Цвет ткани">
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <div key={c.id} onClick={() => setColor(c)} style={{ cursor: 'pointer', textAlign: 'center', opacity: color.id === c.id ? 1 : 0.5, transform: color.id === c.id ? 'scale(1.08)' : 'scale(1)', transition: 'all 0.15s' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: c.hex, border: '3px solid ' + (color.id === c.id ? '#0f3460' : c.border), boxShadow: color.id === c.id ? '0 0 0 2px #0f3460' : 'none', margin: '0 auto 4px' }} />
                  <div style={{ fontSize: 12, color: '#555' }}>{COLOR_LABELS[c.id]}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="📋 КП / Заметки">
            <Field label="Имя клиента (для КП)">
              <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Иван Иванов / Салон Стиль" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14 }} />
            </Field>
            <Field label="Заметки">
              <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Особые пожелания, адрес доставки..." rows={3} style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 13, resize: 'vertical' }} />
            </Field>
          </Card>
        </div>

        <div style={{ flex: '1 1 340px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card title="💰 Расчёт стоимости">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 14 }}>
              <Row label="Секций"        value={sectionCount + ' шт.'} />
              <Row label="Ширина секции" value={sectionW + ' см'} />
              <Row label="Высота секции" value={actualH + ' см'} />
              <Row label="Общая ширина"  value={(sectionCount * sectionW).toFixed(0) + ' см'} />
              <Row label="Цена / секция" value={pricePerSection.toLocaleString('ru-RU') + ' руб.'} />
              <Row label="Цвет"          value={colorLabel} />
            </div>
            <div style={{ marginTop: 16, padding: '14px', background: '#0f3460', borderRadius: 10, textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>ИТОГО</div>
              <div style={{ color: '#fff', fontSize: 32, fontWeight: 800 }}>{totalPrice.toLocaleString('ru-RU')} руб.</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 }}>{sectionCount} × {pricePerSection.toLocaleString('ru-RU')} руб.</div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={handleCopyText} style={{ flex: 1, padding: '12px', background: copied ? '#388e3c' : '#455a64', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}>
                {copied ? 'Скопировано!' : 'Копировать'}
              </button>
              <button onClick={handlePDF} style={{ flex: 1, padding: '12px', background: '#e53935', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Сохранить PDF
              </button>
            </div>
          </Card>

          <Card title="Вид спереди">
            <FrontView svgId="shirmy-front-svg" sections={sectionCount} widthCm={sectionW} heightCm={actualH} colorHex={color.hex} />
            <div style={{ textAlign: 'center', fontSize: 12, color: '#888', marginTop: 4 }}>
              {sectionCount} секц. × {sectionW} см = {(sectionCount * sectionW).toFixed(0)} см
            </div>
          </Card>

          <Card title="Вид сверху (гармошка)">
            <TopView svgId="shirmy-top-svg" sections={sectionCount} widthCm={sectionW} heightCm={actualH} />
          </Card>
        </div>
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
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
    padding: '7px 16px', borderRadius: 8,
    border: active ? '2px solid #0f3460' : '1.5px solid #d0d0d0',
    background: active ? '#0f3460' : '#fff',
    color: active ? '#fff' : '#444',
    fontWeight: active ? 700 : 500,
    cursor: 'pointer', fontSize: 13, transition: 'all 0.15s',
  }
}
