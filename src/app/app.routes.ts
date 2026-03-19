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
    path: 'shop',
    loadComponent: () => import('./shop/shop.page').then((m) => m.ShopPage)
  },
  {
    path: 'cart',
    loadComponent: () => import('./cart/cart.page').then((m) => m.CartPage)
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
    path: 'item/:id',
    loadComponent: () => import('./item/item.page').then((m) => m.ItemPage)
  },
  {
    path: 'admin-login',
    loadComponent: () => import('./admin-login/admin-login.page').then((m) => m.AdminLoginPage)
  },
  {
    path: 'admin-portal',
    loadComponent: () => import('./admin-portal/admin-portal.page').then((m) => m.AdminPortalPage)
  },
];
