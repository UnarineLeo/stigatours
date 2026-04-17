import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonItem, IonLabel, IonInput, IonText } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register-modal',
  templateUrl: './register-modal.component.html',
  styleUrls: ['./register-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonItem, IonLabel, IonInput, IonText, FormsModule]
})
export class RegisterModalComponent {
  firstName = '';
  surname = '';
  email = '';
  password = '';
  confirmPassword = '';
  isSubmitting = false;
  readonly passwordPolicyText = 'Use at least 8 characters, including an uppercase letter, a lowercase letter, a number, and a special character.';

  constructor(
    private modalController: ModalController,
    private authService: AuthService,
  ) {}

  close() {
    this.modalController.dismiss();
  }

  get isPasswordPolicyMet(): boolean {
    const password = this.password ?? '';
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);
  }

  get isRegisterDisabled(): boolean {
    const hasRequiredFields =
      !!this.firstName.trim() &&
      !!this.surname.trim() &&
      !!this.email.trim() &&
      !!this.password &&
      !!this.confirmPassword;

    const passwordsMatch = this.password === this.confirmPassword;

    return this.isSubmitting || !hasRequiredFields || !passwordsMatch || !this.isPasswordPolicyMet;
  }

  async register() {
    if (this.isSubmitting) {
      return;
    }

    const email = this.email.trim();
    const firstName = this.firstName.trim();
    const surname = this.surname.trim();

    console.log('Attempting registration with:', { email, firstName, surname });

    if (!email || !this.password || !firstName || !surname) {
      await this.authService.presentToast('Please complete all required fields.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      await this.authService.presentToast('Passwords do not match.');
      return;
    }

    if (!this.isPasswordPolicyMet) {
      await this.authService.presentToast(this.passwordPolicyText);
      return;
    }

    const displayName = `${firstName} ${surname}`.trim();

    try {
      this.isSubmitting = true;
      console.log('Registering user with email:', email);
      await this.authService.userRegistration({
        displayName,
        email,
        password: this.password,
      });

      await this.modalController.dismiss({ action: 'registered' });
    } catch (error) {
      console.error('Registration failed in modal:', error);
    } finally {
      this.isSubmitting = false;
    }
  }

  continueWithGoogle() {
    this.modalController.dismiss({ action: 'google-register' });
  }

  openLogin() {
    this.modalController.dismiss({ action: 'open-login' });
  }
}
