import { getApp, getApps, initializeApp } from 'firebase/app';
import { collection, deleteDoc, doc, getDocs, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';
import { environment } from 'src/environments/environment';
import tripsData from './trips.json';

export interface ProductItem {
  id: number;
  name: string;
  price: number;
  images: string[];
  description: string;
  category: string;
  couplesPrice?: number;
  duration?: string;
  tickets?: number;
  ticketsLeft?: number;
  benefits?: string[];
  highlights?: string[];
  location?: string;
  dateFrom?: string;
  dateTo?: string;
  activityLevel?: string;
  guide?: string;
  inclusions?: string[];
}

export interface CategorySection {
  name: string;
  items: ProductItem[];
}

interface CatalogOptions {
  hidePastTrips?: boolean;
}

const TRIPS_COLLECTION = 'trips';
const firebaseApp = getApps().length ? getApp() : initializeApp(environment.firebaseConfig);
const db = getFirestore(firebaseApp);

let catalogLoadPromise: Promise<void> | null = null;
let catalogTrips: ProductItem[] = normalizeTrips(tripsData as ProductItem[]);
let categorySectionsCache: CategorySection[] = buildCategorySections(catalogTrips);
let productIndexCache = buildProductIndex(catalogTrips);

function normalizeTrip(trip: ProductItem): ProductItem {
  const legacyTrip = trip as ProductItem & {
    originalPrice?: number;
    ticketsLeft?: number;
  };

  return {
    ...trip,
    couplesPrice: trip.couplesPrice ?? legacyTrip.originalPrice,
    tickets: trip.tickets ?? legacyTrip.ticketsLeft,
    ticketsLeft: trip.ticketsLeft ?? trip.tickets ?? legacyTrip.ticketsLeft,
    images: trip.images ?? [],
    benefits: trip.benefits ?? trip.highlights,
  };
}

function normalizeTrips(trips: ProductItem[]): ProductItem[] {
  return trips.map((trip) => normalizeTrip(trip));
}

function buildCategorySections(trips: ProductItem[]): CategorySection[] {
  const grouped = new Map<string, ProductItem[]>();
  
  for (const trip of trips) {
    const category = trip.category || 'Other';
    const items = grouped.get(category) ?? [];
    items.push(trip);
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

function buildProductIndex(trips: ProductItem[]): Map<number, ProductItem> {
  const productEntries: Array<[number, ProductItem]> = [];

  for (const trip of trips) {
    productEntries.push([trip.id, trip]);
  }

  return new Map<number, ProductItem>(productEntries);
}

function refreshCatalogCaches(trips: ProductItem[]): void {
  const normalized = normalizeTrips(trips);
  catalogTrips = normalized;
  categorySectionsCache = buildCategorySections(normalized);
  productIndexCache = buildProductIndex(normalized);
}

function getFallbackTrips(): ProductItem[] {
  return normalizeTrips(tripsData as ProductItem[]);
}

function buildTripWritePayload(item: ProductItem): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    id: item.id,
    name: item.name,
    price: item.price,
    images: [...(item.images ?? [])],
    description: item.description,
    category: item.category,
  };

  if (item.couplesPrice !== undefined) payload['couplesPrice'] = item.couplesPrice;
  if (item.duration !== undefined) payload['duration'] = item.duration;
  if (item.tickets !== undefined) payload['tickets'] = item.tickets;
  if (item.ticketsLeft !== undefined) payload['ticketsLeft'] = item.ticketsLeft;
  if (item.benefits !== undefined) payload['benefits'] = [...item.benefits];
  if (item.highlights !== undefined) payload['highlights'] = [...item.highlights];
  if (item.location !== undefined) payload['location'] = item.location;
  if (item.dateFrom !== undefined) payload['dateFrom'] = item.dateFrom;
  if (item.dateTo !== undefined) payload['dateTo'] = item.dateTo;
  if (item.activityLevel !== undefined) payload['activityLevel'] = item.activityLevel;
  if (item.guide !== undefined) payload['guide'] = item.guide;
  if (item.inclusions !== undefined) payload['inclusions'] = [...item.inclusions];

  // Never persist legacy singular image field; keep only images[] in Firestore.
  delete payload['image'];
  delete payload['productId'];
  delete payload['originalPrice'];
  delete payload['groupSize'];
  delete payload['ticketsLeft'];
  delete payload['exclusions'];

  return payload;
}

function tripDocId(id: number): string {
  return String(id);
}

async function seedTripsFromFallback(): Promise<void> {
  const fallbackTrips = getFallbackTrips();
  refreshCatalogCaches(fallbackTrips);

  if (typeof window === 'undefined') {
    return;
  }

  for (const trip of fallbackTrips) {
    await setDoc(doc(db, TRIPS_COLLECTION, tripDocId(trip.id)), {
      ...buildTripWritePayload(trip),
      updatedAt: serverTimestamp(),
    });
  }
}

export async function initializeTripCatalog(): Promise<void> {
  if (catalogLoadPromise) {
    return catalogLoadPromise;
  }

  catalogLoadPromise = (async () => {
    if (typeof window === 'undefined') {
      refreshCatalogCaches(getFallbackTrips());
      return;
    }

    try {
      const snapshot = await getDocs(collection(db, TRIPS_COLLECTION));
      const loadedTrips: ProductItem[] = [];

      snapshot.forEach((tripDoc) => {
        const data = tripDoc.data() as ProductItem;
        loadedTrips.push(normalizeTrip(data));
      });

      if (loadedTrips.length > 0) {
        loadedTrips.sort((a, b) => a.id - b.id);
        refreshCatalogCaches(loadedTrips);
        return;
      }

      try {
        await seedTripsFromFallback();
      } catch {
        refreshCatalogCaches(getFallbackTrips());
      }
    } catch {
      refreshCatalogCaches(getFallbackTrips());
    }
  })();

  return catalogLoadPromise;
}

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

export async function saveAdminEvent(item: ProductItem): Promise<void> {
  const normalized = normalizeTrip(item);
  const nextTrips = [...catalogTrips.filter((trip) => trip.id !== normalized.id), normalized]
    .sort((a, b) => a.id - b.id);

  refreshCatalogCaches(nextTrips);

  await setDoc(doc(db, TRIPS_COLLECTION, tripDocId(normalized.id)), {
    ...buildTripWritePayload(normalized),
    updatedAt: serverTimestamp(),
  });
}

export async function updateCatalogItem(item: ProductItem): Promise<void> {
  const existing = catalogTrips.find((trip) => trip.id === item.id);
  const merged = normalizeTrip({
    ...(existing ?? item),
    ...item,
    id: item.id,
  });

  const nextTrips = [...catalogTrips.filter((trip) => trip.id !== item.id), merged]
    .sort((a, b) => a.id - b.id);

  refreshCatalogCaches(nextTrips);

  await setDoc(doc(db, TRIPS_COLLECTION, tripDocId(item.id)), {
    ...buildTripWritePayload(merged),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCatalogItem(itemId: number): Promise<void> {
  const item = catalogTrips.find((trip) => trip.id === itemId);
  if (!item) {
    return;
  }

  const nextTrips = catalogTrips
    .filter((trip) => trip.id !== itemId)
    .sort((a, b) => a.id - b.id);

  refreshCatalogCaches(nextTrips);

  await deleteDoc(doc(db, TRIPS_COLLECTION, tripDocId(item.id)));
}

export function getCategorySections(options: CatalogOptions = {}): CategorySection[] {
  const hidePastTrips = options.hidePastTrips ?? false;
  const allItems: ProductItem[] = [];

  for (const section of categorySectionsCache) {
    for (const item of section.items) {
      if (isVisibleByDate(item, hidePastTrips)) {
        allItems.push(item);
      }
    }
  }

  const orderedCategories: string[] = [];
  for (const section of categorySectionsCache) {
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

  return productIndexCache.get(id);
}

export function getDiscountPercent(item: ProductItem): number {
  if (!item.couplesPrice || item.couplesPrice <= 0) {
    return 0;
  }

  const twoSingleTickets = item.price * 2;
  if (item.couplesPrice >= twoSingleTickets) {
    return 0;
  }

  return Math.round(((twoSingleTickets - item.couplesPrice) / twoSingleTickets) * 100);
}
