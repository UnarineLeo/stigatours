import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonItem, IonLabel, IonInput, IonText, AlertController } from '@ionic/angular/standalone';
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
  showPassword = false;
  showConfirmPassword = false;
  isSubmitting = false;

  constructor(
    private modalController: ModalController,
    private alertController: AlertController,
    private authService: AuthService,
  ) {}

  close() {
    this.modalController.dismiss();
  }

  async register() {
    // Validate required fields
    if (!this.firstName.trim() || !this.surname.trim() || !this.email.trim() || !this.password || !this.confirmPassword) {
      await this.showAlert('Missing Information', 'Please fill in all fields.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      await this.showAlert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    // Check if passwords match
    if (this.password !== this.confirmPassword) {
      await this.showAlert('Passwords Don\'t Match', 'The passwords you entered do not match. Please try again.');
      return;
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9!@#$%^&*])(?=.{6,})/;
    if (!passwordRegex.test(this.password)) {
      await this.showAlert(
        'Weak Password',
        'Password must be at least 6 characters and contain at least 1 lowercase letter, 1 uppercase letter, and 1 number or special character (!@#$%^&*).'
      );
      return;
    }

    this.isSubmitting = true;

    try {
      const displayName = `${this.firstName.trim()} ${this.surname.trim()}`.trim();

      await this.authService.userRegistration({
        displayName,
        email: this.email.trim(),
        password: this.password,
      });

      await this.modalController.dismiss({ action: 'register-success' });
    } catch {
      // Auth service presents detailed feedback; keep the modal open for corrections.
    } finally {
      this.isSubmitting = false;
    }
  }

  private async showAlert(title: string, message: string) {
    const alert = await this.alertController.create({
      header: title,
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

  isFormValid(): boolean {
    return (
      this.firstName.trim() !== '' &&
      this.surname.trim() !== '' &&
      this.email.trim() !== '' &&
      this.password !== '' &&
      this.confirmPassword !== ''
    );
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  continueWithGoogle() {
    this.modalController.dismiss({ action: 'google-register' });
  }

  openLogin() {
    this.modalController.dismiss({ action: 'open-login' });
  }
}
