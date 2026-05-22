// Генератор HTML для КП (отдельный .ts файл — без JSX-парсинга)

export interface KpParams {
  clientName: string
  note: string
  managerName: string
  openingCm: number
  actualH: number
  sectionW: number
  sectionCount: number
  colorLabel: string
  pricePerSection: number
  totalPrice: number
  hasWheels: boolean
  isNonStd: boolean
  frontSvg: string
  topSvg: string
}

export function generateKpHtml(p: KpParams): string {
  const date = new Date().toLocaleDateString('ru-RU')
  const totalStr   = p.totalPrice.toLocaleString('ru-RU')
  const perSecStr  = p.pricePerSection.toLocaleString('ru-RU')
  const totalWidth = (p.sectionCount * p.sectionW).toFixed(0)

  const metaManager = p.managerName
    ? '<span>Менеджер: <strong>' + p.managerName + '</strong></span>'
    : ''

  const wheelNote  = p.hasWheels ? ' <em>(на колёсах)</em>' : ''
  const nonstdNote = p.isNonStd  ? ' <em>(+5% нестандарт)</em>' : ''

  const noteBlock = p.note
    ? '<div class="note"><strong>Примечания:</strong> ' + p.note + '</div>'
    : ''

  return [
    '<!DOCTYPE html>',
    '<html lang="ru">',
    '<head>',
    '  <meta charset="UTF-8">',
    '  <title>КП — Ширма' + (p.clientName ? ' — ' + p.clientName : '') + '</title>',
    '  <style>',
    '    @page { margin: 18mm 20mm; size: A4; }',
    '    * { box-sizing: border-box; margin: 0; padding: 0; }',
    '    body { font-family: Arial, Helvetica, sans-serif; color: #1a1a2e; font-size: 13px; line-height: 1.55; }',
    '    h1 { font-size: 19px; text-align: center; text-transform: uppercase; letter-spacing: 2px; color: #0f3460; margin-bottom: 3px; }',
    '    .subtitle { text-align: center; color: #888; font-size: 11px; margin-bottom: 18px; }',
    '    .meta { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 18px; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px; }',
    '    .sec { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #0f3460; border-bottom: 2px solid #0f3460; padding-bottom: 3px; margin: 16px 0 10px; }',
    '    table { width: 100%; border-collapse: collapse; font-size: 13px; }',
    '    td { padding: 6px 8px; border-bottom: 1px solid #f0f0f0; }',
    '    td:first-child { color: #666; width: 55%; }',
    '    td:last-child { font-weight: 600; text-align: right; }',
    '    .total-box { background: #0f3460; color: white; padding: 14px 20px; border-radius: 8px; text-align: center; margin: 14px 0; }',
    '    .total-label { font-size: 11px; opacity: 0.7; margin-bottom: 3px; }',
    '    .total-amount { font-size: 26px; font-weight: 800; }',
    '    .total-breakdown { font-size: 11px; opacity: 0.6; margin-top: 3px; }',
    '    .note { background: #f5f5f5; border-left: 3px solid #0f3460; padding: 8px 12px; font-size: 12px; margin: 10px 0; border-radius: 0 4px 4px 0; }',
    '    .diagrams { display: flex; gap: 12px; margin-top: 6px; }',
    '    .diagram { flex: 1; min-width: 0; }',
    '    .diagram-title { font-size: 10px; color: #888; font-weight: bold; text-align: center; margin-bottom: 4px; }',
    '    svg { width: 100%; height: auto; display: block; }',
    '    .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e0e0e0; font-size: 10px; color: #aaa; text-align: center; }',
    '    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }',
    '  </style>',
    '</head>',
    '<body>',
    '  <h1>Коммерческое предложение</h1>',
    '  <div class="subtitle">Ширмы и перегородки на заказ</div>',
    '  <div class="meta">',
    '    <span>Клиент: <strong>' + (p.clientName || '—') + '</strong></span>',
    '    <span>Дата: <strong>' + date + '</strong></span>',
    '    ' + metaManager,
    '  </div>',
    '  <div class="sec">Конфигурация</div>',
    '  <table>',
    '    <tr><td>Ширина про&#x451;ма</td><td>' + p.openingCm + ' см</td></tr>',
    '    <tr><td>Высота секции</td><td>' + p.actualH + ' см' + wheelNote + '</td></tr>',
    '    <tr><td>Ширина секции</td><td>' + p.sectionW + ' см' + nonstdNote + '</td></tr>',
    '    <tr><td>Количество секций</td><td>' + p.sectionCount + ' шт.</td></tr>',
    '    <tr><td>Общая ширина</td><td>' + totalWidth + ' см</td></tr>',
    '    <tr><td>Цвет ткани</td><td>' + p.colorLabel + '</td></tr>',
    '  </table>',
    '  <div class="sec">Стоимость</div>',
    '  <table>',
    '    <tr><td>Цена за секцию</td><td>' + perSecStr + ' ₽</td></tr>',
    '    <tr><td>Количество секций</td><td>' + p.sectionCount + ' шт.</td></tr>',
    '  </table>',
    '  <div class="total-box">',
    '    <div class="total-label">ИТОГО К ОПЛАТЕ</div>',
    '    <div class="total-amount">' + totalStr + ' ₽</div>',
    '    <div class="total-breakdown">' + p.sectionCount + ' × ' + perSecStr + ' ₽</div>',
    '  </div>',
    '  ' + noteBlock,
    '  <div class="sec">Схема</div>',
    '  <div class="diagrams">',
    '    <div class="diagram">',
    '      <div class="diagram-title">ВИД СПЕРЕДИ</div>',
    '      ' + p.frontSvg,
    '    </div>',
    '    <div class="diagram">',
    '      <div class="diagram-title">ВИД СВЕРХУ (ГАРМОШКА)</div>',
    '      ' + p.topSvg,
    '    </div>',
    '  </div>',
    '  <div class="footer">',
    '    Производство и продажа ширм на заказ · Авито / АК · с 2019 года · Срок изготовления: 5 рабочих дней',
    '  </div>',
    '</body>',
    '</html>',
  ].join('\n')
}
