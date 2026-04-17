import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonItem, IonLabel, IonInput, IonText } from '@ionic/angular/standalone';
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
  isSubmitting = false;

  constructor(
    private modalController: ModalController,
    private authService: AuthService,
  ) {}

  close() {
    this.modalController.dismiss();
  }

  get isLoginDisabled(): boolean {
    return this.isSubmitting || !this.email.trim() || !this.password;
  }

  forgotPassword() {
    this.modalController.dismiss({
      action: 'forgot-password',
      email: this.email?.trim() ?? '',
    });
  }

  async login() {
    if (this.isSubmitting) {
      return;
    }

    const email = this.email.trim();
    if (!email || !this.password) {
      await this.authService.presentToast('Please enter your email and password.');
      return;
    }

    try {
      this.isSubmitting = true;
      await this.authService.loginFireAuth({
        email,
        password: this.password,
      });

      await this.modalController.dismiss({ action: 'logged-in' });
    } catch (error) {
      console.error('Login failed in modal:', error);
    } finally {
      this.isSubmitting = false;
    }
  }

  continueWithGoogle() {
    this.modalController.dismiss({ action: 'google-login' });
  }

  openRegister() {
    this.modalController.dismiss({ action: 'open-register' });
  }
}
