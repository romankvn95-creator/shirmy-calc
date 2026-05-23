import { useState, useMemo } from 'react';
import { Download, Copy, Check, LayoutGrid, RefreshCw, FileText } from 'lucide-react';
import { CALC_CONFIG, demoGallery } from './config';

export default function App() {
  const [selectedImage, setSelectedImage] = useState<typeof demoGallery[0] | null>(null);
  const [showKP, setShowKP] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [mode, setMode] = useState<'client' | 'manager'>('client');
  const [params, setParams] = useState({
    width: 2000, height: 1800, color: 'Белый', frame: 'Дерево', customer: ''
  });

  // ── PDF: открыть чистый HTML-документ в новом окне и напечатать ──────
  const handleSavePDF = () => {
    const kpNum = Math.floor(Math.random() * 90000) + 10000;
    const dateStr = new Date().toLocaleDateString('ru-RU');
    const html = `<!DOCTYPE html>
<html lang="ru"><head><meta charset="UTF-8">
<title>КП №${kpNum} от ${dateStr}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
@page{margin:15mm 20mm}
body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:11pt;line-height:1.5}
.hdr{background:#0f172a;color:#fff;padding:16pt 20pt;margin-bottom:20pt}
.hdr h1{font-size:18pt;font-weight:900;text-transform:uppercase;letter-spacing:1px}
.hdr p{color:#94a3b8;font-size:9pt;margin-top:3pt}
.row{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #e2e8f0;padding-bottom:12pt;margin-bottom:16pt;gap:20pt}
.lbl{font-size:9pt;color:#64748b;text-transform:uppercase;font-weight:700;margin-bottom:3pt}
.val{font-size:13pt;font-weight:700}
.section-title{font-size:9pt;font-weight:900;color:#4f46e5;text-transform:uppercase;letter-spacing:2px;border-left:3px solid #4f46e5;padding-left:8pt;margin:16pt 0 10pt}
.specs{display:grid;grid-template-columns:1fr 1fr;gap:6pt 30pt;margin-bottom:16pt}
.spec{display:flex;justify-content:space-between;border-bottom:1px solid #f1f5f9;padding:5pt 0}
.spec span:first-child{color:#64748b}
.spec span:last-child{font-weight:700}
.total-block{display:flex;justify-content:space-between;align-items:flex-end;border-top:2px solid #0f172a;padding-top:16pt;margin-top:8pt;gap:20pt}
.terms .t1{font-size:9pt;color:#64748b;text-transform:uppercase;font-weight:700;margin-bottom:5pt}
.terms .t2{font-size:13pt;font-weight:700}
.terms .t3{color:#64748b;font-size:10pt;margin-top:3pt}
.terms .t3 b{color:#4f46e5}
.price-block{text-align:right}
.price-block .pl{font-size:9pt;color:#64748b;text-transform:uppercase;font-weight:700;margin-bottom:4pt}
.price-block .pv{font-size:30pt;font-weight:900;letter-spacing:-1px;line-height:1}
.disclaimer{margin-top:14pt;background:#fffbeb;border-left:3px solid #f59e0b;padding:8pt 10pt;font-size:9pt;color:#92400e;line-height:1.5}
@media print{body{padding:0}}
</style></head><body>
<div class="hdr"><h1>Коммерческое предложение</h1><p>№ ${kpNum} &nbsp;&bull;&nbsp; ${dateStr}</p></div>
<div class="row">
  <div><div class="lbl">Поставщик</div><div class="val">Ширмы и Перегородки</div></div>
  <div style="text-align:right"><div class="lbl">Заказчик</div><div class="val">${params.customer || 'Частный клиент'}</div></div>
</div>
<div class="section-title">Технические характеристики</div>
<div class="specs">
  <div class="spec"><span>Ширина проёма</span><span>${params.width} мм</span></div>
  <div class="spec"><span>Высота секции</span><span>${params.height} мм</span></div>
  <div class="spec"><span>Кол-во секций</span><span>${calcResults.sections} шт.</span></div>
  <div class="spec"><span>Цвет ткани</span><span>${params.color}</span></div>
  <div class="spec"><span>Материал каркаса</span><span>${params.frame}</span></div>
  <div class="spec"><span>Наполнение</span><span>Нейлон</span></div>
</div>
<div class="total-block">
  <div class="terms">
    <div class="t1">Условия поставки</div>
    <div class="t2">Срок изготовления: ${calcResults.term} рабочих дней</div>
    <div class="t3">Предоплата ${CALC_CONFIG.prepaymentRate * 100}%: <b>${calcResults.prepayment.toLocaleString()} ₽</b></div>
  </div>
  <div class="price-block">
    <div class="pl">Итого к оплате</div>
    <div class="pv">${Math.round(calcResults.total).toLocaleString()} ₽</div>
  </div>
</div>
<div class="disclaimer">Предварительный расчёт действителен 5 рабочих дней. Для оформления заказа свяжитесь с нами.</div>
<script>window.onload=function(){window.print();}<\/script>
</body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  // ── Копировать текст КП ─────────────────────────────────────────────────
  const handleCopyText = () => {
    const lines = [
      '📋 КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ',
      '',
      params.customer ? `👤 Заказчик: ${params.customer}` : '👤 Заказчик: Частный клиент',
      `📅 Дата: ${new Date().toLocaleDateString('ru-RU')}`,
      '',
      '📐 ПАРАМЕТРЫ ШИРМЫ:',
      `• Ширина проёма: ${params.width} мм`,
      `• Высота секции: ${params.height} мм`,
      `• Количество секций: ${calcResults.sections} шт.`,
      `• Материал каркаса: ${params.frame}`,
      `• Цвет ткани: ${params.color}`,
      `• Наполнение: Нейлон`,
      '',
      '💰 СТОИМОСТЬ:',
      `• Итого: ${Math.round(calcResults.total).toLocaleString()} ₽`,
      `• Предоплата 70%: ${calcResults.prepayment.toLocaleString()} ₽`,
      `• Срок изготовления: ${calcResults.term} рабочих дней`,
      '',
      '⚡ Расчёт действителен 5 рабочих дней.',
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    });
  };

  const handleNumChange = (key: string, val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '');
    setParams(prev => ({ ...prev, [key]: cleaned === '' ? 0 : Number(cleaned) }));
  };

  const calcResults = useMemo(() => {
    // 1. Calculate sections
    const sections = Math.ceil(params.width / CALC_CONFIG.sectionWidth) || 1;
    
    // Find frame material multiplier and color
    const frameData = CALC_CONFIG.frameMaterials.find(f => f.name === params.frame);
    const frameStrokeColor = frameData?.color || '#8b5e3c';

    // 2. Base price per section based on height
    let pricePerSection = 2500; // default for 1800
    if (params.height <= 1500) {
      pricePerSection = 2000;
    } else if (params.height <= 1800) {
      pricePerSection = 2500;
    } else {
      // Height above 1800: +10% for every 200mm (20cm)
      const extraHeight = params.height - 1800;
      const steps = Math.ceil(extraHeight / CALC_CONFIG.heightSurchargeStep);
      pricePerSection = 2500 * (1 + (steps * CALC_CONFIG.heightSurchargeRate));
    }

    // 3. Total base
    let total = pricePerSection * sections;

    // Apply frame material multiplier
    if (frameData) {
      total *= frameData.multiplier;
      pricePerSection *= frameData.multiplier;
    }

    // 4. Non-standard width penalty (+5%)
    const isNonStandard = params.width % CALC_CONFIG.sectionWidth !== 0;
    if (isNonStandard) {
      total *= (1 + CALC_CONFIG.nonStandardPenalty);
    }

    const prepayment = Math.ceil(total * CALC_CONFIG.prepaymentRate * 100) / 100;
    const cost = total / CALC_CONFIG.markup;
    const margin = total - cost;
    const managerEarnings = margin * CALC_CONFIG.commissionRate;

    return { 
      sections, 
      pricePerSection, 
      finalPricePerSection: total / sections,
      total, 
      prepayment, 
      cost,
      margin,
      managerEarnings,
      isNonStandard,
      term: CALC_CONFIG.productionDays 
    };
  }, [params]);

  const RenderDrawing = () => {
    const totalW = 320;
    const totalH = 110;
    const startX = 40;
    const frontY = 35;
    const topViewY = 175;
    const sectionsCount = calcResults.sections;
    const sectionW = totalW / sectionsCount;
    const hasWheels = params.height >= 2000;
    
    // Find frame color for drawing
    const frameData = CALC_CONFIG.frameMaterials.find(f => f.name === params.frame);
    const frameStrokeColor = frameData?.color || '#8b5e3c';
    
    const colorMap: Record<string, string> = {
      'Белый': '#ffffff',
      'Чёрный': '#1e293b',
      'Бежевый': '#f5f5dc',
      'Серый': '#94a3b8'
    };
    const fillColor = colorMap[params.color] || '#ffffff';
    
    return (
      <svg viewBox="0 0 400 240" className="w-full h-full drop-shadow-sm" preserveAspectRatio="xMidYMid meet">
        {/* TITLES */}
        <text x="200" y="15" textAnchor="middle" className="text-[10px] font-black fill-slate-300 uppercase tracking-[0.2em]">Вид спереди</text>
        <text x="200" y="155" textAnchor="middle" className="text-[10px] font-black fill-slate-300 uppercase tracking-[0.2em]">Вид сверху (гармошка)</text>

        {/* FRONT VIEW */}
        <g>
          {/* Shadow floor */}
          <ellipse cx="200" cy={frontY + totalH + 5} rx="160" ry="3" fill="black" fillOpacity="0.05" />
          
          {/* Main Outer Frame */}
          <rect x={startX} y={frontY} width={totalW} height={totalH} fill="white" stroke="#94a3b8" strokeWidth="0.5" rx="1"/>
          
          {/* Sections Rendering */}
          {[...Array(sectionsCount)].map((_, i) => (
            <g key={i}>
              <rect 
                x={startX + i * sectionW} 
                y={frontY} 
                width={sectionW} 
                height={totalH} 
                fill={fillColor} 
                stroke={frameStrokeColor} 
                strokeWidth="2"
              />
              {/* Wheels for high screen */}
              {hasWheels && (
                <g>
                   <circle cx={startX + i * sectionW + sectionW*0.25} cy={frontY + totalH + 4} r="3" fill="#475569" />
                   <circle cx={startX + i * sectionW + sectionW*0.75} cy={frontY + totalH + 4} r="3" fill="#475569" />
                </g>
              )}
              {/* Fabric texture lines if light color */}
              {params.color !== 'Чёрный' && (
                <path d={`M ${startX + i * sectionW + 5} ${frontY} L ${startX + (i+1) * sectionW - 5} ${frontY + totalH}`} stroke="#000" strokeOpacity="0.03" strokeWidth="0.5" />
              )}
            </g>
          ))}
          {hasWheels && (
            <text x={startX + totalW + 10} y={frontY + totalH + 8} className="text-[9px] font-bold fill-indigo-600">На колёсах</text>
          )}

          {/* Dimension Lines: Height */}
          <g className="text-slate-400">
            <line x1={startX - 15} y1={frontY} x2={startX - 15} y2={frontY + totalH} stroke="currentColor" strokeWidth="1" strokeDasharray="2"/>
            <line x1={startX - 20} y1={frontY} x2={startX - 10} y2={frontY} stroke="currentColor" strokeWidth="1"/>
            <line x1={startX - 20} y1={frontY + totalH} x2={startX - 10} y2={frontY + totalH} stroke="currentColor" strokeWidth="1"/>
            <text x={startX - 25} y={frontY + totalH/2} textAnchor="middle" className="text-[10px] font-bold fill-slate-500" transform={`rotate(-90 ${startX - 25},${frontY + totalH/2})`}>{params.height} мм</text>
          </g>
        </g>

        {/* TOP VIEW (ACCORDION) */}
        <g>
          <line x1={startX} y1={topViewY + 35} x2={startX + totalW} y2={topViewY + 35} stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 2" />
          <path d={`M ${startX} ${topViewY + 32} L ${startX} ${topViewY + 38} M ${startX + totalW} ${topViewY + 32} L ${startX + totalW} ${topViewY + 38}`} stroke="#94a3b8" strokeWidth="1" />
          <text x={startX + totalW/2} y={topViewY + 48} textAnchor="middle" className="text-[9px] font-bold fill-slate-500">Ширина проёма: {params.width} мм</text>

          {[...Array(sectionsCount)].map((_, i) => {
            const isBack = i % 2 === 0;
            const x1 = startX + i * sectionW;
            const x2 = startX + (i + 1) * sectionW;
            const y1 = topViewY + (isBack ? 20 : 0);
            const y2 = topViewY + (isBack ? 0 : 20);
            
            return (
              <g key={i}>
                {/* Section line with thickness */}
                <line 
                  x1={x1} y1={y1} x2={x2} y2={y2} 
                  stroke={frameStrokeColor} strokeWidth="5" strokeLinecap="round" 
                />
                <line 
                  x1={x1} y1={y1} x2={x2} y2={y2} 
                  stroke={fillColor} strokeWidth="3" strokeLinecap="round" 
                />
                {/* Hinge point */}
                <circle cx={x1} cy={y1} r="2.5" fill={frameStrokeColor} />
                {i === sectionsCount - 1 && <circle cx={x2} cy={y2} r="2.5" fill={frameStrokeColor} />}
                
                {/* Section width label for the first section */}
                {i === 0 && (
                  <text x={x1 + sectionW/2} y={y1 + (isBack ? -10 : 30)} textAnchor="middle" className="text-[8px] font-bold fill-slate-400">60 см</text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    );
  };

  return (
    <div className="flex flex-col min-h-screen lg:h-screen lg:overflow-hidden bg-[#F8FAFC] text-slate-900 font-sans">
      <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between z-10 shadow-sm shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0"><LayoutGrid className="text-white" size={16}/></div>
            <div className="min-w-0">
              <h1 className="font-bold text-xs sm:text-sm md:text-lg leading-tight tracking-tight text-slate-900 break-words sm:whitespace-normal">Калькулятор ширм и перегородок</h1>
              <p className="hidden md:block text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Система предварительного расчёта</p>
            </div>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button onClick={() => setMode('client')} className={`px-4 py-1.5 rounded-md text-xs font-semibold ${mode === 'client' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Клиент</button>
          <button onClick={() => setMode('manager')} className={`px-4 py-1.5 rounded-md text-xs font-semibold ${mode === 'manager' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Менеджер</button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 grid grid-cols-12 auto-rows-min gap-4 md:gap-6 overflow-y-auto custom-scrollbar">
        
        {/* Params Card */}
        <section className="order-1 col-span-12 lg:col-span-4 lg:row-start-1 lg:row-end-7 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col h-fit">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-sm md:text-base flex items-center gap-2">
              <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span> 
              Конфигурация
            </h2>
            <RefreshCw 
              size={14} 
              className="text-slate-400 cursor-pointer hover:rotate-180 transition-transform duration-500" 
              onClick={() => setParams({
                width: 2000, height: 1800, color: 'Белый', frame: 'Дерево', customer: ''
              })}
            />
          </div>
          <div className="p-5 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Имя заказчика</label>
                <input 
                  type="text" 
                  value={params.customer} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm md:text-base outline-none focus:border-indigo-500 transition-colors" 
                  placeholder="Введите имя..." 
                  onChange={(e) => setParams(prev => ({ ...prev, customer: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Ширина проёма (мм)
                  </label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    value={params.width === 0 ? '' : params.width} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm md:text-base outline-none focus:border-indigo-500 transition-colors" 
                    placeholder="2000" 
                    onChange={(e) => handleNumChange('width', e.target.value)}
                  />
                  <input
                    type="range" min="500" max="5000" step="100"
                    value={params.width}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-indigo-600"
                    style={{ background: `linear-gradient(to right, #4f46e5 ${((params.width - 500) / 4500) * 100}%, #e2e8f0 ${((params.width - 500) / 4500) * 100}%)` }}
                    onChange={(e) => setParams(prev => ({ ...prev, width: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Высота секции (мм)
                  </label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    value={params.height === 0 ? '' : params.height} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm md:text-base outline-none focus:border-indigo-500 transition-colors" 
                    placeholder="1800" 
                    onChange={(e) => handleNumChange('height', e.target.value)}
                  />
                  <input
                    type="range" min="500" max="3000" step="100"
                    value={params.height}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-indigo-600"
                    style={{ background: `linear-gradient(to right, #4f46e5 ${((params.height - 500) / 2500) * 100}%, #e2e8f0 ${((params.height - 500) / 2500) * 100}%)` }}
                    onChange={(e) => setParams(prev => ({ ...prev, height: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Материал каркаса</label>
                <div className="flex flex-wrap gap-2">
                  {CALC_CONFIG.frameMaterials.map(frame => (
                     <button
                       key={frame.id}
                       onClick={() => setParams(prev => ({ ...prev, frame: frame.name }))}
                       className={`px-3 py-2 text-[10px] font-bold rounded-xl border transition-all ${
                        params.frame === frame.name 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-indigo-300'
                       }`}
                     >
                       {frame.name}
                     </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Цвет ткани</label>
                <div className="flex flex-wrap gap-2">
                  {CALC_CONFIG.colors.map(color => (
                     <button
                       key={color}
                       onClick={() => setParams(prev => ({ ...prev, color }))}
                       className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                        params.color === color 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-indigo-300'
                       }`}
                     >
                       {color}
                     </button>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-[10px] font-bold text-amber-700 uppercase tracking-tight">Расчёт секций:</span>
                   <span className="text-xs font-black text-amber-900">60 см × {calcResults.sections} шт = {Math.round(calcResults.sections * 60)} см</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                   <span className="text-[10px] font-bold text-amber-700 uppercase">Количество секций:</span>
                   <span className="text-sm font-black text-amber-900">{calcResults.sections} шт</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-[10px] font-bold text-amber-700 uppercase">Срок изготовления:</span>
                   <span className="text-sm font-black text-amber-900">{calcResults.term} дней</span>
                </div>
                {calcResults.isNonStandard && (
                  <div className="mt-2 text-[9px] text-amber-800 font-bold bg-amber-200/50 px-2 py-1 rounded inline-block">
                    +{CALC_CONFIG.nonStandardPenalty * 100}% за нестандартную ширину проёма
                  </div>
                )}
              </div>
          </div>
        </section>

        {/* Drawing Card */}
        <div className="order-2 lg:order-2 col-span-12 lg:col-span-5 lg:row-start-1 lg:row-end-5 bg-white border border-slate-200 rounded-3xl shadow-sm p-6 flex flex-col relative overflow-hidden group h-fit lg:h-auto min-h-[300px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Технический эскиз</h3>
            <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-bold border border-indigo-100 uppercase">SVG v1.2</span>
          </div>
          <div className="flex-1 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center p-6 relative">
             <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>
             <div className="relative z-0 w-full h-full max-w-md">
               <RenderDrawing />
             </div>
          </div>
          <div className="absolute bottom-6 right-6 flex gap-2">
            <button className="p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm active:scale-95 group/btn">
              <Download size={18} className="group-hover/btn:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* Result Card (Dark) */}
        <div className="order-3 lg:order-3 col-span-12 lg:col-span-3 lg:row-start-1 lg:row-end-5 bg-slate-900 rounded-[32px] shadow-2xl shadow-slate-300 p-8 flex flex-col text-white relative overflow-hidden h-fit lg:h-auto">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <div className="mb-auto relative z-10">
            <div className="text-slate-400 text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold mb-2">Общая стоимость</div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl md:text-6xl font-black tracking-tight leading-none">{Math.round(calcResults.total).toLocaleString()}</span>
              <span className="text-2xl font-bold text-slate-500">₽</span>
            </div>
            
            <div className="mt-6 flex flex-col gap-2 pt-6 border-t border-white/10">
              <div className="flex justify-between items-center">
                 <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Предоплата {CALC_CONFIG.prepaymentRate * 100}%:</span>
                 <span className="text-lg font-black text-indigo-400">{calcResults.prepayment.toLocaleString()} ₽</span>
              </div>
            </div>
            
            {mode === 'manager' && (
              <div className="mt-4 space-y-2 pt-4 border-t border-white/5 animate-in fade-in duration-500">
                <div className="flex justify-between text-[10px] text-slate-400 uppercase font-black">
                  <span>Цена за секцию:</span>
                  <span className="text-white">{Math.round(calcResults.pricePerSection).toLocaleString()} ₽</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 uppercase font-black pt-2">
                  <span>Себестоимость:</span>
                  <span className="text-slate-300">{Math.round(calcResults.cost).toLocaleString()} ₽</span>
                </div>
                <div className="flex justify-between text-[10px] text-emerald-400 uppercase font-black">
                  <span>Маржа:</span>
                  <span>{Math.round(calcResults.margin).toLocaleString()} ₽</span>
                </div>
                <div className="flex justify-between text-[10px] text-orange-400 uppercase font-black mt-2 bg-white/5 p-2 rounded-lg border border-orange-500/20">
                  <span>Заработок (20%):</span>
                  <span>{Math.round(calcResults.managerEarnings).toLocaleString()} ₽</span>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-4 pt-8 relative z-10">
            <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <RefreshCw size={20} className="animate-spin-slow" />
              </div>
              <div className="flex-1">
                <p className="text-[9px] uppercase font-bold text-slate-400 leading-none mb-1">Срок изготовления</p>
                <p className="text-lg font-bold">5 рабочих дней</p>
              </div>
            </div>
            <button 
              onClick={() => setShowKP(true)}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-900/20 transition-all active:scale-[0.98] text-sm tracking-wide"
            >
              Сформировать КП
            </button>
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="order-4 lg:order-5 col-span-12 lg:col-span-3 lg:row-start-5 lg:row-end-7 bg-white border border-slate-200 rounded-3xl shadow-sm p-5 h-fit">
           <h3 className="font-bold text-slate-400 uppercase mb-4 text-[10px] tracking-wider">Детализация заказа</h3>
           <div className="space-y-2.5">
             <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Материал каркаса</span>
                <span className="font-bold text-slate-700">{params.frame}</span>
             </div>
             <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Цена за секцию</span>
                <span className="font-bold text-slate-700">{Math.round(calcResults.pricePerSection).toLocaleString()} ₽</span>
             </div>
             <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Кол-во секций</span>
                <span className="font-bold text-slate-700">{calcResults.sections} шт</span>
             </div>
             <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Предоплата {CALC_CONFIG.prepaymentRate * 100}%</span>
                <span className="font-bold text-indigo-600">{calcResults.prepayment.toLocaleString()} ₽</span>
             </div>
             <div className="w-full h-px bg-slate-50 my-1"></div>
             <div className="flex justify-between items-center text-xs font-bold text-slate-900 pt-1">
                <span>Итого к оплате</span>
                <span>{Math.round(calcResults.total).toLocaleString()} ₽</span>
             </div>
           </div>
        </div>

        {/* Gallery Card */}
        <div className="order-5 lg:order-4 col-span-12 lg:col-span-5 lg:row-start-5 lg:row-end-7 bg-white border border-slate-200 rounded-3xl shadow-sm p-5 overflow-hidden h-fit">
           <h3 className="font-bold text-slate-400 uppercase mb-4 text-[10px] tracking-wider text-center lg:text-left">Примеры из портфолио</h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 max-h-[300px] lg:max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
             {demoGallery.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedImage(item)}
                  className="flex gap-3 items-center p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden flex-shrink-0 relative">
                    <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.title}/>
                    <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-slate-800 leading-tight mb-0.5 truncate">{item.title}</p>
                    <p className="text-[9px] text-slate-400 font-medium truncate uppercase">{item.type}</p>
                  </div>
                </div>
             ))}
           </div>
        </div>

      </main>

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
            >
              <RefreshCw size={20} className="rotate-45" /> {/* Use a simple icon or just text if X is not available */}
            </button>
            
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="aspect-[4/3] md:aspect-auto h-full max-h-[70vh] bg-slate-100">
                <img 
                  src={selectedImage.image} 
                  className="w-full h-full object-cover"
                  alt={selectedImage.title}
                />
              </div>
              <div className="p-6 md:p-10 flex flex-col justify-center">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 block">Проект: Калькулятор</span>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-4">{selectedImage.title}</h2>
                <div className="space-y-4 mb-8">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Категория</span>
                    <span className="text-sm font-semibold text-slate-700">{selectedImage.type}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Особенности</span>
                    <span className="text-sm text-slate-600">{(selectedImage as any).meta || 'Индивидуальное изготовление под проект'}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-colors"
                >
                  Закрыть просмотр
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Commercial Proposal (KP) Modal */}
      {showKP && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-md overflow-hidden">
          <div id="kp-printable" className="bg-white w-full max-w-2xl h-full max-h-[95vh] sm:max-h-[90vh] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
            {/* KP Header */}
            <div className="bg-slate-900 p-5 sm:p-8 text-white flex justify-between items-center">
              <div>
                <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tighter">Коммерческое предложение</h2>
                <p className="text-[10px] sm:text-xs text-slate-400 opacity-80 mt-1">№ {Math.floor(Math.random() * 100000)} от {new Date().toLocaleDateString()}</p>
              </div>
              <button onClick={() => setShowKP(false)} className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                <RefreshCw size={16} className="rotate-45" />
              </button>
            </div>

            {/* KP Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-10 space-y-6 sm:space-y-8 custom-scrollbar">
              <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-100 pb-5 sm:pb-6 gap-4">
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Калькулятор ширм и перегородок</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Расчёт конструкций</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Заказчик</p>
                  <p className="font-semibold text-sm sm:text-base text-slate-700 leading-tight">{params.customer || 'Частный клиент'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-l-2 border-indigo-600 pl-2">Технические характеристики</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 sm:gap-y-3 gap-x-8 text-xs sm:text-sm">
                  <div className="flex justify-between border-b border-slate-50 pb-1.5"><span className="text-slate-400">Ширина проёма:</span> <span className="font-bold">{params.width} мм</span></div>
                  <div className="flex justify-between border-b border-slate-50 pb-1.5"><span className="text-slate-400">Высота секции:</span> <span className="font-bold">{params.height} мм</span></div>
                  <div className="flex justify-between border-b border-slate-50 pb-1.5"><span className="text-slate-400">Кол-во секций:</span> <span className="font-bold">{calcResults.sections} шт.</span></div>
                  <div className="flex justify-between border-b border-slate-50 pb-1.5"><span className="text-slate-400">Цвет ткани:</span> <span className="font-bold">{params.color}</span></div>
                  <div className="flex justify-between border-b border-slate-50 pb-1.5"><span className="text-slate-400">Каркас:</span> <span className="font-bold">{params.frame}</span></div>
                  <div className="flex justify-between border-b border-slate-50 pb-1.5"><span className="text-slate-400">Наполнение:</span> <span className="font-bold">Нейлон</span></div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 sm:mb-4">Схематичное изображение</h4>
                <div className="aspect-[2/1] w-full bg-white rounded-lg sm:rounded-xl border border-slate-200 p-2 sm:p-4 shadow-inner">
                  <RenderDrawing />
                </div>
              </div>

              <div className="space-y-4 pt-4 pb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-t-2 border-slate-900 pt-6 gap-4">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Условия поставки</p>
                    <p className="font-bold text-slate-900 text-sm">Срок изготовления: {calcResults.term} рабочих дней</p>
                    <p className="text-slate-500 text-xs mt-1">Предоплата: {CALC_CONFIG.prepaymentRate * 100}% (<span className="font-bold text-indigo-600">{calcResults.prepayment.toLocaleString()} ₽</span>)</p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-wider">Всего к оплате (вкл. НДС 0%)</p>
                    <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter">{Math.round(calcResults.total).toLocaleString()} <span className="text-xl font-bold">₽</span></p>
                  </div>
                </div>
                <div className="bg-amber-50 border-l-2 border-amber-400 p-3">
                  <p className="text-[10px] text-amber-700 leading-relaxed font-medium">Предварительный расчет носит информационный характер и действителен в течение 5 рабочих дней.</p>
                </div>
              </div>
            </div>

            {/* KP Footer */}
            <div id="kp-footer" className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex flex-col gap-3">
              <div className="flex gap-3">
                <button 
                  onClick={handleSavePDF}
                  className="flex-[2] py-3 sm:py-4 bg-indigo-600 text-white font-bold rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                >
                  <Download size={18} /> Сохранить PDF
                </button>
                <button 
                  onClick={() => setShowKP(false)}
                  className="flex-1 py-3 sm:py-4 bg-white text-slate-900 font-bold rounded-xl sm:rounded-2xl border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  Вернуться
                </button>
              </div>
              <button
                onClick={handleCopyText}
                className={`w-full py-3 rounded-xl sm:rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border transition-all active:scale-95 ${
                  isCopied
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-700'
                }`}
              >
                {isCopied ? <Check size={16} /> : <Copy size={16} />}
                {isCopied ? '✓ Скопировано!' : 'Копировать текст (для Авито / мессенджеров)'}
              </button>
            </div>
          </div>
        </div>
      )}
    
    </div>
  );
}