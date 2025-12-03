/*
Name: app.module.ts
Description: Setup angular module code
Programmer: Maren, Ibrahim, Zack
Dates: 11/23/2025
Revision: 1
Pre/Post Conditions: handle angular module config
Errors: None
*/

// Import Angular core module decorator
import { NgModule } from '@angular/core';
// Import browser module for running Angular in the browser
import { BrowserModule } from '@angular/platform-browser';
// Import forms module for two-way data binding with ngModel
import { FormsModule } from '@angular/forms';
// Import HTTP client module for making API requests
import { HttpClientModule } from '@angular/common/http';

// Import application components
import { AppComponent } from './app.component';
import { SwipeInterfaceComponent } from './components/swipe-interface/swipe-interface.component';
import { ChatWindowComponent } from './components/chat-window/chat-window.component';
// Import routing module
import { AppRoutingModule } from './app-routing.module';

// Angular module decorator - this is the root module
@NgModule({
  // Declare all components that belong to this module
  declarations: [
    AppComponent,
    SwipeInterfaceComponent,
    ChatWindowComponent
  ],
  // Import modules needed by this module
  imports: [
    BrowserModule,      // Required for browser platform
    FormsModule,        // For form handling and ngModel
    HttpClientModule,   // For HTTP requests
    AppRoutingModule    // For routing
  ],
  // Service providers (empty for now)
  providers: [],
  // Bootstrap component - the root component that starts the app
  bootstrap: [AppComponent]
})
// Export the module class
export class AppModule { }