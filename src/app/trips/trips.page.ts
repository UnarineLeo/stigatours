import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  IonButton,
  IonChip,
  IonToggle,
} from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { getAllProductsWithOptions, getCategorySections, getDiscountPercent, ProductItem } from '../shared/product-catalog';
import { FooterComponent } from '../footer/footer.component';


type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name-asc';

@Component({
  selector: 'app-trips',
  templateUrl: 'trips.page.html',
  styleUrls: ['trips.page.scss'],
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
    IonButton,
    IonChip,
    IonToggle,
    FooterComponent,
  ],
})
export class TripsPage {
  allProducts: ProductItem[] = [];
  categories: string[] = ['all'];
  maxPrice = 0;

  searchTerm = '';
  selectedCategory = 'all';
  sortBy: SortOption = 'featured';
  discountedOnly = false;
  dateFromFilter = '';
  dateToFilter = '';
  priceRange = {
    lower: 0,
    upper: this.maxPrice,
  };

  constructor(
    private router: Router,
    private alertController: AlertController,
  ) {
    this.refreshCatalog();
  }

  ionViewWillEnter(): void {
    this.refreshCatalog();
  }

  get filteredProducts(): ProductItem[] {
    let products = this.allProducts.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesCategory = this.selectedCategory === 'all' || item.category === this.selectedCategory;
      const matchesPrice = item.price >= this.priceRange.lower && item.price <= this.priceRange.upper;
      const matchesDiscount = !this.discountedOnly || getDiscountPercent(item) > 0;
      const matchesDate = this.matchesDateFilter(item);

      return matchesSearch && matchesCategory && matchesPrice && matchesDiscount && matchesDate;
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
    this.discountedOnly = false;
    this.dateFromFilter = '';
    this.dateToFilter = '';
    this.priceRange = { lower: 0, upper: this.maxPrice };
  }

  openItem(itemId: number): void {
    this.router.navigate(['/tabs/item', itemId]);
  }

  async addToCart(item: ProductItem, event: Event, packageType: 'single' | 'couples' = 'single'): Promise<void> {
    event.stopPropagation();

    const cartRaw = localStorage.getItem('cart-items');
    const cartItems = cartRaw ? JSON.parse(cartRaw) as Array<{ id: number; qty: number; packageType?: 'single' | 'couples' }> : [];
    const existingItem = cartItems.find((cartItem) => cartItem.id === item.id && (cartItem.packageType ?? 'single') === packageType);

    if (existingItem) {
      existingItem.qty += 1;
    } else {
      cartItems.push({ id: item.id, qty: 1, packageType });
    }

    localStorage.setItem('cart-items', JSON.stringify(cartItems));

    const packageLabel = packageType === 'couples' ? 'couple offer' : 'package';
    await this.presentAddedAlert(`${item.name} ${packageLabel} has been added to your bookings.`);
  }

  private refreshCatalog(): void {
    this.allProducts = getAllProductsWithOptions({ hidePastTrips: true });
    this.categories = ['all', ...getCategorySections({ hidePastTrips: true }).map((section) => section.name)];
    const highestPrice = this.allProducts.length > 0
      ? Math.max(...this.allProducts.map((item) => item.price))
      : 0;
    this.maxPrice = Math.ceil(highestPrice);

    this.priceRange = {
      lower: 0,
      upper: this.maxPrice,
    };
  }

  private matchesDateFilter(item: ProductItem): boolean {
    if (!this.dateFromFilter && !this.dateToFilter) {
      return true;
    }

    if (!item.dateFrom || !item.dateTo) {
      return false;
    }

    const itemFrom = new Date(`${item.dateFrom}T00:00:00`).getTime();
    const itemTo = new Date(`${item.dateTo}T23:59:59`).getTime();
    if (Number.isNaN(itemFrom) || Number.isNaN(itemTo)) {
      return false;
    }

    const filterFrom = this.dateFromFilter
      ? new Date(`${this.dateFromFilter}T00:00:00`).getTime()
      : Number.NEGATIVE_INFINITY;
    const filterTo = this.dateToFilter
      ? new Date(`${this.dateToFilter}T23:59:59`).getTime()
      : Number.POSITIVE_INFINITY;

    return itemFrom <= filterTo && itemTo >= filterFrom;
  }

  private async presentAddedAlert(message: string): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Added to Bookings',
      message,
      buttons: ['OK'],
    });

    await alert.present();
  }
}