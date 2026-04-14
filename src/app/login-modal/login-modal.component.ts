import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonItem, IonLabel, IonInput, IonText, AlertController } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';

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

  constructor(private modalController: ModalController, private alertController: AlertController) {}

  close() {
    this.modalController.dismiss();
  }

  forgotPassword() {
    this.modalController.dismiss({
      action: 'forgot-password',
      email: this.email?.trim() ?? '',
    });
  }

  login() {
    // Validate required fields
    if (!this.email.trim() || !this.password) {
      this.showAlert('Missing Information', 'Please enter both email and password.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.showAlert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    // All validations passed, proceed with login
    this.modalController.dismiss({
      action: 'login',
      email: this.email,
      password: this.password,
    });
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
