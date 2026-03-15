import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/angular/standalone';
import { findProductById, ProductItem } from '../shared/product-catalog';

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
  imports: [CommonModule, RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonButton],
})
export class CartPage {
  cartItems: CartItem[] = [];

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
}
