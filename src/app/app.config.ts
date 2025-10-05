import { Component, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// App Component
import { AppComponent } from './app.component';

// Material Modules  
import { MatSnackBarModule, MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { provideAnimations } from '@angular/platform-browser/animations';

// Routes
import { routes } from './app.routes';

// Interceptors
import { authInterceptor } from './core/interceptors/auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    {
      provide: HTTP_INTERCEPTORS,
      useValue: authInterceptor,
      multi: true
    },
    {
      provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
      useValue: {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      }
    },
    importProvidersFrom([
      HttpClientModule,
      ReactiveFormsModule,
      FormsModule,
      
      // Material Modules
      MatSnackBarModule,
      MatMenuModule,
      MatToolbarModule,
      MatSidenavModule,
      MatListModule,
      MatDividerModule
    ])
  ]
}).catch(err => console.error(err));