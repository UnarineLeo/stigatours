import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent, IonButton, AlertController } from '@ionic/angular/standalone';
import { FooterComponent } from '../footer/footer.component';
import { findProductById, getAllProducts, getDiscountPercent, ProductItem } from '../shared/product-catalog';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';

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
    private authService: AuthService,
    private alertController: AlertController,
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
      this.selectedImage = this.galleryImages[0] ?? '';
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

  async addToCart(item: ProductItem): Promise<void> {
    const cartRaw = localStorage.getItem('cart-items');
    const cartItems = cartRaw ? JSON.parse(cartRaw) as Array<{ id: number; qty: number }> : [];
    const existingItem = cartItems.find((cartItem) => cartItem.id === item.id);

    if (existingItem) {
      existingItem.qty += 1;
    } else {
      cartItems.push({ id: item.id, qty: 1 });
    }

    localStorage.setItem('cart-items', JSON.stringify(cartItems));
    await this.authService.presentToast(`${item.name} has been added to your bookings.`);
    await this.showAddedAlert(item);
  }

  private async showAddedAlert(item: ProductItem) {
    const alert = await this.alertController.create({
      header: 'Trip Added',
      message: `${item.name} has been successfully added to your bookings!`,
      buttons: ['OK']
    });
    await alert.present();
  }

  async addRecommendedToCart(item: ProductItem, event: Event): Promise<void> {
    event.stopPropagation();
    await this.addToCart(item);
  }

  private buildGallery(item: ProductItem): string[] {
    return [
      ...(item.images ?? []),
      `https://picsum.photos/seed/item-${item.id}-angle-1/1000/800`,
      `https://picsum.photos/seed/item-${item.id}-angle-2/1000/800`,
      `https://picsum.photos/seed/item-${item.id}-angle-3/1000/800`,
    ];
  }

  private getRecommended(currentItem: ProductItem): ProductItem[] {
    const allProducts = getAllProducts();

    const sameCategory = allProducts.filter(
      (item) => item.category === currentItem.category && item.id !== currentItem.id
    );

    const fallback = allProducts.filter(
      (item) => item.category !== currentItem.category && item.id !== currentItem.id
    );

    return [...sameCategory, ...fallback].slice(0, 4);
  }
}
