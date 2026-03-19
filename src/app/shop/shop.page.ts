import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonRange,
  IonSegment,
  IonSegmentButton,
  IonButton,
  IonChip,
  IonToggle,
} from '@ionic/angular/standalone';
import { getAllProducts, getCategorySections, getDiscountPercent, ProductItem } from '../shared/product-catalog';

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name-asc';
type ViewMode = 'grid' | 'compact';

@Component({
  selector: 'app-shop',
  templateUrl: 'shop.page.html',
  styleUrls: ['shop.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonRange,
    IonSegment,
    IonSegmentButton,
    IonButton,
    IonChip,
    IonToggle,
  ],
})
export class ShopPage {
  readonly allProducts: ProductItem[] = getAllProducts();
  readonly categories = ['all', ...getCategorySections().map((section) => section.name)];
  readonly maxPrice = Math.ceil(Math.max(...this.allProducts.map((item) => item.price)));

  searchTerm = '';
  selectedCategory = 'all';
  sortBy: SortOption = 'featured';
  viewMode: ViewMode = 'grid';
  discountedOnly = false;
  priceRange = {
    lower: 0,
    upper: this.maxPrice,
  };

  constructor(
    private router: Router,
    private toastController: ToastController,
  ) {}

  get filteredProducts(): ProductItem[] {
    let products = this.allProducts.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesCategory = this.selectedCategory === 'all' || item.category === this.selectedCategory;
      const matchesPrice = item.price >= this.priceRange.lower && item.price <= this.priceRange.upper;
      const matchesDiscount = !this.discountedOnly || getDiscountPercent(item) > 0;

      return matchesSearch && matchesCategory && matchesPrice && matchesDiscount;
    });

    if (this.sortBy === 'price-asc') {
      products = [...products].sort((a, b) => a.price - b.price);
    }

    if (this.sortBy === 'price-desc') {
      products = [...products].sort((a, b) => b.price - a.price);
    }

    if (this.sortBy === 'name-asc') {
      products = [...products].sort((a, b) => a.name.localeCompare(b.name));
    }

    return products;
  }

  formatRand(amount: number): string {
    return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  getDiscount(item: ProductItem): number {
    return getDiscountPercent(item);
  }

  setQuickFilter(type: 'all' | 'under-500' | 'discounts'): void {
    if (type === 'all') {
      this.discountedOnly = false;
      this.priceRange = { lower: 0, upper: this.maxPrice };
      return;
    }

    if (type === 'under-500') {
      this.discountedOnly = false;
      this.priceRange = { lower: 0, upper: 15000 };
      return;
    }

    this.discountedOnly = true;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = 'all';
    this.sortBy = 'featured';
    this.viewMode = 'grid';
    this.discountedOnly = false;
    this.priceRange = { lower: 0, upper: this.maxPrice };
  }

  openItem(itemId: number): void {
    this.router.navigate(['/tabs/item', itemId]);
  }

  async addToCart(item: ProductItem, event: Event): Promise<void> {
    event.stopPropagation();

    const cartRaw = localStorage.getItem('cart-items');
    const cartItems = cartRaw ? JSON.parse(cartRaw) as Array<{ id: number; qty: number }> : [];
    const existingItem = cartItems.find((cartItem) => cartItem.id === item.id);

    if (existingItem) {
      existingItem.qty += 1;
    } else {
      cartItems.push({ id: item.id, qty: 1 });
    }

    localStorage.setItem('cart-items', JSON.stringify(cartItems));
    await this.presentBookingToast(item.name);
  }

  private async presentBookingToast(itemName: string): Promise<void> {
    const toast = await this.toastController.create({
      message: `${itemName} has been added to your bookings.`,
      duration: 1800,
      color: 'success',
      position: 'top',
    });

    await toast.present();
  }
}
