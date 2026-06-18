import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Download, FileText, User, Briefcase, LayoutGrid, ChevronDown, RefreshCw, Plus, Minus, Copy, Check, History as HistoryIcon, TrendingUp, Phone, MapPin, Package, Clock, ShieldCheck, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { CALC_CONFIG, demoGallery } from './config';
import { fetchYandexDiskGallery, GalleryItem } from './lib/yandexDisk';
import html2pdf from 'html2pdf.js';

function AnimatedNumber({ value, suffix = "" }: { value: number, suffix?: string }) {
  return (
    <span>
      {Math.round(value).toLocaleString()}{suffix}
    </span>
  );
}

function SVGAnimatedNumber({ value, x, y, className, transform, textAnchor, style, suffix = "" }: { value: number, x: number | string, y: number | string, className?: string, transform?: string, textAnchor?: string, style?: any, suffix?: string }) {
  return (
    <text x={x} y={y} className={className} transform={transform} textAnchor={textAnchor} style={style}>
      {Math.round(value).toLocaleString()}{suffix}
    </text>
  );
}

export default function App() {
  const [params, setParams] = useState({
    width: 2000, 
    height: 1800, 
    color: 'Белый', 
    frameColor: 'Белый', 
    frame: 'Массив дерева (сосна)', 
    customer: '', 
    customerPhone: '+7', 
    deliveryType: 'Самовывоз', 
    deliveryAddress: '', 
    hasWheels: false,
    hasPhotoPrint: false,
    photoPrintPrice: 3500,
    discount: 0,
    manualTotal: 0,
    manualPrepayment: 0
  });

  const [gallery, setGallery] = useState<GalleryItem[]>(demoGallery);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  
  const [filter, setFilter] = useState('');
  const [showOnlyMatches, setShowOnlyMatches] = useState(false);

  const [showKP, setShowKP] = useState(false);
  const [docType, setDocType] = useState<'kp' | 'production'>('kp');
  const [mode, setMode] = useState<'client' | 'manager'>('client');
  const [isCopied, setIsCopied] = useState(false);
  const [history, setHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem('calc_history');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const kpRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('calc_history', JSON.stringify(history));
  }, [history]);

  const calcResults = useMemo(() => {
    // 1. Calculate sections
    const sections = Math.ceil(params.width / CALC_CONFIG.sectionWidth) || 1;
    
    // Find frame material multiplier
    const frameData = CALC_CONFIG.frameMaterials.find(f => f.name === params.frame);

    // 2. Base price per section based on height (Linear scaling)
    const hMin = 1500;
    const hMax = 2200;
    const pRetailMin = CALC_CONFIG.basePrices[0].price; // 2800
    const pRetailMax = CALC_CONFIG.basePrices[1].price; // 3300
    
    let baseRetailPricePerSection = pRetailMin;
    if (params.height <= hMin) {
      baseRetailPricePerSection = pRetailMin;
    } else if (params.height >= hMax) {
      baseRetailPricePerSection = pRetailMax;
    } else {
      const ratio = (params.height - hMin) / (hMax - hMin);
      baseRetailPricePerSection = pRetailMin + ratio * (pRetailMax - pRetailMin);
    }

    // Convert old retail base to production cost
    const baseProductionCostPerSection = baseRetailPricePerSection / CALC_CONFIG.markup;

    // Apply frame material multiplier to COST
    let costPerSection = baseProductionCostPerSection;
    if (frameData) {
      costPerSection *= frameData.multiplier;
    }

    // 3. Margin logic (requested 2100-2500 per section)
    const marginPerSection = 2300; 
    let targetPricePerSection = costPerSection + marginPerSection;

    // 4. Base total for the construction
    let constructionTotal = targetPricePerSection * sections;

    // 5. Non-standard width penalty (+5%) - only on construction
    const isNonStandard = params.width % CALC_CONFIG.sectionWidth !== 0;
    if (isNonStandard) {
      constructionTotal *= (1 + CALC_CONFIG.nonStandardPenalty);
    }

    // 6. Additional costs (per order)
    let totalExtra = 0;
    if (params.hasWheels) totalExtra += 600;
    if (params.hasPhotoPrint) totalExtra += params.photoPrintPrice;

    // 7. Total sum
    let total = constructionTotal + totalExtra;

    // Apply discount
    total -= params.discount;

    // Manual total override
    if (params.manualTotal > 0) {
      total = params.manualTotal;
    }

    // Rounding
    total = Math.ceil(total / 100) * 100;

    // Prepayment (Default to 50% from config)
    let prepayment = Math.ceil((total * CALC_CONFIG.prepaymentRate) / 100) * 100;
    
    // Manual prepayment override
    if (params.manualPrepayment > 0) {
      prepayment = params.manualPrepayment;
    }
    
    const cost = Math.ceil((costPerSection * sections) / 100) * 100;
    const margin = Math.ceil((total - cost) / 100) * 100;
    const managerEarnings = Math.ceil((margin * CALC_CONFIG.commissionRate) / 100) * 100;

    // Weight calculation
    const weight = (sections * 3) + (params.hasWheels ? 0.5 : 0);

    return { 
      sections, 
      pricePerSection: targetPricePerSection, 
      finalPricePerSection: total / sections,
      total, 
      prepayment, 
      cost,
      margin,
      managerEarnings,
      isNonStandard,
      weight,
      term: params.hasPhotoPrint ? 15 : CALC_CONFIG.productionDays 
    };
  }, [params]);

  useEffect(() => {
    const loadDiskGallery = async () => {
      setIsLoadingGallery(true);
      try {
        const diskItems = await fetchYandexDiskGallery('https://disk.yandex.ru/d/o-l918J71l4evA');
        if (diskItems.length > 0) {
          setGallery(prev => {
            const existingIds = new Set(prev.map(i => i.id));
            const newItems = diskItems.filter(i => !existingIds.has(i.id));
            return [...newItems, ...prev];
          });
        }
      } catch (err) {
        console.error('Disk gallery load failed', err);
      } finally {
        setIsLoadingGallery(false);
      }
    };
    loadDiskGallery();
  }, []);

  const saveToHistory = () => {
    const entry = {
      id: Date.now(),
      date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      params: { ...params },
      results: { ...calcResults }
    };
    setHistory(prev => [entry, ...prev].slice(0, 50));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCopyText = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const isProd = docType === 'production';
    const header = isProd ? '🛠️ ЗАДАНИЕ В ПРОИЗВОДСТВО' : '📄 КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ';
    
    const text = `${header}

${params.customer ? `Клиент: ${params.customer}` : ''}
${params.customerPhone ? `Тел: ${params.customerPhone}` : ''}
${params.deliveryType === 'Самовывоз' ? 'Получение: Самовывоз' : `Доставка: ${params.deliveryAddress}`}

📦 ПАРАМЕТРЫ ШИРМЫ:
• Ширина проёма: ${params.width} мм
• Высота ширмы: ${params.height + (params.hasWheels ? 60 : 0)} мм ${params.hasWheels ? '(с колесами)' : ''}
• Цвет ткани: ${params.color} (Оксфорд, можно мыть)
• Цвет каркаса: ${params.frameColor}
• Вариант рамы: ${params.frame}
• Колеса: ${params.hasWheels ? 'Да (60 мм)' : 'Нет'}
${params.hasPhotoPrint ? `• Фотопечать: Да (+ ${params.photoPrintPrice} ₽)\n` : ''}• Конструкция: ${calcResults.sections} секций (размер 1 секции: 600x${params.height + (params.hasWheels ? 60 : 0)} мм)

${isProd ? `📝 ПОРЯДОК РАБОТ:
• Материал рамы: ${params.frame}
• Цвет рамы: ${params.frameColor}
• Ткань: ${params.color}
• Наличие колес: ${params.hasWheels ? 'УСТАНОВИТЬ' : 'без колес, на подпятниках'}
${params.hasPhotoPrint ? `• ПЕЧАТЬ: Установить полотна с фотопечатью\n` : ''}
• Срок: ${calcResults.term} рабочих дней
` : `💰 ИТОГО К ОПЛАТЕ:
• Общая стоимость: ${Math.round(calcResults.total).toLocaleString()} ₽
• Предоплата: ${Math.round(calcResults.prepayment).toLocaleString()} ₽
`}

⏳ УСЛОВИЯ:
• Срок изготовления: ${calcResults.term} рабочих дней
• Гарантия: 12 месяцев
• Ткань Оксфорд (влагостойкая, можно мыть)`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSavePDF = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!kpRef.current) return;
    
    try {
      // Формируем дату для названия файла
      const now = new Date();
      const dateStr = now.toLocaleDateString('ru-RU').replace(/\//g, '.');
      
      const docTitle = docType === 'production' ? 'Zadanie' : 'KP';
      const customer = params.customer.trim().replace(/[^a-zA-Zа-яА-Я0-9]/g, '_') || 'Client';
      const fileName = `${docTitle}_${customer}_${dateStr}.pdf`;

      const element = kpRef.current;
      
      const opt = {
        margin:       10,
        filename:     fileName,
        image:        { type: 'jpeg', quality: 0.98 } as const,
        html2canvas:  { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true,
          backgroundColor: '#ffffff',
          logging: false
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' } as const
      };

      // Используем более надежный вызов
      const worker = html2pdf().set(opt).from(element);
      await worker.save();
    } catch (err) {
      console.error('PDF Generation failed:', err);
      alert('Ошибка при сохранении PDF. Попробуйте скопировать текст кнопкой справа.');
    }
  };

  const handleNumChange = (key: string, val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '');
    setParams(prev => ({ ...prev, [key]: cleaned === '' ? 0 : Number(cleaned) }));
  };


  const RenderDrawing = () => {
    const totalW = 320;
    const totalH = 110;
    const startX = 40;
    const frontY = 35;
    const topViewShift = params.hasWheels ? 15 : 0;
    const topViewY = 175 + topViewShift;
    const sectionsCount = calcResults.sections;
    const sectionW = totalW / sectionsCount;
    
    // Find frame color for drawing
    const colorMap: Record<string, string> = {
      'Белый': '#e2e8f0',
      'Чёрный': '#1e293b',
      'Бежевый': '#f5f5dc',
      'Серый': '#94a3b8'
    };
    const fillColor = colorMap[params.color] || '#ffffff';
    let frameColorVal = colorMap[params.frameColor] || '#8b5e3c';
    
    // Ensure frame is visible if colors match
    if (params.color === params.frameColor) {
      if (params.color === 'Белый') frameColorVal = '#cbd5e1'; // Silver/Gray for white
      else if (params.color === 'Чёрный') frameColorVal = '#64748b'; // Slate for black
      else if (params.color === 'Бежевый') frameColorVal = '#d2b48c'; // Tan for beige
      else frameColorVal = '#475569';
    }
    
    return (
      <svg viewBox="0 0 400 240" className="w-full h-full drop-shadow-sm" preserveAspectRatio="xMidYMid meet">
        {/* TITLES */}
        <text x="200" y="15" textAnchor="middle" style={{ fontSize: '11px', fontWeight: 900, fill: '#000000', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Вид спереди</text>
        <text x="200" y={155 + topViewShift} textAnchor="middle" style={{ fontSize: '11px', fontWeight: 900, fill: '#000000', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Вид сверху (гармошка)</text>

        {/* FRONT VIEW */}
        <g>
          {/* Shadow floor */}
          <ellipse cx="200" cy={frontY + totalH + (params.hasWheels ? 12 : 5)} rx="160" ry="3" fill="#000000" fillOpacity="0.05" />
          
          {/* Main Outer Frame */}
          <rect x={startX} y={frontY} width={totalW} height={totalH} fill="#ffffff" stroke="#94a3b8" strokeWidth="0.5" rx="1"/>
          
          {/* Sections Rendering */}
          {[...Array(sectionsCount)].map((_, i) => (
            <g key={i}>
              <rect 
                x={startX + i * sectionW} 
                width={sectionW}
                fill={fillColor}
                stroke={frameColorVal}
                y={frontY} 
                height={totalH} 
                strokeWidth="2"
              />
              {/* Wheels Rendering */}
              {params.hasWheels && (
                <g>
                   <circle cx={startX + i * sectionW + sectionW*0.25} cy={frontY + totalH + 6} r="3.5" fill="#475569" />
                   <circle cx={startX + i * sectionW + sectionW*0.75} cy={frontY + totalH + 6} r="3.5" fill="#475569" />
                   <rect x={startX + i * sectionW + sectionW*0.2} y={frontY + totalH} width={sectionW*0.1} height={6} fill="#475569" />
                   <rect x={startX + i * sectionW + sectionW*0.7} y={frontY + totalH} width={sectionW*0.1} height={6} fill="#475569" />
                </g>
              )}
              {/* Fabric texture lines if light color */}
              {params.color !== 'Чёрный' && (
                <path 
                  d={`M ${startX + i * sectionW + 5} ${frontY} L ${startX + (i+1) * sectionW - 5} ${frontY + totalH}`}
                  stroke="#000000" strokeOpacity="0.03" strokeWidth="0.5" 
                />
              )}
            </g>
          ))}
          {params.hasWheels && (
            <text x={startX + totalW + 10} y={frontY + totalH + 8} style={{ fontSize: '9px', fontWeight: 'bold', fill: '#4f46e5' }}>На колёсах</text>
          )}

          {/* Dimension Lines: Height */}
          <g>
            <line x1={startX - 15} y1={frontY} x2={startX - 15} y2={frontY + totalH} stroke="#94a3b8" strokeWidth="1" strokeDasharray="2"/>
            <line x1={startX - 20} y1={frontY} x2={startX - 10} y2={frontY} stroke="#94a3b8" strokeWidth="1"/>
            <line x1={startX - 20} y1={frontY + totalH} x2={startX - 10} y2={frontY + totalH} stroke="#94a3b8" strokeWidth="1"/>
            <SVGAnimatedNumber 
              value={params.height}
              x={startX - 25}
              y={frontY + totalH/2}
              textAnchor="middle"
              className="svg-dim-label"
              transform={`rotate(-90 ${startX - 25},${frontY + totalH/2})`}
              style={{ fontSize: '10px', fontWeight: 'bold', fill: '#64748b' }}
              suffix=" мм"
            />
          </g>
        </g>

        {/* TOP VIEW (ACCORDION) */}
        <g>
          <line x1={startX} y1={topViewY + 35} x2={startX + totalW} y2={topViewY + 35} stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 2" />
          <path d={`M ${startX} ${topViewY + 32} L ${startX} ${topViewY + 38} M ${startX + totalW} ${topViewY + 32} L ${startX + totalW} ${topViewY + 38}`} stroke="#94a3b8" strokeWidth="1" />
          <SVGAnimatedNumber 
            value={params.width}
            x={startX + totalW/2}
            y={topViewY + 48}
            textAnchor="middle"
            className="svg-dim-label"
            style={{ fontSize: '10px', fontWeight: 'bold', fill: '#64748b' }}
            suffix=" мм"
          />

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
                  stroke={frameColorVal}
                  strokeWidth="5" strokeLinecap="round" 
                />
                <line 
                  x1={x1} y1={y1} x2={x2} y2={y2} 
                  stroke={fillColor}
                  strokeWidth="3" strokeLinecap="round" 
                />
                {/* Hinge point */}
                <circle cx={x1} cy={y1} fill={frameColorVal} r="2.5" />
                {i === sectionsCount - 1 && (
                  <circle cx={x2} cy={y2} fill={frameColorVal} r="2.5" />
                )}
                
                {/* Section width label for the first section */}
                {i === 0 && (
                  <text x={x1 + sectionW/2} y={y1 + (isBack ? -10 : 30)} textAnchor="middle" style={{ fontSize: '8px', fontWeight: 'bold', fill: '#94a3b8' }}>60 см</text>
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
                  width: 2000, 
                  height: 1800, 
                  color: 'Белый', 
                  frameColor: 'Белый', 
                  frame: 'Массив дерева (сосна)', 
                  customer: '', 
                  customerPhone: '+7', 
                  deliveryType: 'Самовывоз', 
                  deliveryAddress: '',
                  hasWheels: false,
                  hasPhotoPrint: false,
                  photoPrintPrice: 3500,
                  discount: 0,
                  manualTotal: 0,
                  manualPrepayment: 0
                })}
              />
          </div>
          <div className="p-5 space-y-5">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Имя заказчика</label>
                    <input 
                      type="text" 
                      value={params.customer} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm md:text-base outline-none focus:border-indigo-500 transition-colors" 
                      placeholder="Иван Иванович" 
                      onChange={(e) => setParams(prev => ({ ...prev, customer: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Телефон</label>
                    <input 
                      type="tel" 
                      value={params.customerPhone} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm md:text-base outline-none focus:border-indigo-500 transition-colors" 
                      placeholder="+7..." 
                      onChange={(e) => setParams(prev => ({ ...prev, customerPhone: e.target.value }))}
                    />
                  </div>
                </div>

                {mode === 'manager' && (
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between border-b border-indigo-100/50 pb-2">
                      <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Инструкция производства</h3>
                      <div className="flex gap-1">
                        <div className="w-1 h-1 bg-indigo-300 rounded-full"></div>
                        <div className="w-1 h-1 bg-indigo-300 rounded-full"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-y-1.5 text-[11px] leading-none">
                      <span className="text-slate-500">Габариты 1 створки:</span>
                      <span className="font-bold text-indigo-900 text-right">600 x {params.height + (params.hasWheels ? 60 : 0)} мм</span>
                      <span className="text-slate-500">Рама:</span>
                      <span className="font-bold text-indigo-900 text-right">{params.frame}</span>
                      <span className="text-slate-500">Цвет каркаса:</span>
                      <span className="font-bold text-indigo-900 text-right">{params.frameColor}</span>
                      <span className="text-slate-500">Цвет ткани:</span>
                      <span className="font-bold text-indigo-900 text-right">{params.color}</span>
                      <span className="text-slate-500">Фотопечать:</span>
                      <span className="font-bold text-indigo-900 text-right">{params.hasPhotoPrint ? 'ДА' : 'НЕТ'}</span>
                      <span className="text-slate-500 pt-1 border-t border-indigo-100/30">Колёса:</span>
                      <span className="font-bold text-indigo-900 text-right pt-1 border-t border-indigo-100/30">{params.hasWheels ? 'УСТАНОВИТЬ' : 'НЕТ'}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Получение заказа</label>
                  <div className="flex gap-2">
                    {['Самовывоз', 'Доставка'].map(type => (
                      <button
                        key={type}
                        onClick={() => setParams(prev => ({ ...prev, deliveryType: type as any }))}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                          params.deliveryType === type 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {params.deliveryType === 'Доставка' && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Адрес доставки</label>
                    <input 
                      type="text" 
                      value={params.deliveryAddress} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition-colors" 
                      placeholder="Город, улица, дом..." 
                      onChange={(e) => setParams(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ширина проёма (мм)</label>
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                      <AnimatedNumber value={params.width} />
                    </span>
                  </div>
                  <div className="space-y-3">
                    <input 
                      type="text" 
                      inputMode="numeric"
                      value={params.width === 0 ? '' : params.width} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm md:text-base outline-none focus:border-indigo-500 transition-colors" 
                      placeholder="2000" 
                      onChange={(e) => handleNumChange('width', e.target.value)}
                    />
                    <div className="px-1">
                      <input 
                        type="range"
                        min="600"
                        max="6000"
                        step="10"
                        value={params.width}
                        onChange={(e) => setParams(prev => ({ ...prev, width: Number(e.target.value) }))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Высота секции (мм)</label>
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                      <AnimatedNumber value={params.height} />
                    </span>
                  </div>
                  <div className="space-y-3">
                    <input 
                      type="text" 
                      inputMode="numeric"
                      value={params.height === 0 ? '' : params.height} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm md:text-base outline-none focus:border-indigo-500 transition-colors" 
                      placeholder="1800" 
                      onChange={(e) => handleNumChange('height', e.target.value)}
                    />
                    <div className="px-1">
                      <input 
                        type="range"
                        min="1000"
                        max="3000"
                        step="10"
                        value={params.height}
                        onChange={(e) => setParams(prev => ({ ...prev, height: Number(e.target.value) }))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Материал каркаса</label>
                <div className="flex flex-wrap gap-2">
                  {CALC_CONFIG.frameMaterials.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setParams(prev => ({ ...prev, frame: m.name }))}
                      className={`px-3 py-2 text-[10px] font-bold rounded-xl border transition-all ${
                        params.frame === m.name 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-indigo-300'
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Цвет ткани (Оксфорд, можно мыть)</label>
                <div className="flex gap-2 pb-1 overflow-x-auto sm:overflow-visible no-scrollbar">
                  {CALC_CONFIG.colors.map(color => (
                     <button
                       key={color}
                       onClick={() => setParams(prev => ({ ...prev, color }))}
                       className={`flex-1 min-w-[65px] py-2 text-[10px] font-bold rounded-xl border transition-all whitespace-nowrap ${
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

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Цвет каркаса</label>
                <div className="flex gap-2 pb-1 overflow-x-auto sm:overflow-visible no-scrollbar">
                  {CALC_CONFIG.colors.map(color => (
                     <button
                       key={color}
                       onClick={() => setParams(prev => ({ ...prev, frameColor: color }))}
                       className={`flex-1 min-w-[65px] py-2 text-[10px] font-bold rounded-xl border transition-all whitespace-nowrap ${
                        params.frameColor === color 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-indigo-300'
                       }`}
                     >
                       {color}
                     </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/50 mb-2">
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Фотопечать</label>
                    <p className="text-[10px] text-slate-500 font-medium italic">На все створки</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {params.hasPhotoPrint && (
                      <input 
                        type="text" 
                        inputMode="numeric"
                        value={params.photoPrintPrice} 
                        className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-black outline-none focus:border-indigo-500" 
                        onChange={(e) => handleNumChange('photoPrintPrice', e.target.value)}
                      />
                    )}
                    <button
                      onClick={() => setParams(prev => ({ ...prev, hasPhotoPrint: !prev.hasPhotoPrint }))}
                      className={`w-12 h-6 rounded-full p-1 transition-colors relative ${params.hasPhotoPrint ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm transform ${params.hasPhotoPrint ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Колеса</label>
                    <p className="text-[10px] text-slate-500 font-medium italic">10 см от пола до ширмы</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-indigo-600">+600 ₽</span>
                    <button
                      onClick={() => setParams(prev => ({ ...prev, hasWheels: !prev.hasWheels }))}
                      className={`w-12 h-6 rounded-full p-1 transition-colors relative ${params.hasWheels ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm transform ${params.hasWheels ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {mode === 'manager' && (
                <div className="space-y-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                    Настройки менеджера
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Скидка (₽)</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        value={params.discount === 0 ? '' : params.discount} 
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-emerald-500 transition-colors" 
                        placeholder="0" 
                        onChange={(e) => handleNumChange('discount', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Итог (ручной)</label>
                        <input 
                          type="text" 
                          inputMode="numeric"
                          value={params.manualTotal === 0 ? '' : params.manualTotal} 
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-emerald-500 transition-colors" 
                          placeholder="Авто" 
                          onChange={(e) => handleNumChange('manualTotal', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Аванс (ручной)</label>
                        <input 
                          type="text" 
                          inputMode="numeric"
                          value={params.manualPrepayment === 0 ? '' : params.manualPrepayment} 
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-emerald-500 transition-colors" 
                          placeholder="Авто" 
                          onChange={(e) => handleNumChange('manualPrepayment', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
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

        {/* Distinct Sections/Term Block */}
        <div className="order-4 lg:order-4 col-span-12 lg:col-span-5 lg:row-start-5 lg:row-end-6 grid grid-cols-2 gap-2 sm:gap-4 bg-indigo-50 border border-indigo-100 rounded-[24px] sm:rounded-[32px] p-4 sm:p-6 shadow-sm">
          <div className="space-y-0.5 sm:space-y-1">
            <span className="text-[9px] sm:text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Секции</span>
            <p className="text-lg sm:text-2xl font-black text-indigo-900 leading-tight">{calcResults.sections} шт <span className="text-[10px] sm:text-xs font-medium text-indigo-400 block sm:inline sm:ml-1">({(calcResults.sections * 60)} см)</span></p>
          </div>
          <div className="space-y-0.5 sm:space-y-1 pl-3 sm:pl-4 border-l border-indigo-200">
            <span className="text-[9px] sm:text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Срок</span>
            <p className="text-lg sm:text-2xl font-black text-indigo-900 leading-tight">{calcResults.term} <span className="text-[10px] sm:text-xs font-medium text-indigo-600 uppercase tracking-widest ml-0.5">дней</span></p>
            <p className="text-[9px] sm:text-[10px] text-indigo-400 font-medium">Гарантия 12 мес.</p>
          </div>
        </div>

        {/* Result Card (Dark) */}
        <div className="order-3 lg:order-3 col-span-12 lg:col-span-3 lg:row-start-1 lg:row-end-5 bg-slate-900 rounded-[32px] shadow-2xl shadow-slate-300 p-8 flex flex-col text-white relative overflow-hidden h-fit lg:h-auto">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <div className="mb-auto relative z-10">
            <div className="text-slate-400 text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold mb-2">Общая стоимость</div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl md:text-6xl font-black tracking-tight leading-none">
                <AnimatedNumber value={calcResults.total} />
              </span>
              <span className="text-2xl font-bold text-slate-500">₽</span>
            </div>
            
            <div className="mt-6 flex flex-col gap-2 pt-6 border-t border-white/10">
              <div className="flex justify-between items-center">
                 <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Предоплата {CALC_CONFIG.prepaymentRate * 100}%:</span>
                 <span className="text-lg font-black text-indigo-400">
                   <AnimatedNumber value={calcResults.prepayment} suffix=" ₽" />
                 </span>
              </div>
            </div>

            <button 
              onClick={saveToHistory}
              className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
            >
              <HistoryIcon size={14} /> {isCopied ? 'Сохранено!' : 'Сохранить расчёт'}
            </button>
            
            {mode === 'manager' && (
              <div className="mt-6 p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl space-y-3 animate-in fade-in duration-500">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[9px] text-indigo-300 uppercase font-black tracking-widest">Ваш доход ({CALC_CONFIG.commissionRate * 100}%):</p>
                    <p className="text-2xl font-black text-white">
                      <AnimatedNumber value={calcResults.managerEarnings} suffix=" ₽" />
                    </p>
                  </div>
                  <TrendingUp size={24} className="text-indigo-400 opacity-50" />
                </div>
                <div className="pt-2 border-t border-white/5 space-y-1.5">
                  <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase transition-colors hover:text-slate-300">
                     <span>Маржа:</span> <span>{calcResults.margin.toLocaleString()} ₽</span>
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                    <span>Себестоимость:</span> <span>{calcResults.cost.toLocaleString()} ₽</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-3 pt-8 relative z-10">
            <button 
              onClick={() => {
                setDocType('kp');
                setShowKP(true);
              }}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-900/20 transition-all active:scale-[0.98] text-sm tracking-wide"
            >
              Сформировать КП
            </button>
            {mode === 'manager' && (
              <button 
                onClick={() => {
                  setDocType('production');
                  setShowKP(true);
                }}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-xl shadow-slate-900/10 transition-all active:scale-[0.98] text-sm tracking-wide flex items-center justify-center gap-2"
              >
                <Package size={18} /> Задание в производство
              </button>
            )}
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
             {mode === 'manager' && (
               <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Цена за секцию</span>
                  <span className="font-bold text-slate-700">
                    <AnimatedNumber value={calcResults.pricePerSection} suffix=" ₽" />
                  </span>
               </div>
             )}
             <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Кол-во секций</span>
                <span className="font-bold text-slate-700">
                  <AnimatedNumber value={calcResults.sections} suffix=" шт" />
                </span>
             </div>
             <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Размер 1 секции</span>
                <span className="font-bold text-slate-700">
                   {CALC_CONFIG.sectionWidth}х{params.height + (params.hasWheels ? 60 : 0)} мм
                </span>
             </div>
             {params.hasPhotoPrint && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Фотопечать</span>
                  <span className="font-bold text-indigo-600">+{params.photoPrintPrice.toLocaleString()} ₽</span>
                </div>
              )}
              {params.discount > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Скидка</span>
                  <span className="font-bold text-emerald-600">-{params.discount.toLocaleString()} ₽</span>
                </div>
              )}
             <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Предоплата {CALC_CONFIG.prepaymentRate * 100}%</span>
                <span className="font-bold text-indigo-600">
                  <AnimatedNumber value={calcResults.prepayment} suffix=" ₽" />
                </span>
             </div>
             <div className="w-full h-px bg-slate-50 my-1"></div>
             <div className="flex justify-between items-center text-xs font-bold text-slate-900 pt-1">
                <span>Итого к оплате</span>
                <span>
                  <AnimatedNumber value={calcResults.total} suffix=" ₽" />
                </span>
             </div>
           </div>
        </div>

        {/* Портфолио временно скрыто по просьбе пользователя */}
        {/* Gallery Card 
        <div className="order-5 lg:order-4 col-span-12 lg:col-span-5 lg:row-start-5 lg:row-end-8 bg-white border border-slate-200 rounded-3xl shadow-sm p-5 overflow-hidden flex flex-col h-fit lg:h-[420px]">
           ... (hidden code) ...
        </div>
        */}

        {/* History Section (Manager Only) */}
        {mode === 'manager' && history.length > 0 && (
          <div className="col-span-12 mt-8 animate-in slide-in-from-bottom-4 duration-500 pb-12 border-t border-slate-100 pt-12">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3 text-slate-900 px-4 py-2 bg-slate-100 rounded-2xl border border-slate-200">
                <HistoryIcon className="text-indigo-600" size={24} />
                <h2 className="text-xl font-black uppercase tracking-widest leading-none">История расчётов</h2>
              </div>
              <button 
                onClick={() => { if(confirm('Очистить всю историю?')) setHistory([]); }}
                className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest flex items-center gap-1.5 p-2"
              >
                <Trash2 size={12} /> Очистить
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {history.map((entry) => (
                <div key={entry.id} className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setHistory(prev => prev.filter(h => h.id !== entry.id))}
                      className="p-2.5 bg-white text-slate-300 hover:text-red-500 rounded-2xl border border-slate-100 transition-colors shadow-sm"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock size={12} className="text-indigo-600" />
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">{entry.date}</p>
                      </div>
                      <h4 className="text-lg font-black text-slate-900 truncate pr-8">{entry.params.customer || 'Без имени'}</h4>
                      {entry.params.customerPhone && <p className="text-[10px] font-bold text-slate-400">{entry.params.customerPhone}</p>}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-[24px] border border-slate-100 mb-6">
                    <div className="space-y-1 border-r border-slate-200">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Конструкция</p>
                      <p className="text-sm font-black text-slate-900">{entry.results.sections} шт. ({CALC_CONFIG.sectionWidth}х{entry.params.height + (entry.params.hasWheels ? 60 : 0)})</p>
                    </div>
                    <div className="space-y-1 pl-2">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Ваш доход</p>
                      <p className="text-sm font-black text-emerald-600">+{entry.results.managerEarnings.toLocaleString()} ₽</p>
                    </div>
                    <div className="space-y-1 border-r border-slate-200">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Габариты</p>
                      <p className="text-[10px] font-bold text-slate-600">{entry.params.width}x{entry.params.height}</p>
                    </div>
                    <div className="space-y-1 pl-2">
                       <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Итого</p>
                       <p className="text-[10px] font-black text-slate-900">{entry.results.total.toLocaleString()} ₽</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setParams(entry.params);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-600 shadow-lg shadow-slate-200 hover:shadow-indigo-200 transition-all active:scale-[0.98]"
                  >
                    Восстановить расчёт
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
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
                <div className="flex flex-col gap-3">
                  {selectedImage.tags && (
                    <button 
                      onClick={() => {
                        setParams(prev => ({
                          ...prev,
                          color: selectedImage.tags?.color || prev.color,
                          frameColor: selectedImage.tags?.frameColor || prev.frameColor
                        }));
                        setSelectedImage(null);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
                    >
                      <Sparkles size={18} /> Применить цвета из примера
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors"
                  >
                    Закрыть просмотр
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Commercial Proposal (KP) Modal */}
      {showKP && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-md overflow-hidden">
          <div className="bg-white w-full max-w-2xl h-full max-h-[95vh] sm:max-h-[90vh] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
            {/* KP Header */}
            <div 
              style={{ backgroundColor: docType === 'production' ? '#1e1b4b' : '#0f172a' }}
              className="p-5 sm:p-8 text-white flex justify-between items-center transition-colors duration-500"
            >
              <div>
                <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tighter">
                  {docType === 'production' ? 'Задание в производство' : 'Коммерческое предложение'}
                </h2>
                <p className="text-[10px] sm:text-xs text-slate-400 opacity-80 mt-1 uppercase tracking-widest font-black">
                  {docType === 'production' ? 'Техническая документация' : `№ ${Math.floor(Math.random() * 100000)} от ${new Date().toLocaleDateString()}`}
                </p>
              </div>
              <button 
                onClick={() => setShowKP(false)} 
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                className="w-8 h-8 sm:w-10 sm:h-10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <RefreshCw size={16} className="rotate-45" />
              </button>
            </div>

            {/* KP Content */}
            <div ref={kpRef} className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-4 custom-scrollbar" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
              <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-100 pb-3 gap-4" style={{ borderColor: '#f1f5f9' }}>
                <div>
                  <h3 className="font-bold text-slate-900 mb-0.5" style={{ color: '#0f172a', fontSize: '14px' }}>
                    {docType === 'production' ? 'ЗАДАНИЕ В ПРОИЗВОДСТВО' : 'Коммерческое предложение'}
                  </h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide" style={{ color: '#94a3b8' }}>{docType === 'production' ? 'Техническое описание' : 'Расчёт конструкций'}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5" style={{ color: '#94a3b8' }}>Заказчик</p>
                  <p className="font-semibold text-xs sm:text-sm text-slate-700 leading-tight" style={{ color: '#334155' }}>{params.customer || 'Частный клиент'}</p>
                  {params.customerPhone && <p className="text-[10px] text-slate-500 mt-0.5" style={{ color: '#64748b' }}>{params.customerPhone}</p>}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[9px] font-black text-indigo-600 uppercase tracking-widest border-l-2 border-indigo-600 pl-2" style={{ color: '#4f46e5', borderColor: '#4f46e5' }}>Технические характеристики</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-8 text-[11px] sm:text-xs">
                  <div className="flex justify-between border-b border-slate-50 pb-1" style={{ borderColor: '#f8fafc' }}><span className="text-slate-400" style={{ color: '#94a3b8' }}>Ширина проёма:</span> <span className="font-bold" style={{ color: '#0f172a' }}>{params.width} мм</span></div>
                  <div className="flex justify-between border-b border-slate-50 pb-1" style={{ borderColor: '#f8fafc' }}><span className="text-slate-400" style={{ color: '#94a3b8' }}>Высота изделия:</span> <span className="font-bold" style={{ color: '#0f172a' }}>{params.height + (params.hasWheels ? 60 : 0)} мм {params.hasWheels ? '(с колесами)' : ''}</span></div>
                  <div className="flex justify-between border-b border-slate-50 pb-1" style={{ borderColor: '#f8fafc' }}><span className="text-slate-400" style={{ color: '#94a3b8' }}>Кол-во створок:</span> <span className="font-bold" style={{ color: '#0f172a' }}>{calcResults.sections} шт.</span></div>
                  <div className="flex justify-between border-b border-slate-50 pb-1" style={{ borderColor: '#f8fafc' }}><span className="text-slate-400" style={{ color: '#94a3b8' }}>Размер 1 створки:</span> <span className="font-bold" style={{ color: '#0f172a' }}>{CALC_CONFIG.sectionWidth} х {params.height + (params.hasWheels ? 60 : 0)} мм</span></div>
                  <div className="flex justify-between border-b border-slate-50 pb-1" style={{ borderColor: '#f8fafc' }}><span className="text-slate-400" style={{ color: '#94a3b8' }}>Цвет ткани:</span> <span className="font-bold" style={{ color: '#0f172a' }}>{params.color} (Оксфорд)</span></div>
                  <div className="flex justify-between border-b border-slate-50 pb-1" style={{ borderColor: '#f8fafc' }}><span className="text-slate-400" style={{ color: '#94a3b8' }}>Цвет каркаса:</span> <span className="font-bold" style={{ color: '#0f172a' }}>{params.frameColor}</span></div>
                  <div className="flex justify-between border-b border-slate-50 pb-1" style={{ borderColor: '#f8fafc' }}><span className="text-slate-400" style={{ color: '#94a3b8' }}>Материал рамы:</span> <span className="font-bold" style={{ color: '#0f172a' }}>{params.frame}</span></div>
                  <div className="flex justify-between border-b border-slate-50 pb-1" style={{ borderColor: '#f8fafc' }}><span className="text-slate-400" style={{ color: '#94a3b8' }}>Колеса:</span> <span className="font-bold" style={{ color: '#0f172a' }}>{params.hasWheels ? 'Да (60 мм)' : 'Нет'}</span></div>
                  <div className="flex justify-between border-b border-slate-50 pb-1" style={{ borderColor: '#f8fafc' }}><span className="text-slate-400" style={{ color: '#94a3b8' }}>Фотопечать:</span> <span className="font-bold" style={{ color: '#0f172a' }}>{params.hasPhotoPrint ? 'Да' : 'Нет'}</span></div>
                  <div className="flex justify-between border-b border-slate-50 pb-1" style={{ borderColor: '#f8fafc' }}><span className="text-slate-400" style={{ color: '#94a3b8' }}>Общий вес:</span> <span className="font-bold" style={{ color: '#0f172a' }}>~{calcResults.weight} кг</span></div>
                  <div className="flex justify-between border-b border-slate-50 pb-1 col-span-1 sm:col-span-2" style={{ borderColor: '#f8fafc' }}><span className="text-slate-400" style={{ color: '#94a3b8' }}>Способ получения:</span> <span className="font-bold" style={{ color: '#0f172a' }}>{params.deliveryType} {params.deliveryType === 'Доставка' ? `(${params.deliveryAddress})` : ''}</span></div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100" style={{ backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }}>
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2" style={{ color: '#94a3b8' }}>Схематичное изображение</h4>
                <div className="w-full h-[160px] bg-white rounded-lg border border-slate-200 p-2 shadow-inner" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
                  <RenderDrawing />
                </div>
              </div>

              <div className="space-y-3 pt-2 pb-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-t-2 border-slate-900 pt-4 gap-4" style={{ borderColor: '#0f172a' }}>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1" style={{ color: '#94a3b8' }}>Условия поставки</p>
                    <p className="font-bold text-slate-900 text-xs" style={{ color: '#0f172a' }}>Срок изготовления: {calcResults.term} рабочих дней</p>
                    {mode === 'manager' && docType === 'kp' && (
                      <p className="text-slate-500 text-[10px]" style={{ color: '#64748b' }}>Цена за секцию: {Math.round(calcResults.pricePerSection).toLocaleString()} ₽</p>
                    )}
                    {docType === 'kp' && (
                      <div className="text-slate-500 text-[10px] mt-0.5 flex flex-wrap items-center gap-1" style={{ color: '#64748b' }}>
                        <span>Предоплата: {CALC_CONFIG.prepaymentRate * 100}% (</span>
                        {mode === 'manager' ? (
                          <input 
                            type="text" 
                            inputMode="numeric"
                            value={params.manualPrepayment === 0 ? Math.round(calcResults.prepayment) : params.manualPrepayment} 
                            className="w-20 bg-indigo-50/50 border border-indigo-100 rounded px-1.5 py-0.5 font-bold text-indigo-600 outline-none focus:border-indigo-400 focus:bg-white transition-all" 
                            onChange={(e) => handleNumChange('manualPrepayment', e.target.value)}
                          />
                        ) : (
                          <span className="font-bold text-indigo-600" style={{ color: '#4f46e5' }}>{Math.round(calcResults.prepayment).toLocaleString()}</span>
                        )}
                        <span>₽)</span>
                      </div>
                    )}
                  </div>
                  {docType === 'kp' && (
                    <div className="sm:text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-wider" style={{ color: '#94a3b8' }}>Всего к оплате (вкл. НДС 0%)</p>
                      {mode === 'manager' ? (
                         <div className="flex items-center sm:justify-end gap-1">
                            <input 
                              type="text" 
                              inputMode="numeric"
                              value={params.manualTotal === 0 ? Math.round(calcResults.total) : params.manualTotal} 
                              className="w-32 text-left sm:text-right bg-indigo-50/50 border border-indigo-100 rounded-xl px-3 py-1.5 text-2xl font-black text-slate-900 outline-none focus:border-indigo-400 focus:bg-white transition-all" 
                              onChange={(e) => handleNumChange('manualTotal', e.target.value)}
                            />
                            <span className="text-lg font-bold text-slate-900">₽</span>
                         </div>
                      ) : (
                        <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter" style={{ color: '#0f172a' }}>{Math.round(calcResults.total).toLocaleString()} <span className="text-lg font-bold">₽</span></p>
                      )}
                    </div>
                  )}
                </div>
                {docType === 'kp' && (
                  <div className="bg-amber-50 border-l-2 border-amber-400 p-2.5" style={{ backgroundColor: '#fffbeb', borderColor: '#fbbf24' }}>
                    <p className="text-[9px] text-amber-700 leading-tight font-medium" style={{ color: '#b45309' }}>Предварительный расчет носит информационный характер и действителен в течение 5 рабочих дней.</p>
                  </div>
                )}
              </div>
            </div>


            <div className="p-4 sm:p-8 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-3 relative z-[70]">
              <button 
                onClick={(e) => handleSavePDF(e)}
                className="flex-[2] py-3 sm:py-4 bg-indigo-600 text-white font-bold rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-500 transition-all shadow-lg active:scale-95"
              >
                <Download size={18} /> Сохранить PDF
              </button>
              <button 
                onClick={(e) => handleCopyText(e)}
                className={`flex-[2] py-3 sm:py-4 font-bold rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 border-2 ${isCopied ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {isCopied ? (
                  <>
                    <Check size={18} /> Скопировано
                  </>
                ) : (
                  <>
                    <Copy size={18} /> {docType === 'production' ? 'Скопировать задание' : 'Сформировать текст'}
                  </>
                )}
              </button>
              <button 
                onClick={() => setShowKP(false)}
                className="flex-1 py-3 sm:py-4 bg-white text-slate-900 font-bold rounded-xl sm:rounded-2xl border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                Вернуться
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
