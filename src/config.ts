export const CALC_CONFIG = {
  sectionWidth: 600,
  basePrices: [
    { maxH: 1500, price: 2800 },
    { maxH: 2200, price: 3300 },
  ],
  heightSurchargeRate: 0.10, // 10%
  heightSurchargeStep: 200,   // per 200mm (20cm)
  nonStandardPenalty: 0.05,  // 5%
  colors: ['Белый', 'Чёрный', 'Бежевый', 'Серый'],
  frameMaterials: [
    { id: 'pine', name: 'Дерево', color: '#8b5e3c', multiplier: 1.0 },
    { id: 'mdf', name: 'МДФ', color: '#57534e', multiplier: 1.15 },
    { id: 'aluminum', name: 'Алюминий', color: '#94a3b8', multiplier: 1.40 }
  ],
  productionDays: 5,
  prepaymentRate: 0.7,
  markup: 2.5,
  commissionRate: 0.2,
};

export const demoGallery = [
  { 
    id: 1, 
    title: 'Ширма "Классик" (Белый)', 
    type: 'Ширма складная', 
    image: 'https://images.unsplash.com/photo-1598928636135-d146006ff4be?auto=format&fit=crop&q=80&w=400&h=300', 
    sections: 3,
    meta: 'Деревянный каркас, ткань Оксфорд. Высота 1800мм.'
  },
  { 
    id: 3, 
    title: 'Перегородка "Лофт" (Чёрный)', 
    type: 'Перегородка декоративная', 
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&q=80&w=400&h=300', 
    sections: 4,
    meta: 'Деревянный каркас, ткань Blackout. Зонирование.'
  },
  { 
    id: 6, 
    title: 'Ширма "Эко" (Бежевый)', 
    type: 'Ширма складная', 
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=400&h=300', 
    sections: 6,
    meta: 'Дерево, натуральный хлопок. Дизайнерская серия.'
  },
];
