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
import { AuthService } from '../services/auth.service';
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
    private authService: AuthService,
  ) {}

  async login(): Promise<void> {
    if (!this.email.trim() || !this.password.trim()) {
      await this.authService.presentToast('Please enter email and password.');
      return;
    }

    await this.authService.loginFireAuth({
      email: this.email.trim(),
      password: this.password,
    });

    setAdminAuthenticated(true);
    localStorage.setItem('admin-email', this.email.trim());
    await this.router.navigate(['/admin-portal']);
  }

  async forgotPassword(): Promise<void> {
    if (!this.email.trim()) {
      await this.authService.presentToast('Enter your email address to reset your password.');
      return;
    }

    this.authService.forgotPassword(this.email.trim());
  }

  async continueWithGoogle(): Promise<void> {
    await this.authService.googleSignIn();
    setAdminAuthenticated(true);
    const currentEmail = this.authService.userEmail?.trim();
    if (currentEmail) {
      localStorage.setItem('admin-email', currentEmail);
    }
    await this.router.navigate(['/admin-portal']);
  }

  async openRegister(): Promise<void> {
    await this.router.navigate(['/register']);
  }
}
