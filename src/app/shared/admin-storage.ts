export interface CheckoutRecord {
  id: string;
  userEmail: string;
  tripBooked: string;
  amountPaid: number;
  qty: number;
  bookedAt: string;
}

const CHECKOUT_RECORDS_KEY = 'checkout-records';
const ADMIN_AUTH_KEY = 'admin-authenticated';

function readJson<T>(key: string): T[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = localStorage.getItem(key);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJson<T>(key: string, value: T[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(key, JSON.stringify(value));
}

export function getCheckoutRecords(): CheckoutRecord[] {
  const records = readJson<CheckoutRecord>(CHECKOUT_RECORDS_KEY);
  return records.sort((a, b) => b.bookedAt.localeCompare(a.bookedAt));
}

export function appendCheckoutRecords(records: CheckoutRecord[]): void {
  const existing = readJson<CheckoutRecord>(CHECKOUT_RECORDS_KEY);
  writeJson(CHECKOUT_RECORDS_KEY, [...existing, ...records]);
}

export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
}

export function setAdminAuthenticated(value: boolean): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (value) {
    localStorage.setItem(ADMIN_AUTH_KEY, 'true');
    return;
  }

  localStorage.removeItem(ADMIN_AUTH_KEY);
}
