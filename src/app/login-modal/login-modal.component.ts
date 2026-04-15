import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonItem, IonLabel, IonInput, IonText, AlertController } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login-modal',
  templateUrl: './login-modal.component.html',
  styleUrls: ['./login-modal.component.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonItem, IonLabel, IonInput, IonText, FormsModule]
})
export class LoginModalComponent {
  email = '';
  password = '';
  showPassword = false;
  isSubmitting = false;

  constructor(
    private modalController: ModalController,
    private alertController: AlertController,
    private authService: AuthService,
  ) {}

  close() {
    this.modalController.dismiss();
  }

  forgotPassword() {
    this.modalController.dismiss({
      action: 'forgot-password',
      email: this.email?.trim() ?? '',
    });
  }

  async login() {
    // Validate required fields
    if (!this.email.trim() || !this.password) {
      await this.showAlert('Missing Information', 'Please enter both email and password.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      await this.showAlert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    this.isSubmitting = true;

    try {
      await this.authService.loginFireAuth({
        email: this.email.trim(),
        password: this.password,
      });

      const isAuthenticated = await this.authService.isAuthenticated();
      if (!isAuthenticated) {
        return;
      }

      await this.modalController.dismiss({ action: 'login-success' });
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
    return this.email.trim() !== '' && this.password !== '';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  continueWithGoogle() {
    this.modalController.dismiss({ action: 'google-login' });
  }

  openRegister() {
    this.modalController.dismiss({ action: 'open-register' });
  }
}
