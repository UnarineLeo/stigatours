import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonItem, IonLabel, IonInput } from '@ionic/angular/standalone';
import { findProductById, ProductItem } from '../shared/product-catalog';
import { appendCheckoutRecords, CheckoutRecord } from '../shared/admin-storage';

interface StoredCartItem {
  id: number;
  qty: number;
}

interface CartItem {
  product: ProductItem;
  qty: number;
}

@Component({
  selector: 'app-cart',
  templateUrl: 'cart.page.html',
  styleUrls: ['cart.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonItem, IonLabel, IonInput],
})
export class CartPage {
  cartItems: CartItem[] = [];
  checkoutEmail = '';

  constructor(private toastController: ToastController) {}

  ionViewWillEnter(): void {
    this.loadCart();
  }

  formatRand(amount: number): string {
    return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  getItemTotal(item: CartItem): number {
    return item.product.price * item.qty;
  }

  getCartSubtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + this.getItemTotal(item), 0);
  }

  incrementQty(itemId: number): void {
    this.updateQty(itemId, 1);
  }

  decrementQty(itemId: number): void {
    this.updateQty(itemId, -1);
  }

  removeItem(itemId: number): void {
    const stored = this.readStoredCart().filter((item) => item.id !== itemId);
    this.writeStoredCart(stored);
    this.loadCart();
  }

  clearCart(): void {
    localStorage.removeItem('cart-items');
    this.loadCart();
  }

  async confirmBooking(): Promise<void> {
    const email = this.checkoutEmail.trim();
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!isEmailValid) {
      await this.presentToast('Please enter a valid email address.', 'warning');
      return;
    }

    if (this.cartItems.length === 0) {
      await this.presentToast('No trips in your bookings.', 'warning');
      return;
    }

    const bookedAt = new Date().toISOString();
    const checkoutRecords: CheckoutRecord[] = this.cartItems.map((item) => ({
      id: `${item.product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userEmail: email,
      tripBooked: item.product.name,
      amountPaid: this.getItemTotal(item),
      qty: item.qty,
      bookedAt,
    }));

    appendCheckoutRecords(checkoutRecords);
    this.clearCart();
    this.checkoutEmail = '';

    await this.presentToast('Booking confirmed successfully.', 'success');
  }

  private updateQty(itemId: number, delta: number): void {
    const stored = this.readStoredCart();
    const target = stored.find((item) => item.id === itemId);

    if (!target) {
      return;
    }

    target.qty += delta;

    const filtered = stored.filter((item) => item.qty > 0);
    this.writeStoredCart(filtered);
    this.loadCart();
  }

  private loadCart(): void {
    const stored = this.readStoredCart();
    const mapped: CartItem[] = [];

    for (const item of stored) {
      const product = findProductById(item.id);
      if (product) {
        mapped.push({ product, qty: item.qty });
      }
    }

    this.cartItems = mapped;
  }

  private readStoredCart(): StoredCartItem[] {
    const cartRaw = localStorage.getItem('cart-items');
    if (!cartRaw) {
      return [];
    }

    try {
      const parsed = JSON.parse(cartRaw) as StoredCartItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeStoredCart(items: StoredCartItem[]): void {
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
