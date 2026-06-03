export interface YandexDiskResource {
  name: string;
  file: string;
  preview: string;
  type: string;
  mime_type: string;
}

export interface GalleryItem {
  id: string | number;
  title: string;
  type: string;
  image: string;
  sections?: number;
  meta?: string;
  tags?: {
    color?: string;
    frameColor?: string;
  };
}

export async function fetchYandexDiskGallery(publicKey: string): Promise<GalleryItem[]> {
  try {
    const response = await fetch(`https://cloud-api.yandex.net/v1/disk/public/resources?public_key=${encodeURIComponent(publicKey)}&limit=100`);
    if (!response.ok) throw new Error('Failed to fetch Yandex Disk data');
    
    const data = await response.json();
    const items = data._embedded?.items || [];
    
    return items
      .filter((item: any) => item.type === 'file' && item.mime_type.startsWith('image/'))
      .map((item: any) => {
        const name = item.name.toLowerCase();
        
        // Simple tag extraction from filename
        const tags: any = {};
        if (name.includes('белы') || name.includes('white')) tags.color = 'Белый';
        if (name.includes('черн') || name.includes('чёрн') || name.includes('black')) tags.color = 'Чёрный';
        if (name.includes('бежев') || name.includes('beige')) tags.color = 'Бежевый';
        if (name.includes('серы') || name.includes('grey') || name.includes('gray')) tags.color = 'Серый';
        
        // Frame color extraction (often prefixed with "frame_" or similar in organized folders)
        if (name.includes('рам') || name.includes('frame')) {
           if (name.includes('белы') || name.includes('white')) tags.frameColor = 'Белый';
           if (name.includes('черн') || name.includes('black')) tags.frameColor = 'Чёрный';
        }

        return {
          id: `disk-${item.resource_id || item.name}`,
          title: item.name.split('.')[0].replace(/_/g, ' '),
          type: 'Портфолио',
          image: item.file,
          meta: `С Яндекс.Диска (${item.size ? Math.round(item.size / 1024) + ' KB' : ''})`,
          tags
        };
      });
  } catch (error) {
    console.error('Yandex Disk Fetch Error:', error);
    return [];
  }
}
