import { Component, DestroyRef, EnvironmentInjector, OnInit, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { IonTabs, IonTabBar, IonTabButton, IonList, IonIcon, IonButtons, IonButton, IonToolbar, IonHeader, IonLabel, IonItem } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { addIcons } from 'ionicons';
import * as icons from 'ionicons/icons';
import { LoginModalComponent } from '../login-modal/login-modal.component';
import { RegisterModalComponent } from '../register-modal/register-modal.component';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [NgIf, IonTabs, IonTabBar, IonTabButton, IonIcon, IonButtons, IonList, IonButton, IonToolbar, IonHeader, IonLabel, IonItem, RouterLink, RouterLinkActive],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);
  private readonly destroyRef = inject(DestroyRef);
  isAuthenticated = false;

  constructor(
    private modalController: ModalController,
    private authService: AuthService,
  ) {
    addIcons(icons);
  }

  async ngOnInit() {
    this.isAuthenticated = await this.authService.isAuthenticated();

    this.authService.isLoggedIn$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((loggedIn) => {
        this.isAuthenticated = loggedIn;
      });
  }

  menuOpen: boolean = false;

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  async openLogin() {
    this.closeMenu();
    await this.presentLoginModal();
  }

  async openRegister() {
    this.closeMenu();
    await this.presentRegisterModal();
  }

  private async presentLoginModal() {
    const modal = await this.modalController.create({
      component: LoginModalComponent,
      cssClass: 'auth-modal',
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();

    if (!data?.action) {
      return;
    }

    if (data.action === 'open-register') {
      await this.presentRegisterModal();
      return;
    }

    if (data.action === 'forgot-password' && data.email) {
      this.authService.forgotPassword(data.email);
      return;
    }

    if (data.action === 'google-login') {
      await this.authService.googleSignIn();
      return;
    }

    if (data.action === 'login' && data.email && data.password) {
      await this.authService.loginFireAuth({
        email: data.email,
        password: data.password,
      });
    }
  }

  private async presentRegisterModal() {
    const modal = await this.modalController.create({
      component: RegisterModalComponent,
      cssClass: 'auth-modal',
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();

    if (!data?.action) {
      return;
    }

    if (data.action === 'open-login') {
      await this.presentLoginModal();
      return;
    }

    if (data.action === 'google-register') {
      await this.authService.googleSignIn();
      return;
    }

    if (data.action === 'register' && data.payload?.email && data.payload?.password) {
      const firstName = data.payload.firstName ?? '';
      const surname = data.payload.surname ?? '';
      const displayName = `${firstName} ${surname}`.trim();
      const interests: string[] = Array.isArray(data.payload.interests) ? data.payload.interests : [];

      await this.authService.userRegistration({
        displayName,
        email: data.payload.email,
        password: data.payload.password,
        currentStudyLevel: data.payload.currentStudyLevel ?? '',
        interest: interests[0] ?? '',
        courseChoices: interests,
      });
    }
  }
}
