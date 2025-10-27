/**
 * Prologue
 * Name: AppComponent
 * Description: Ultra-basic dating card mock for Sprint 1.
 * Programmer: Muhammad Ibrahim
 * Date: 2025-10-26
 * Revisions: v1
 */

import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div style="text-align:center; margin-top:2rem;">
      <h1>❤️ KU Dating App</h1>
      <p>Find your Jayhawk match today.</p>

      <div style="margin:auto; width:260px; border-radius:16px; overflow:hidden;
                  box-shadow:0 4px 10px rgba(0,0,0,.2); background:#fff;">
        <img src="https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=400"
             alt="profile" style="width:100%; height:300px; object-fit:cover;">
        <h2 style="margin:10px 0 0;">Meera, 22</h2>
        <p style="padding:0 1rem 1rem; color:#555;">Loves surfing 🌊 and photography 📸</p>
        <div style="display:flex; justify-content:space-around; padding:1rem;">
          <button style="background:#e0e0e0; border:none; padding:.5rem 1rem; border-radius:10px;">Pass</button>
          <button style="background:#ff4b6e; color:#fff; border:none; padding:.5rem 1rem; border-radius:10px;">Like</button>
        </div>
      </div>
    </div>
  `
})
export class AppComponent {}
