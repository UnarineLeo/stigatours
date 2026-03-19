import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonSegment,
  IonSegmentButton,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular';
import { CheckoutRecord, getCheckoutRecords, isAdminAuthenticated, setAdminAuthenticated } from '../shared/admin-storage';
import { ProductItem, getCategorySections, getNextProductId, saveAdminEvent } from '../shared/product-catalog';

type AdminTab = 'events' | 'checkouts';

interface AdminEventForm {
  name: string;
  price: number | null;
  originalPrice: number | null;
  image: string;
  description: string;
  category: string;
  location: string;
  duration: string;
  groupSize: number | null;
  ticketsLeft: number | null;
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
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonSegment,
    IonSegmentButton,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
  ],
})
export class AdminPortalPage implements OnInit {
  activeTab: AdminTab = 'events';
  checkoutRecords: CheckoutRecord[] = [];
  categories: string[] = [];
  imagePreview = '';

  form: AdminEventForm = this.createEmptyForm();

  constructor(
    private router: Router,
    private toastController: ToastController,
  ) {}

  ngOnInit(): void {
    this.guardAccess();
    this.categories = getCategorySections().map((section) => section.name);
    this.refreshCheckouts();
  }

  ionViewWillEnter(): void {
    this.guardAccess();
    this.refreshCheckouts();
  }

  async addEvent(): Promise<void> {
    if (!this.form.name.trim() || !this.form.description.trim() || !this.form.category.trim()) {
      await this.presentToast('Name, description, and category are required.', 'warning');
      return;
    }

    if (!this.form.image.trim()) {
      await this.presentToast('Please upload an image for the event.', 'warning');
      return;
    }

    if (!this.form.price || this.form.price <= 0) {
      await this.presentToast('Please enter a valid event price.', 'warning');
      return;
    }

    const eventItem: ProductItem = {
      id: getNextProductId(),
      name: this.form.name.trim(),
      price: this.form.price,
      originalPrice: this.form.originalPrice ?? undefined,
      image: this.form.image,
      description: this.form.description.trim(),
      category: this.form.category.trim(),
      location: this.form.location.trim() || undefined,
      duration: this.form.duration.trim() || undefined,
      groupSize: this.form.groupSize ?? undefined,
      ticketsLeft: this.form.ticketsLeft ?? undefined,
      dateFrom: this.form.dateFrom || undefined,
      dateTo: this.form.dateTo || undefined,
      benefits: this.parseBenefits(this.form.benefitsText),
    };

    saveAdminEvent(eventItem);

    if (!this.categories.includes(eventItem.category)) {
      this.categories = [...this.categories, eventItem.category];
    }

    this.form = this.createEmptyForm();
    this.imagePreview = '';
    await this.presentToast('Event added successfully.', 'success');
  }

  async logout(): Promise<void> {
    setAdminAuthenticated(false);
    await this.router.navigate(['/admin-login']);
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      this.form.image = result;
      this.imagePreview = result;
    };

    reader.readAsDataURL(file);
  }

  formatRand(amount: number): string {
    return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  private refreshCheckouts(): void {
    this.checkoutRecords = getCheckoutRecords();
  }

  private parseBenefits(value: string): string[] | undefined {
    const lines = value
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    return lines.length > 0 ? lines : undefined;
  }

  private createEmptyForm(): AdminEventForm {
    return {
      name: '',
      price: null,
      originalPrice: null,
      image: '',
      description: '',
      category: '',
      location: '',
      duration: '',
      groupSize: null,
      ticketsLeft: null,
      dateFrom: '',
      dateTo: '',
      benefitsText: '',
    };
  }

  private guardAccess(): void {
    if (!isAdminAuthenticated()) {
      this.router.navigate(['/admin-login']);
    }
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
