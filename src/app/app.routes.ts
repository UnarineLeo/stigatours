import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'contact-us',
    loadComponent: () => import('./contact-us/contact-us.page').then((m) => m.ContactUsPage)
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage)
  },
  {
    path: 'trips',
    loadComponent: () => import('./trips/trips.page').then((m) => m.TripsPage)
  },
  {
    path: 'shop',
    redirectTo: '/tabs/trips',
    pathMatch: 'full'
  },
  {
    path: 'bookings',
    loadComponent: () => import('./bookings/bookings.page').then((m) => m.BookingsPage)
  },
  {
    path: 'cart',
    redirectTo: '/tabs/bookings',
    pathMatch: 'full'
  },
  {
    path: 'orders',
    loadComponent: () => import('./orders/orders.page').then((m) => m.OrdersPage)
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.page').then((m) => m.ProfilePage)
  },
  {
    path: 'login',
    loadComponent: () => import('./login-modal/login-modal.component').then((m) => m.LoginModalComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./register-modal/register-modal.component').then((m) => m.RegisterModalComponent)
  },
  {
    path: 'legal',
    redirectTo: '/tabs/legal',
    pathMatch: 'full'
  },
  {
    path: 'item/:id',
    loadComponent: () => import('./item/item.page').then((m) => m.ItemPage)
  },
  {
    path: 'admin-login',
    redirectTo: '/tabs/admin-login',
    pathMatch: 'full'
  },
  {
    path: 'admin-portal',
    redirectTo: '/tabs/admin-portal',
    pathMatch: 'full'
  },
];
