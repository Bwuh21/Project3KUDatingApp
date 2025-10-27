/**
 * Prologue
 * Name: AppModule (JayMatch Basic)
 * Description: Minimal Angular root module that boots AppComponent.
 * Programmer: Muhammad Ibrahim
 * Date: 2025-10-26
 * Revisions: v1
 * Preconditions: Files under src/app; dependencies installed.
 * Postconditions: App serves at http://localhost:4200
 */

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule],
  bootstrap: [AppComponent],
})
export class AppModule {}

