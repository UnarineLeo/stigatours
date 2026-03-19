import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonText,
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular';
import { setAdminAuthenticated } from '../shared/admin-storage';

@Component({
  selector: 'app-admin-login',
  templateUrl: './admin-login.page.html',
  styleUrls: ['./admin-login.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonText,
    FormsModule,
    RouterLink,
  ],
})
export class AdminLoginPage {
  email = '';
  password = '';

  constructor(
    private router: Router,
    private toastController: ToastController,
  ) {}

  async login(): Promise<void> {
    if (!this.email.trim() || !this.password.trim()) {
      await this.presentToast('Please enter email and password.', 'warning');
      return;
    }

    setAdminAuthenticated(true);
    localStorage.setItem('admin-email', this.email.trim());
    await this.presentToast('Admin login successful.', 'success');
    await this.router.navigate(['/admin-portal']);
  }

  async forgotPassword(): Promise<void> {
    await this.presentToast('Password reset is not enabled in this demo.', 'warning');
  }

  async continueWithGoogle(): Promise<void> {
    await this.presentToast('Google sign-in is not enabled in this demo.', 'warning');
  }

  async openRegister(): Promise<void> {
    await this.presentToast('Registration is not enabled in the admin portal.', 'warning');
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
