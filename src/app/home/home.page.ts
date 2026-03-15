import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { FooterComponent } from '../footer/footer.component';
import { CATEGORY_SECTIONS, CategorySection, getDiscountPercent, ProductItem } from '../shared/product-catalog';

interface HeroSlide {
  title: string;
  subtitle: string;
  cta: string;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonButton, FooterComponent],
})
export class HomePage implements OnInit, OnDestroy {
  readonly heroSlides: HeroSlide[] = [
    {
      title: 'Africa Awaits You',
      subtitle: 'Embark on unforgettable safari adventures, coastal escapes, and cultural journeys across the continent.',
      cta: 'Explore Trips',
    },
    {
      title: 'Big Five. Big Memories.',
      subtitle: 'Track lions, elephants and leopards on expert-guided game drives through Africas greatest wilderness areas.',
      cta: 'View Safari Packages',
    },
    {
      title: 'Deals on Dream Destinations',
      subtitle: 'Save up to 15% on selected packages — book early and secure your place in paradise.',
      cta: 'See Special Offers',
    },
  ];

  readonly categorySections: CategorySection[] = CATEGORY_SECTIONS;

  currentSlideIndex = 0;
  private carouselTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private router: Router,
    private toastController: ToastController,
  ) {}

  ngOnInit(): void {
    this.startAutoplay();
  }

  ngOnDestroy(): void {
    if (this.carouselTimer) {
      clearInterval(this.carouselTimer);
    }
  }

  prevSlide(): void {
    const max = this.heroSlides.length;
    this.currentSlideIndex = (this.currentSlideIndex - 1 + max) % max;
    this.restartAutoplay();
  }

  nextSlide(): void {
    const max = this.heroSlides.length;
    this.currentSlideIndex = (this.currentSlideIndex + 1) % max;
  }

  goToSlide(index: number): void {
    this.currentSlideIndex = index;
    this.restartAutoplay();
  }

  formatRand(amount: number): string {
    return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  getDiscountPercent(item: ProductItem): number {
    return getDiscountPercent(item);
  }

  openItem(itemId: number): void {
    this.router.navigate(['/tabs/item', itemId]);
  }

  openTrips(): void {
    this.router.navigate(['/tabs/shop']);
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

  pauseAutoplay(): void {
    if (this.carouselTimer) {
      clearInterval(this.carouselTimer);
      this.carouselTimer = null;
    }
  }

  resumeAutoplay(): void {
    if (!this.carouselTimer) {
      this.startAutoplay();
    }
  }

  private startAutoplay(): void {
    this.carouselTimer = setInterval(() => {
      this.nextSlide();
    }, 4500);
  }

  private restartAutoplay(): void {
    this.pauseAutoplay();
    this.startAutoplay();
  }
}
