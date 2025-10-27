/**
 * Prologue
 * Name: AppModule (JayMatch Basic)
 * Description: The root module that bootstraps the KU Dating App frontend.
 * Programmer: Muhammad Ibrahim
 * Date: 2025-10-26
 * Revisions: v2 — added Like/Pass interactivity for Sprint 1
 * Preconditions: Angular CLI and node_modules installed
 * Postconditions: Runs app at localhost:4200
 */

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';

/**
 * The @NgModule decorator tells Angular how to assemble the app.
 * - declarations: components that belong to this module
 * - imports: external Angular modules we use
 * - bootstrap: which component starts first (AppComponent)
 */
@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule],
  bootstrap: [AppComponent]
})
export class AppModule {}
