export const CALC_CONFIG = {
  sectionWidth: 600,
  basePrices: [
    { maxH: 1500, price: 2800 },
    { maxH: 2200, price: 3300 },
  ],
  nonStandardPenalty: 0.05,  // 5%
  colors: ['Белый', 'Чёрный', 'Бежевый', 'Серый'],
  frameMaterials: [
    { id: 'pine', name: 'Массив дерева (сосна)', color: '#8b5e3c', multiplier: 1.0 },
    { id: 'raw', name: 'Неокрашенное дерево', color: '#d2b48c', multiplier: 0.85 }
  ],
  productionDays: 5,
  prepaymentRate: 0.5,
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
    meta: 'Деревянный каркас, ткань Оксфорд. Высота 1800мм.',
    tags: { color: 'Белый', frameColor: 'Белый' }
  },
  { 
    id: 3, 
    title: 'Перегородка "Лофт" (Чёрный)', 
    type: 'Перегородка декоративная', 
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&q=80&w=400&h=300', 
    sections: 4,
    meta: 'Деревянный каркас, ткань Blackout. Зонирование.',
    tags: { color: 'Чёрный', frameColor: 'Чёрный' }
  },
  { 
    id: 6, 
    title: 'Ширма "Эко" (Бежевый)', 
    type: 'Ширма складная', 
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=400&h=300', 
    sections: 6,
    meta: 'Дерево, натуральный хлопок. Дизайнерская серия.',
    tags: { color: 'Бежевый', frameColor: 'Белый' }
  },
  { 
    id: 7, 
    title: 'Серый Оксфорд', 
    type: 'Ширма складная', 
    image: 'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&q=80&w=400&h=300', 
    sections: 5,
    meta: 'Серый цвет в интерьере офиса.',
    tags: { color: 'Серый', frameColor: 'Чёрный' }
  },
];
