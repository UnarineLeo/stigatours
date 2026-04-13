import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/angular/standalone';
import { User, getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { FooterComponent } from '../footer/footer.component';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-checkout',
  templateUrl: 'checkout.page.html',
  styleUrls: ['checkout.page.scss'],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, RouterLink, FooterComponent],
})
export class CheckoutPage implements OnDestroy {
  isLoggedIn = false;
  isSavingDetails = false;
  private userUid = '';

  checkoutProfile = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    saIdNumber: '',
    streetAddress: '',
    cityTown: '',
    provinceAddress: '',
    postalCode: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    otherNationality: '',
  };

  private unsubscribeAuth?: () => void;

  constructor(private authService: AuthService) {
    this.unsubscribeAuth = onAuthStateChanged(getAuth(), async (user) => {
      await this.applyUserProfile(user);
    });
  }

  ngOnDestroy(): void {
    this.unsubscribeAuth?.();
  }

  onCheckoutInputChange(field: keyof typeof this.checkoutProfile, event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLSelectElement).value;

    if (field === 'nationality' && value !== 'other') {
      this.checkoutProfile = {
        ...this.checkoutProfile,
        nationality: value,
        otherNationality: '',
      };
      return;
    }

    this.checkoutProfile = {
      ...this.checkoutProfile,
      [field]: value,
    };
  }

  openDatePicker(event: Event): void {
    const input = event.target as HTMLInputElement & { showPicker?: () => void };
    if (typeof input.showPicker === 'function') {
      input.showPicker();
    }
  }

  async saveCheckoutDetails(): Promise<void> {
    if (!this.userUid) {
      await this.authService.presentToast('Please sign in to save checkout details.');
      return;
    }

    this.isSavingDetails = true;

    try {
      await setDoc(doc(this.authService.db, 'users', this.userUid), {
        firstName: this.checkoutProfile.firstName,
        lastName: this.checkoutProfile.lastName,
        email: this.checkoutProfile.email,
        phone: this.checkoutProfile.phone,
        saIdNumber: this.checkoutProfile.saIdNumber,
        streetAddress: this.checkoutProfile.streetAddress,
        cityTown: this.checkoutProfile.cityTown,
        provinceAddress: this.checkoutProfile.provinceAddress,
        postalCode: this.checkoutProfile.postalCode,
        dateOfBirth: this.checkoutProfile.dateOfBirth,
        gender: this.checkoutProfile.gender,
        nationality: this.checkoutProfile.nationality,
        otherNationality: this.checkoutProfile.otherNationality,
      }, { merge: true });

      await this.authService.presentToast('Checkout details updated.');
    } catch {
      await this.authService.presentToast('Could not save checkout details right now.');
    } finally {
      this.isSavingDetails = false;
    }
  }

  private async applyUserProfile(user: User | null): Promise<void> {
    if (!user) {
      this.isLoggedIn = false;
      this.userUid = '';
      this.checkoutProfile = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        saIdNumber: '',
        streetAddress: '',
        cityTown: '',
        provinceAddress: '',
        postalCode: '',
        dateOfBirth: '',
        gender: '',
        nationality: '',
        otherNationality: '',
      };
      return;
    }

    this.isLoggedIn = true;
    this.userUid = user.uid;

    const displayName = user.displayName?.trim() ?? '';
    const [firstName = '', ...rest] = displayName ? displayName.split(/\s+/) : [''];

    this.checkoutProfile = {
      ...this.checkoutProfile,
      firstName,
      lastName: rest.join(' '),
      email: user.email ?? '',
      phone: user.phoneNumber ?? '',
    };

    await this.loadStoredProfile(this.userUid);
  }

  private async loadStoredProfile(uid: string): Promise<void> {
    try {
      const userData = await this.authService.getUser(uid) as {
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
        saIdNumber?: string;
        streetAddress?: string;
        cityTown?: string;
        provinceAddress?: string;
        postalCode?: string;
        dateOfBirth?: string;
        gender?: string;
        nationality?: string;
        otherNationality?: string;
      };

      this.checkoutProfile = {
        ...this.checkoutProfile,
        firstName: userData.firstName ?? this.checkoutProfile.firstName,
        lastName: userData.lastName ?? this.checkoutProfile.lastName,
        email: userData.email ?? this.checkoutProfile.email,
        phone: userData.phone ?? this.checkoutProfile.phone,
        saIdNumber: userData.saIdNumber ?? this.checkoutProfile.saIdNumber,
        streetAddress: userData.streetAddress ?? this.checkoutProfile.streetAddress,
        cityTown: userData.cityTown ?? this.checkoutProfile.cityTown,
        provinceAddress: userData.provinceAddress ?? this.checkoutProfile.provinceAddress,
        postalCode: userData.postalCode ?? this.checkoutProfile.postalCode,
        dateOfBirth: userData.dateOfBirth ?? this.checkoutProfile.dateOfBirth,
        gender: userData.gender ?? this.checkoutProfile.gender,
        nationality: userData.nationality ?? this.checkoutProfile.nationality,
        otherNationality: userData.otherNationality ?? this.checkoutProfile.otherNationality,
      };
    } catch {
      // Keep auth-derived values when no stored profile exists.
    }
  }
}
