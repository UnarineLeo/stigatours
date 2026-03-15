import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonText } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular';
import { INTEREST_OPTIONS, STUDY_LEVELS } from '../shared/app-data';

@Component({
  selector: 'app-register-modal',
  templateUrl: './register-modal.component.html',
  styleUrls: ['./register-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonText, FormsModule]
})
export class RegisterModalComponent {
  firstName = '';
  surname = '';
  email = '';
  password = '';
  confirmPassword = '';
  currentStudyLevel = '';
  interests: string[] = [];

  studyLevels = STUDY_LEVELS;
  interestOptions = INTEREST_OPTIONS;

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
        currentStudyLevel: this.currentStudyLevel,
        interests: this.interests
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
