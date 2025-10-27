/**
 * Prologue
 * Name: AppComponent
 * Description: Minimal KU Dating App UI mock with Like/Pass functionality.
 * Programmer: Muhammad Ibrahim
 * Date: 2025-10-26
 * Revisions: v2 — added interactive profile switching
 */

import { Component } from '@angular/core';

/**
 * The @Component decorator defines:
 *  - selector: HTML tag name for the component (<app-root>)
 *  - template: HTML markup displayed on the page
 */
@Component({
  selector: 'app-root',
  template: `
    <!-- App Title -->
    <div style="text-align:center; margin-top:2rem;">
      <h1>❤️ KU Dating App</h1>
      <p>Find your Jayhawk match today.</p>

      <!-- Profile Card Container -->
      <div
        style="
          margin:auto;
          width:260px;
          border-radius:16px;
          overflow:hidden;
          box-shadow:0 4px 10px rgba(0,0,0,.2);
          background:#fff;
        "
      >
        <!-- Profile Image -->
        <img
          [src]="profiles[currentIndex].img"
          [alt]="profiles[currentIndex].name"
          style="width:100%; height:300px; object-fit:cover;"
        />

        <!-- Profile Info -->
        <h2 style="margin:10px 0 0;">{{ profiles[currentIndex].name }}</h2>
        <p style="padding:0 1rem 1rem; color:#555;">
          {{ profiles[currentIndex].bio }}
        </p>

        <!-- Like & Pass Buttons -->
        <div style="display:flex; justify-content:space-around; padding:1rem;">
          <button
            (click)="passProfile()"
            style="background:#e0e0e0; border:none; padding:.5rem 1rem; border-radius:10px;"
          >
            👎 Pass
          </button>

          <button
            (click)="likeProfile()"
            style="background:#ff4b6e; color:#fff; border:none; padding:.5rem 1rem; border-radius:10px;"
          >
            ❤️ Like
          </button>
        </div>
      </div>

      <!-- Summary Section -->
      <div style="margin-top:1.5rem;">
        <h3>✅ Liked Profiles:</h3>
        <p *ngIf="liked.length === 0">No likes yet.</p>
        <ul style="list-style:none; padding:0;">
          <li *ngFor="let person of liked">{{ person }}</li>
        </ul>
      </div>
    </div>
  `
})
export class AppComponent {
  /** 
   * Array of demo profiles to display on cards.
   * Each profile has a name, image, and short bio.
   */
  profiles = [
    {
      name: 'Meera, 22',
      img: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=400',
      bio: 'Loves surfing 🌊 and photography 📸'
    },
    {
      name: 'Dev, 23',
      img: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400',
      bio: 'Music producer 🎧 | Coffee enthusiast ☕'
    },
    {
      name: 'Lana, 21',
      img: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400',
      bio: 'KU senior | Dog mom 🐶 | Gym + Netflix 🏋️‍♀️'
    }
  ];

  /** Tracks the current profile index */
  currentIndex = 0;

  /** Keeps track of liked names */
  liked: string[] = [];

  /**
   * Called when user clicks the ❤️ Like button.
   * Adds current profile to liked list and moves to next.
   */
  likeProfile() {
    const person = this.profiles[this.currentIndex];
    this.liked.push(person.name);
    this.nextProfile();
  }

  /**
   * Called when user clicks 👎 Pass.
   * Just moves to next profile without adding to liked list.
   */
  passProfile() {
    this.nextProfile();
  }

  /**
   * Moves to the next profile.
   * Loops back to first profile when reaching the end.
   */
  nextProfile() {
    this.currentIndex = (this.currentIndex + 1) % this.profiles.length;
  }
}
