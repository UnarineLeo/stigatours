export interface ProductItem {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
  originalPrice?: number;
  duration?: string;
  groupSize?: number;
  ticketsLeft?: number;
  benefits?: string[];
  location?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CategorySection {
  name: string;
  items: ProductItem[];
}

const ADMIN_EVENTS_KEY = 'admin-events';

export const CATEGORY_SECTIONS: CategorySection[] = [
  {
    name: 'Safari',
    items: [
      {
        id: 1,
        name: 'Kruger Safari Adventure',
        price: 15999,
        originalPrice: 18500,
        image: 'https://picsum.photos/seed/kruger-safari-wild/800/500',
        description:
          'Immerse yourself in the wild heart of South Africa with expert-guided game drives through the iconic Kruger National Park. Spot the Big Five in their natural habitat from the comfort of an open safari vehicle.',
        category: 'Safari',
        location: 'Kruger National Park, South Africa',
        duration: '5 days / 4 nights',
        groupSize: 12,
        ticketsLeft: 8,
        dateFrom: '2026-05-15',
        dateTo: '2026-05-20',
        benefits: [
          '3 guided game drives daily (morning, afternoon & night)',
          '4 nights en-suite bush lodge accommodation',
          'All meals – full board (breakfast, lunch & dinner)',
          'Park entry & conservation fees included',
          'Professional, registered safari guide',
          'Return airport transfers from Johannesburg',
        ]
      },
      {
        id: 5,
        name: 'Okavango Delta Escape',
        price: 28000,
        image: 'https://picsum.photos/seed/okavango-waters/800/500',
        description:
          `Explore the pristine waterways of Botswana's Okavango Delta by traditional mokoro canoe. Walk with trackers through lush floodplains, encounter rare wildlife up close, and unwind at a luxury tented camp under star-filled skies.`,
        category: 'Safari',
        location: 'Okavango Delta, Botswana',
        duration: '5 days / 4 nights',
        groupSize: 8,
        ticketsLeft: 5,
        dateFrom: '2026-06-10',
        dateTo: '2026-06-15',
        benefits: [
          'Guided mokoro canoe safaris through the delta',
          'Daily bush walks with experienced trackers',
          '4 nights luxury tented camp accommodation',
          'All meals and selected beverages included',
          'Sunset boat cruise on the delta waterways',
          'Small-aircraft transfers within the delta',
        ],
      }
    ],
  },
  {
    name: 'Adventure',
    items: [
      {
        id: 3,
        name: 'Victoria Falls Expedition',
        price: 22800,
        originalPrice: 25500,
        image: 'https://picsum.photos/seed/victoria-falls-mist/800/500',
        description:
          `Stand at the edge of the world's largest waterfall and feel the thunderous spray of Victoria Falls. This adventure-packed expedition combines heart-pumping white water rafting on the Zambezi River with breathtaking scenic experiences.`,
        category: 'Adventure',
        location: 'Victoria Falls, Zimbabwe / Zambia',
        duration: '6 days / 5 nights',
        groupSize: 16,
        ticketsLeft: 11,
        dateFrom: '2026-07-01',
        dateTo: '2026-07-07',
        benefits: [
          'Guided walking tour of Victoria Falls viewpoints',
          'White water rafting on Grade 4 & 5 Zambezi rapids',
          'Sunset cruise on the upper Zambezi River',
          '5 nights lodge accommodation',
          'All meals and non-alcoholic beverages',
          'Inter-destination road & boat transfers',
        ],
      },
    ],
  },
  {
    name: 'Beach',
    items: [
      {
        id: 4,
        name: 'Zanzibar Beach Retreat',
        price: 19500,
        image: 'https://picsum.photos/seed/zanzibar-white-sand/800/500',
        description:
          'Escape to the turquoise shores of Zanzibar for a week of pure relaxation and cultural discovery. Lounge on powder-white beaches, snorkel vibrant coral reefs, and wander the spice-scented lanes of UNESCO-listed Stone Town.',
        category: 'Beach',
        location: 'Zanzibar Island, Tanzania',
        duration: '7 days / 6 nights',
        groupSize: 10,
        ticketsLeft: 6,
        dateFrom: '2026-08-20',
        dateTo: '2026-08-27',
        benefits: [
          '6 nights beachfront villa accommodation',
          'Guided snorkelling excursion at coral reef',
          'Zanzibar Stone Town half-day spice tour',
          'All meals – full board (breakfast, lunch & dinner)',
          'Traditional dhow sunset sailing trip',
          'Return private airport transfers',
        ],
      },
    ],
  },
  {
    name: 'City & Coast',
    items: [
      {
        id: 2,
        name: 'Cape Town Explorer',
        price: 12500,
        originalPrice: 14800,
        image: 'https://picsum.photos/seed/cape-town-mountain/800/500',
        description:
          `Discover the Mother City in all its glory \u2013 from the iconic flat-topped Table Mountain to the sweeping Cape Peninsula coastline. Sip world-class wines in the Winelands and soak up the vibrant culture of one of Africa's most beautiful cities.`,
        category: 'City & Coast',
        location: 'Cape Town, South Africa',
        duration: '4 days / 3 nights',
        groupSize: 20,
        ticketsLeft: 14,
        dateFrom: '2026-04-10',
        dateTo: '2026-04-14',
        benefits: [
          'Table Mountain cable car return ticket',
          'Full-day guided Cape Winelands tour with tastings',
          'Cape Peninsula scenic drive (Boulders Beach penguins)',
          '3 nights boutique hotel accommodation',
          'Daily breakfast included',
          'Return airport transfers',
        ],
      },
    ],
  },
];

const productEntries: Array<[number, ProductItem]> = [];

for (const section of CATEGORY_SECTIONS) {
  for (const item of section.items) {
    productEntries.push([item.id, item]);
  }
}

const PRODUCT_INDEX = new Map<number, ProductItem>(productEntries);

function readAdminEvents(): ProductItem[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = localStorage.getItem(ADMIN_EVENTS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as ProductItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAdminEvent(item: ProductItem): void {
  if (typeof window === 'undefined') {
    return;
  }

  const events = readAdminEvents();
  events.push(item);
  localStorage.setItem(ADMIN_EVENTS_KEY, JSON.stringify(events));
}

export function getCategorySections(): CategorySection[] {
  const baseSections = CATEGORY_SECTIONS.map((section) => ({
    name: section.name,
    items: [...section.items],
  }));

  const adminEvents = readAdminEvents();
  for (const event of adminEvents) {
    const existingSection = baseSections.find((section) => section.name === event.category);
    if (existingSection) {
      existingSection.items.push(event);
      continue;
    }

    baseSections.push({
      name: event.category,
      items: [event],
    });
  }

  return baseSections;
}

export function getAllProducts(): ProductItem[] {
  return getCategorySections().reduce((all: ProductItem[], section) => {
    all.push(...section.items);
    return all;
  }, []);
}

export function getNextProductId(): number {
  const allProducts = getAllProducts();
  const maxId = allProducts.reduce((max, item) => Math.max(max, item.id), 0);
  return maxId + 1;
}

export function findProductById(id: number): ProductItem | undefined {
  if (typeof window !== 'undefined') {
    const allProducts = getAllProducts();
    return allProducts.find((item) => item.id === id);
  }

  return PRODUCT_INDEX.get(id);
}

export function getDiscountPercent(item: ProductItem): number {
  if (!item.originalPrice || item.originalPrice <= item.price) {
    return 0;
  }

  return Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100);
}
