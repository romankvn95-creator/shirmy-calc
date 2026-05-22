import { useState, useMemo } from 'react';
import { Download, FileText, User, Briefcase, LayoutGrid, ChevronDown, RefreshCw, Plus, Minus } from 'lucide-react';
import { CALC_CONFIG, demoGallery } from './config';

function AnimatedNumber({ value, suffix = "" }: { value: number, suffix?: string }) {
  return (
    <span>
      {Math.round(value).toLocaleString()}{suffix}
    </span>
  );
}

function SVGAnimatedNumber({ value, x, y, className, transform, textAnchor, suffix = "" }: { value: number, x: number | string, y: number | string, className?: string, transform?: string, textAnchor?: string, suffix?: string }) {
  return (
    <text x={x} y={y} className={className} transform={transform} textAnchor={textAnchor}>
      {Math.round(value).toLocaleString()}{suffix}
    </text>
  );
}

export default function App() {
  const [selectedImage, setSelectedImage] = useState<typeof demoGallery[0] | null>(null);
  const [showKP, setShowKP] = useState(false);
  const [mode, setMode] = useState<'client' | 'manager'>('client');
  const [params, setParams] = useState({
    width: 2000, height: 1800, color: 'Белый', frame: 'Дерево', customer: ''
  });

  const handleNumChange = (key: strin