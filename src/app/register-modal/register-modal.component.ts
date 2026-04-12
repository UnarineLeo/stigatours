import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonItem, IonLabel, IonInput, IonText } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';

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

  constructor(private modalController: ModalController) {}

  close() {
    this.modalController.dismiss();
  }

  register() {
    this.modalController.dismiss({
      action: 'register',
      payload: {
        firstName: this.firstName,
        surname: this.surname,
        email: this.email,
        password: this.password,
      }
    });
  }

  continueWithGoogle() {
    this.modalController.dismiss({ action: 'google-register' });
  }

  openLogin() {
    this.modalController.dismiss({ action: 'open-login' });
  }
}
