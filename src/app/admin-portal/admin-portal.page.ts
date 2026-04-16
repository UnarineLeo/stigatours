import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular';
import { CheckoutRecord, getCheckoutRecords } from '../shared/admin-storage';
import { ProductItem, deleteCatalogItem, getAllProducts, getCategorySections, getNextProductId, saveAdminEvent, updateCatalogItem } from '../shared/product-catalog';
import { FooterComponent } from '../footer/footer.component';
import { AuthService } from '../services/auth.service';

type AdminTab = 'events' | 'checkouts' | 'trips';

interface AdminEventForm {
  name: string;
  price: number | null;
  couplesPrice: number | null;
  image: string;
  description: string;
  category: string;
  location: string;
  duration: string;
  tickets: number | null;
  dateFrom: string;
  dateTo: string;
  benefitsText: string;
}

@Component({
  selector: 'app-admin-portal',
  templateUrl: './admin-portal.page.html',
  styleUrls: ['./admin-portal.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    FooterComponent,
  ],
})
export class AdminPortalPage implements OnInit {
  activeTab: AdminTab = 'events';
  checkoutRecords: CheckoutRecord[] = [];
  catalogTrips: ProductItem[] = [];
  editingTripId: number | null = null;
  categories: string[] = [];
  eventImages: string[] = [];
  editImages: string[] = [];
  tripsSearchQuery = '';
  checkoutSearchQuery = '';

  form: AdminEventForm = this.createEmptyForm();
  editForm: AdminEventForm = this.createEmptyForm();

  constructor(
    private router: Router,
    private toastController: ToastController,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    void this.initializeAdminPortal();
  }

  ionViewWillEnter(): void {
    void this.refreshIfAuthorized();
  }

  private async initializeAdminPortal(): Promise<void> {
    const canAccess = await this.canAccessAdminPortal();
    if (!canAccess) {
      return;
    }

    this.categories = getCategorySections().map((section) => section.name);
    this.refreshCatalogTrips();
    this.refreshCheckouts();
  }

  private async refreshIfAuthorized(): Promise<void> {
    const canAccess = await this.canAccessAdminPortal();
    if (!canAccess) {
      return;
    }

    this.refreshCatalogTrips();
    this.refreshCheckouts();
  }

  private async canAccessAdminPortal(): Promise<boolean> {
    const isLoggedIn = await this.authService.isAuthenticated();
    if (!isLoggedIn) {
      await this.router.navigate(['/tabs/admin-login']);
      return false;
    }

    const isAdmin = await this.authService.isCurrentUserAdmin();
    if (!isAdmin) {
      await this.router.navigate(['/tabs/admin-login']);
      return false;
    }

    return true;
  }

  async addEvent(): Promise<void> {
    if (!this.form.name.trim() || !this.form.description.trim() || !this.form.category.trim()) {
      await this.presentToast('Name, description, and category are required.', 'warning');
      return;
    }

    if (this.eventImages.length === 0) {
      await this.presentToast('Please upload at least one image for the event.', 'warning');
      return;
    }

    if (!this.form.price || this.form.price <= 0) {
      await this.presentToast('Please enter a valid event price.', 'warning');
      return;
    }

    if (!this.isDateRangeValid(this.form.dateFrom, this.form.dateTo)) {
      await this.presentToast('Date From must be earlier than Date To.', 'warning');
      return;
    }

    const eventItem: ProductItem = {
      id: getNextProductId(),
      name: this.form.name.trim(),
      price: this.form.price,
      couplesPrice: this.form.couplesPrice ?? undefined,
      images: [...this.eventImages],
      description: this.form.description.trim(),
      category: this.form.category.trim(),
      location: this.form.location.trim() || undefined,
      duration: this.form.duration.trim() || undefined,
      tickets: this.form.tickets ?? undefined,
      ticketsLeft: this.form.tickets ?? undefined,
      dateFrom: this.form.dateFrom || undefined,
      dateTo: this.form.dateTo || undefined,
      benefits: this.parseBenefits(this.form.benefitsText),
    };

    await saveAdminEvent(eventItem);

    if (!this.categories.includes(eventItem.category)) {
      this.categories = [...this.categories, eventItem.category];
    }

    this.refreshCatalogTrips();

    this.form = this.createEmptyForm();
    this.eventImages = [];
    await this.presentToast('Event added successfully.', 'success');
  }

  goToHome(): void {
    this.router.navigate(['/tabs/home']);
  }

  goToTrips(): void {
    this.router.navigate(['/tabs/trips']);
  }

  goToBookings(): void {
    this.router.navigate(['/tabs/bookings']);
  }

  goToAccount(): void {
    this.router.navigate(['/tabs/account']);
  }

  async onImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    if (files.length === 0) {
      return;
    }

    const encodedFiles = await Promise.all(files.map((file) => this.readFileAsDataUrl(file)));
    const validImages = encodedFiles.filter((value) => value.length > 0);
    this.eventImages = [...this.eventImages, ...validImages];
    this.form.image = this.eventImages[0] ?? '';
    input.value = '';
  }

  removeEventImage(index: number): void {
    this.eventImages = this.eventImages.filter((_, imageIndex) => imageIndex !== index);
    this.form.image = this.eventImages[0] ?? '';
  }

  formatRand(amount: number): string {
    return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  get filteredCatalogTrips(): ProductItem[] {
    const query = this.tripsSearchQuery.trim().toLowerCase();
    const filtered = !query
      ? [...this.catalogTrips]
      : this.catalogTrips.filter((trip) => {
      const text = [
        trip.name,
        trip.category,
        trip.location,
        trip.description,
        trip.dateFrom,
        trip.dateTo,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return text.includes(query);
    });

    return filtered.sort((a, b) => {
      const aTime = this.getTripSortTime(a);
      const bTime = this.getTripSortTime(b);

      if (aTime !== bTime) {
        return aTime - bTime;
      }

      return a.name.localeCompare(b.name);
    });
  }

  get activeCatalogTrips(): ProductItem[] {
    return this.filteredCatalogTrips.filter((trip) => this.isTripActive(trip));
  }

  get inactiveCatalogTrips(): ProductItem[] {
    return this.filteredCatalogTrips.filter((trip) => !this.isTripActive(trip));
  }

  get filteredCheckoutRecords(): CheckoutRecord[] {
    const query = this.checkoutSearchQuery.trim().toLowerCase();
    if (!query) {
      return this.checkoutRecords;
    }

    return this.checkoutRecords.filter((record) => {
      const text = [
        record.userEmail,
        record.tripBooked,
        String(record.amountPaid),
        String(record.qty),
        record.bookedAt,
      ]
        .join(' ')
        .toLowerCase();

      return text.includes(query);
    });
  }

  startEditTrip(item: ProductItem): void {
    const initialImages = (item.images ?? []).filter((image) => image.trim().length > 0);

    this.editingTripId = item.id;
    this.editImages = [...initialImages];
    this.editForm = {
      name: item.name,
      price: item.price,
      couplesPrice: item.couplesPrice ?? null,
      image: initialImages[0] ?? '',
      description: item.description,
      category: item.category,
      location: item.location ?? '',
      duration: item.duration ?? '',
      tickets: item.tickets ?? null,
      dateFrom: item.dateFrom ?? '',
      dateTo: item.dateTo ?? '',
      benefitsText: (item.benefits ?? []).join('\n'),
    };
  }

  cancelTripEdit(): void {
    this.editingTripId = null;
    this.editImages = [];
    this.editForm = this.createEmptyForm();
  }

  async onEditImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    if (files.length === 0) {
      return;
    }

    const encodedFiles = await Promise.all(files.map((file) => this.readFileAsDataUrl(file)));
    const validImages = encodedFiles.filter((value) => value.length > 0);

    this.editImages = [...this.editImages, ...validImages];

    if (!this.editForm.image.trim()) {
      this.editForm.image = this.editImages[0] ?? '';
    }

    input.value = '';
  }

  removeEditImage(index: number): void {
    this.editImages = this.editImages.filter((_, imageIndex) => imageIndex !== index);

    if (index === 0 || !this.editForm.image.trim()) {
      this.editForm.image = this.editImages[0] ?? '';
    }
  }

  async saveTripEdit(original: ProductItem): Promise<void> {
    if (!this.editForm.name.trim() || !this.editForm.category.trim() || !this.editForm.description.trim()) {
      await this.presentToast('Name, category, and description are required.', 'warning');
      return;
    }

    if (!this.editForm.price || this.editForm.price <= 0) {
      await this.presentToast('Please enter a valid price.', 'warning');
      return;
    }

    const editImages = this.getEditImages();
    if (editImages.length === 0) {
      await this.presentToast('Please provide at least one image.', 'warning');
      return;
    }

    if (!this.isDateRangeValid(this.editForm.dateFrom, this.editForm.dateTo)) {
      await this.presentToast('Date From must be earlier than Date To.', 'warning');
      return;
    }

    const updatedItem: ProductItem = {
      ...original,
      name: this.editForm.name.trim(),
      price: this.editForm.price,
      couplesPrice: this.editForm.couplesPrice ?? undefined,
      images: editImages,
      description: this.editForm.description.trim(),
      category: this.editForm.category.trim(),
      location: this.editForm.location.trim() || undefined,
      duration: this.editForm.duration.trim() || undefined,
      tickets: this.editForm.tickets ?? undefined,
      ticketsLeft: this.editForm.tickets ?? undefined,
      dateFrom: this.editForm.dateFrom || undefined,
      dateTo: this.editForm.dateTo || undefined,
      benefits: this.parseBenefits(this.editForm.benefitsText),
    };

    await updateCatalogItem(updatedItem);
    this.categories = getCategorySections().map((section) => section.name);
    this.refreshCatalogTrips();
    this.cancelTripEdit();
    await this.presentToast('Trip updated successfully.', 'success');
  }

  async deleteTrip(item: ProductItem): Promise<void> {
    const confirmed = window.confirm(`Delete "${item.name}" from the catalog?`);
    if (!confirmed) {
      return;
    }

    await deleteCatalogItem(item.id);
    this.categories = getCategorySections().map((section) => section.name);
    this.refreshCatalogTrips();

    if (this.editingTripId === item.id) {
      this.cancelTripEdit();
    }

    await this.presentToast('Trip deleted successfully.', 'success');
  }

  private refreshCheckouts(): void {
    this.checkoutRecords = getCheckoutRecords();
  }

  private refreshCatalogTrips(): void {
    this.catalogTrips = getAllProducts();
  }

  private parseBenefits(value: string): string[] | undefined {
    const lines = value
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    return lines.length > 0 ? lines : undefined;
  }

  private isDateRangeValid(dateFrom: string, dateTo: string): boolean {
    if (!dateFrom || !dateTo) {
      return true;
    }

    const from = new Date(dateFrom);
    const to = new Date(dateTo);

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return false;
    }

    return from.getTime() < to.getTime();
  }

  private getTripSortTime(trip: ProductItem): number {
    const rawDate = trip.dateFrom ?? trip.dateTo;
    if (!rawDate) {
      return Number.MAX_SAFE_INTEGER;
    }

    const date = new Date(`${rawDate}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return Number.MAX_SAFE_INTEGER;
    }

    return date.getTime();
  }

  private isTripActive(trip: ProductItem): boolean {
    if (!trip.dateTo) {
      return true;
    }

    const endDate = new Date(`${trip.dateTo}T23:59:59`);
    if (Number.isNaN(endDate.getTime())) {
      return true;
    }

    return endDate.getTime() >= Date.now();
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(typeof reader.result === 'string' ? reader.result : '');
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }

  private getEditImages(): string[] {
    const primary = this.editForm.image.trim();
    const uploaded = this.editImages
      .map((image) => image.trim())
      .filter((image) => image.length > 0);

    if (!primary) {
      return uploaded;
    }

    return [primary, ...uploaded.filter((image) => image !== primary)];
  }

  private createEmptyForm(): AdminEventForm {
    return {
      name: '',
      price: null,
      couplesPrice: null,
      image: '',
      description: '',
      category: '',
      location: '',
      duration: '',
      tickets: null,
      dateFrom: '',
      dateTo: '',
      benefitsText: '',
    };
  }

  private async presentToast(message: string, color: 'success' | 'warning' | 'danger'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 1800,
      color,
      position: 'top',
    });

    await toast.present();
  }
}
