import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { initializeTripCatalog } from './app/shared/product-catalog';
import { environment } from './environments/environment';

async function bootstrapApp(): Promise<void> {
  await initializeTripCatalog();

  await bootstrapApplication(AppComponent, {
    providers: [
      { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
      importProvidersFrom(
        AngularFireModule.initializeApp(environment.firebaseConfig),
        AngularFireAuthModule,
        AngularFirestoreModule,
      ),
      provideIonicAngular(),
      provideRouter(routes, withPreloading(PreloadAllModules)),
    ],
  });
}

void bootstrapApp();
