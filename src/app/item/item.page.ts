import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { FooterComponent } from '../footer/footer.component';
import { CATEGORY_SECTIONS, findProductById, getDiscountPercent, ProductItem } from '../shared/product-catalog';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-item',
  templateUrl: 'item.page.html',
  styleUrls: ['item.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonButton, RouterLink, FooterComponent],
})
export class ItemPage implements OnInit {
  product: ProductItem | null = null;
  galleryImages: string[] = [];
  selectedImage = '';
  isImageExpanded = false;
  recommendedItems: ProductItem[] = [];
  private routeSub: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      const id = Number(idParam);

      if (Number.isNaN(id)) {
        this.router.navigate(['/tabs/home']);
        return;
      }

      const foundProduct = findProductById(id);

      if (!foundProduct) {
        this.router.navigate(['/tabs/home']);
        return;
      }

      this.product = foundProduct;
      this.galleryImages = this.buildGallery(foundProduct);
      this.selectedImage = this.galleryImages[0] ?? foundProduct.image;
      this.isImageExpanded = false;
      this.recommendedItems = this.getRecommended(foundProduct);
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  formatRand(amount: number): string {
    return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  getDiscount(item: ProductItem): number {
    return getDiscountPercent(item);
  }

  selectImage(image: string): void {
    this.selectedImage = image;
  }

  expandImage(): void {
    this.isImageExpanded = true;
  }

  closeExpandedImage(): void {
    this.isImageExpanded = false;
  }

  openRecommendedItem(itemId: number): void {
    this.router.navigate(['/tabs/item', itemId]);
  }

  addToCart(item: ProductItem): void {
    const cartRaw = localStorage.getItem('cart-items');
    const cartItems = cartRaw ? JSON.parse(cartRaw) as Array<{ id: number; qty: number }> : [];
    const existingItem = cartItems.find((cartItem) => cartItem.id === item.id);

    if (existingItem) {
      existingItem.qty += 1;
    } else {
      cartItems.push({ id: item.id, qty: 1 });
    }

    localStorage.setItem('cart-items', JSON.stringify(cartItems));
  }

  addRecommendedToCart(item: ProductItem, event: Event): void {
    event.stopPropagation();
    this.addToCart(item);
  }

  private buildGallery(item: ProductItem): string[] {
    return [
      item.image,
      `https://picsum.photos/seed/item-${item.id}-angle-1/1000/800`,
      `https://picsum.photos/seed/item-${item.id}-angle-2/1000/800`,
      `https://picsum.photos/seed/item-${item.id}-angle-3/1000/800`,
    ];
  }

  private getRecommended(currentItem: ProductItem): ProductItem[] {
    const allProducts = CATEGORY_SECTIONS.reduce((all: ProductItem[], section) => {
      all.push(...section.items);
      return all;
    }, []);

    const sameCategory = allProducts.filter(
      (item) => item.category === currentItem.category && item.id !== currentItem.id
    );

    const fallback = allProducts.filter(
      (item) => item.category !== currentItem.category && item.id !== currentItem.id
    );

    return [...sameCategory, ...fallback].slice(0, 4);
  }
}
