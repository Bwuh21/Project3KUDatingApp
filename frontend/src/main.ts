// Import Angular platform browser dynamic module for bootstrapping the application
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
// Import the main app module
import { AppModule } from './app/app.module';

// Bootstrap the Angular application using the AppModule
// This starts the Angular application when the page loads
platformBrowserDynamic().bootstrapModule(AppModule)
  // Handle any errors during bootstrap
  .catch(err => console.error(err));
