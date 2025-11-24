/*
Name: app.module.ts
Description: Setup angular module code
Programmer: Maren, Ibrahim, Zack
Dates: 11/23/2025
Revision: 1
Pre/Post Conditions: handle angular module config
Errors: None
*/

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { SwipeInterfaceComponent } from './components/swipe-interface/swipe-interface.component';
import { BackendIntegrationComponent } from './components/backend-integration/backend-integration.component';
import { ChatWindowComponent } from './components/chat-window/chat-window.component';
import { AppRoutingModule } from './app-routing.module';

@NgModule({
  declarations: [
    AppComponent,
    SwipeInterfaceComponent,
    BackendIntegrationComponent,
    ChatWindowComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }