import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-profile',
  templateUrl: 'profile.page.html',
  styleUrls: ['profile.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
})
export class ProfilePage {
  activeTab: 'personal' | 'password' | 'address' = 'personal';

  setTab(tab: 'personal' | 'password' | 'address') {
    this.activeTab = tab;
  }
}
