/*
Name: app-routn.ts
Description: set up file for angular routing
Programmer: Maren, Ibrahim, Zack
Dates: 11/23/2025
Revision: 1
Pre/Post set up routing for angular app
Errors: None
*/

// Import Angular core module decorator
import { NgModule } from '@angular/core';
// Import Angular router module and Routes type for routing configuration
import { RouterModule, Routes } from '@angular/router';

// Define routing configuration
// All routes are handled by the main app component
// Any unmatched route will redirect to the root path
const routes: Routes = [
  // All routes handled by the main app component
  { path: '**', redirectTo: '' }
];

// Angular module decorator for routing
@NgModule({
  // Import RouterModule with the defined routes
  imports: [RouterModule.forRoot(routes)],
  // Export RouterModule so other modules can use routing directives
  exports: [RouterModule]
})
// Export the routing module class
export class AppRoutingModule { }