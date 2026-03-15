import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonItem, IonLabel, IonInput, IonText } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular';

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

  constructor(private modalController: ModalController) {}

  close() {
    this.modalController.dismiss();
  }

  forgotPassword() {
    this.modalController.dismiss({ action: 'forgot-password' });
  }

  login() {
    this.modalController.dismiss({ action: 'login', email: this.email });
  }

  continueWithGoogle() {
    this.modalController.dismiss({ action: 'google-login' });
  }

  openRegister() {
    this.modalController.dismiss({ action: 'open-register' });
  }
}
