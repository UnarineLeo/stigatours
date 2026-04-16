import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonItem, IonLabel, IonInput } from '@ionic/angular/standalone';
import { findProductById, ProductItem } from '../shared/product-catalog';
import { appendCheckoutRecords, CheckoutRecord } from '../shared/admin-storage';
import { FooterComponent } from '../footer/footer.component';

interface StoredBookingItem {
  id: number;
  qty: number;
  packageType?: 'single' | 'couples';
}

interface BookingItem {
  product: ProductItem;
  qty: number;
  packageType: 'single' | 'couples';
}

@Component({
  selector: 'app-bookings',
  templateUrl: 'bookings.page.html',
  styleUrls: ['bookings.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonItem, IonLabel, IonInput, FooterComponent],
})
export class BookingsPage {
  bookingItems: BookingItem[] = [];
  checkoutEmail = '';

  constructor(private toastController: ToastController) {}

  ionViewWillEnter(): void {
    this.loadBookings();
  }

  formatRand(amount: number): string {
    return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  getItemTotal(item: BookingItem): number {
    const unitPrice = item.packageType === 'couples'
      ? (item.product.couplesPrice ?? item.product.price * 2)
      : item.product.price;

    return unitPrice * item.qty;
  }

  getBookingSubtotal(): number {
    return this.bookingItems.reduce((sum, item) => sum + this.getItemTotal(item), 0);
  }

  incrementQty(itemId: number, packageType: 'single' | 'couples' = 'single'): void {
    this.updateQty(itemId, packageType, 1);
  }

  decrementQty(itemId: number, packageType: 'single' | 'couples' = 'single'): void {
    this.updateQty(itemId, packageType, -1);
  }

  removeItem(itemId: number, packageType: 'single' | 'couples' = 'single'): void {
    const stored = this.readStoredBookings().filter((item) => item.id !== itemId || (item.packageType ?? 'single') !== packageType);
    this.writeStoredBookings(stored);
    this.loadBookings();
  }

  clearBookings(): void {
    localStorage.removeItem('cart-items');
    this.loadBookings();
  }

  async confirmBooking(): Promise<void> {
    const email = this.checkoutEmail.trim();
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!isEmailValid) {
      await this.presentToast('Please enter a valid email address.', 'warning');
      return;
    }

    if (this.bookingItems.length === 0) {
      await this.presentToast('No trips in your bookings.', 'warning');
      return;
    }

    const bookedAt = new Date().toISOString();
    const checkoutRecords: CheckoutRecord[] = this.bookingItems.map((item) => ({
      id: `${item.product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userEmail: email,
      tripBooked: `${item.product.name} (${item.packageType === 'couples' ? 'Couple Offer' : 'Single Package'})`,
      amountPaid: this.getItemTotal(item),
      qty: item.qty,
      bookedAt,
    }));

    appendCheckoutRecords(checkoutRecords);
    this.clearBookings();
    this.checkoutEmail = '';

    await this.presentToast('Booking confirmed successfully.', 'success');
  }

  private updateQty(itemId: number, packageType: 'single' | 'couples', delta: number): void {
    const stored = this.readStoredBookings();
    const target = stored.find((item) => item.id === itemId && (item.packageType ?? 'single') === packageType);

    if (!target) {
      return;
    }

    target.qty += delta;

    const filtered = stored.filter((item) => item.qty > 0);
    this.writeStoredBookings(filtered);
    this.loadBookings();
  }

  private loadBookings(): void {
    const stored = this.readStoredBookings();
    const mapped: BookingItem[] = [];
    const grouped = new Map<string, BookingItem>();

    for (const item of stored) {
      const product = findProductById(item.id);
      if (product) {
        const packageType = item.packageType === 'couples' ? 'couples' : 'single';
        const key = `${item.id}:${packageType}`;
        const existing = grouped.get(key);

        if (existing) {
          existing.qty += item.qty;
        } else {
          const bookingItem: BookingItem = { product, qty: item.qty, packageType };
          grouped.set(key, bookingItem);
          mapped.push(bookingItem);
        }
      }
    }

    this.bookingItems = mapped;
  }

  private readStoredBookings(): StoredBookingItem[] {
    const cartRaw = localStorage.getItem('cart-items');
    if (!cartRaw) {
      return [];
    }

    try {
      const parsed = JSON.parse(cartRaw) as StoredBookingItem[];
      return Array.isArray(parsed)
        ? parsed.map((item) => ({
            id: item.id,
            qty: item.qty,
            packageType: item.packageType === 'couples' ? 'couples' : 'single',
          }))
        : [];
    } catch {
      return [];
    }
  }

  private writeStoredBookings(items: StoredBookingItem[]): void {
    localStorage.setItem('cart-items', JSON.stringify(items));
  }

  private async presentToast(message: string, color: 'success' | 'warning'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 1800,
      color,
      position: 'top',
    });

    await toast.present();
  }
}