/*
Name: app-routn.ts
Description: set up file for angular routing
Programmer: Maren, Ibrahim, Zack
Dates: 11/23/2025
Revision: 1
Pre/Post set up routing for angular app
Errors: None
*/

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  // All routes handled by the main app component
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }