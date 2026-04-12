export interface ProductItem {
  id: number;
  productId?: string;
  name: string;
  price: number;
  images: string[];
  description: string;
  category: string;
  originalPrice?: number;
  duration?: string;
  groupSize?: number;
  ticketsLeft?: number;
  benefits?: string[];
  highlights?: string[];
  location?: string;
  dateFrom?: string;
  dateTo?: string;
  activityLevel?: string;
  guide?: string;
  inclusions?: string[];
  exclusions?: string[];
}

export interface CategorySection {
  name: string;
  items: ProductItem[];
}

interface CatalogOptions {
  hidePastTrips?: boolean;
}

const ADMIN_EVENTS_KEY = 'admin-events';
const ADMIN_CATALOG_UPDATES_KEY = 'admin-catalog-updates';
const TRIPS_COLLECTION = 'trips';

// Import trips data from JSON
import tripsData from './trips.json';

// Build category sections from trips data
function buildCategorySections(): CategorySection[] {
  const grouped = new Map<string, ProductItem[]>();
  
  for (const trip of tripsData as ProductItem[]) {
    const normalizedTrip: ProductItem = {
      ...trip,
      benefits: trip.benefits ?? trip.highlights,
    };
    const category = trip.category || 'Other';
    const items = grouped.get(category) ?? [];
    items.push(normalizedTrip);
    grouped.set(category, items);
  }
  
  const orderedCategories = ['Safari', 'Adventure', 'City & Coast'];
  const result: CategorySection[] = [];
  
  for (const category of orderedCategories) {
    const items = grouped.get(category) ?? [];
    if (items.length > 0) {
      result.push({ name: category, items });
    }
  }
  
  for (const [category, items] of grouped) {
    if (!orderedCategories.includes(category)) {
      result.push({ name: category, items });
    }
  }
  
  return result;
}

const CATEGORY_SECTIONS: CategorySection[] = buildCategorySections();

// Build product index from trips data
const productEntries: Array<[number, ProductItem]> = [];
for (const trip of tripsData as ProductItem[]) {
  const normalizedTrip: ProductItem = {
    ...trip,
    benefits: trip.benefits ?? trip.highlights,
  };
  productEntries.push([normalizedTrip.id, normalizedTrip]);
}
const PRODUCT_INDEX = new Map<number, ProductItem>(productEntries);

function parseDateOnly(value: string): Date | null {
  const parts = value.split('-');
  if (parts.length !== 3) {
    return null;
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function isVisibleByDate(item: ProductItem, hidePastTrips: boolean): boolean {
  if (!hidePastTrips || !item.dateFrom) {
    return true;
  }

  const startDate = parseDateOnly(item.dateFrom);
  if (!startDate) {
    return true;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime() <= startDate.getTime();
}

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

function readCatalogUpdates(): Record<string, ProductItem> {
  if (typeof window === 'undefined') {
    return {};
  }

  const raw = localStorage.getItem(ADMIN_CATALOG_UPDATES_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, ProductItem>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeCatalogUpdates(updates: Record<string, ProductItem>): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(ADMIN_CATALOG_UPDATES_KEY, JSON.stringify(updates));
}

function applyCatalogUpdate(item: ProductItem, updates: Record<string, ProductItem>): ProductItem {
  const updated = updates[String(item.id)];
  if (!updated) {
    return item;
  }

  return {
    ...item,
    ...updated,
    id: item.id,
  };
}

export function saveAdminEvent(item: ProductItem): void {
  if (typeof window === 'undefined') {
    return;
  }

  const events = readAdminEvents();
  events.push(item);
  localStorage.setItem(ADMIN_EVENTS_KEY, JSON.stringify(events));
}

export function updateCatalogItem(item: ProductItem): void {
  if (typeof window === 'undefined') {
    return;
  }

  const updates = readCatalogUpdates();
  updates[String(item.id)] = { ...item };
  writeCatalogUpdates(updates);
}

export function getCategorySections(options: CatalogOptions = {}): CategorySection[] {
  const hidePastTrips = options.hidePastTrips ?? false;
  const updates = readCatalogUpdates();
  const allItems: ProductItem[] = [];

  for (const section of CATEGORY_SECTIONS) {
    for (const item of section.items) {
      const resolved = applyCatalogUpdate(item, updates);
      if (isVisibleByDate(resolved, hidePastTrips)) {
        allItems.push(resolved);
      }
    }
  }

  const adminEvents = readAdminEvents();
  for (const event of adminEvents) {
    const resolved = applyCatalogUpdate(event, updates);
    if (isVisibleByDate(resolved, hidePastTrips)) {
      allItems.push(resolved);
    }
  }

  const orderedCategories: string[] = [];
  for (const section of CATEGORY_SECTIONS) {
    orderedCategories.push(section.name);
  }

  for (const item of allItems) {
    if (!orderedCategories.includes(item.category)) {
      orderedCategories.push(item.category);
    }
  }

  const grouped = new Map<string, ProductItem[]>();
  for (const item of allItems) {
    const items = grouped.get(item.category) ?? [];
    items.push(item);
    grouped.set(item.category, items);
  }

  const result: CategorySection[] = [];
  for (const category of orderedCategories) {
    const items = grouped.get(category) ?? [];
    if (hidePastTrips && items.length === 0) {
      continue;
    }

    result.push({
      name: category,
      items,
    });
  }

  return result;
}

export function getAllProducts(): ProductItem[] {
  return getCategorySections().reduce((all: ProductItem[], section) => {
    all.push(...section.items);
    return all;
  }, []);
}

export function getAllProductsWithOptions(options: CatalogOptions = {}): ProductItem[] {
  return getCategorySections(options).reduce((all: ProductItem[], section) => {
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
