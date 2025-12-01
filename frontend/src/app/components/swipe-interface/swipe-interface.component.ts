/*
Name: swipe-interface.component.ts
Description: HTML and Javascript for swiping and creating matches
Programmer: Maren, Ibrahim, Zack
Dates: 11/23/2025
Revision: 2 (fix frontend bugs)
Pre/Post Conditions: Enable clean html for transitions for swiping left and right on profiles to indicate matches
Errors: None
*/

import { Component, OnInit } from '@angular/core';
import { ProfileService, ProfileDto } from '../../services/profile.service';
import { MatchService } from '../../services/match.service';
import { PreferencesService, PreferenceOptions, PreferencesDto, PreferencesUpsertDto } from '../../services/preferences.service';


//define an interface for storing profile data
interface Profile {
  id: number;
  name: string;
  age: number;
  major: string;
  year: string;
  bio: string;
  interests: string[];
  image: string;
  gender: string;
}


//define component with inlined html
//component displays the swiping cards and defines elegant 
//html assisted by gemini ai
@Component({
  selector: 'app-swipe-interface',
  template: `
    <div class="swipe-container">
      <div class="swipe-header">
        <h2>🔥 Discover KU Students</h2>
        <p>Swipe right to like, left to pass</p>
      </div>

      <div class="swipe-content">
        <div class="cards-container" *ngIf="currentProfile">
          <div class="profile-card" 
               [style.transform]="cardTransform"
               [style.opacity]="cardOpacity"
               (touchstart)="onTouchStart($event)"
               (touchmove)="onTouchMove($event)"
               (touchend)="onTouchEnd($event)"
               (mousedown)="onMouseDown($event)"
               (mousemove)="onMouseMove($event)"
               (mouseup)="onMouseUp($event)"
               (mouseleave)="onMouseUp($event)">
            
            <div class="profile-image">
              <img [src]="currentProfile?.image" [alt]="currentProfile?.name">
              <div class="profile-overlay">
                <div class="profile-info">
                  <h3>{{currentProfile?.name}}, {{currentProfile?.age}}</h3>
                  <p class="major-year">
                    {{currentProfile?.major}} • {{currentProfile?.year}}
                    <span *ngIf="currentProfile?.gender"> • {{currentProfile?.gender}}</span>
                  </p>
                </div>
              </div>
            </div>

          <div class="profile-details">
              <div class="bio">
                <p>{{currentProfile?.bio}}</p>
              </div>
              
              <div class="interests">
                <h4>Interests</h4>
                <div class="interest-tags">
                  <span class="tag" *ngFor="let interest of currentProfile?.interests">
                    {{interest}}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Swipe Indicators -->
          <div class="swipe-indicators" *ngIf="isDragging">
            <div class="indicator pass-indicator" [class.active]="swipeDirection === 'left'">
              PASS
            </div>
            <div class="indicator like-indicator" [class.active]="swipeDirection === 'right'">
              LIKE
            </div>
          </div>
        </div>

        <!-- Loading -->
        <div class="no-profiles" *ngIf="isLoading">
          <div class="no-profiles-content">
            <h3>🔄 Loading profiles...</h3>
          </div>
        </div>

        <!-- No More Profiles -->
        <div class="no-profiles" *ngIf="!currentProfile && !isLoading">
          <div class="no-profiles-content">
            <h3>🎉 That's all for now!</h3>
            <p>Check back later for more KU students</p>
            <button class="btn btn-primary" (click)="loadQueue()">
              Reload
            </button>
          </div>
        </div>

        <!-- Stats -->
        <div class="stats">
          <div class="stat">
            <span class="stat-number">{{likedProfiles.length}}</span>
            <span class="stat-label">Liked</span>
          </div>
          <div class="stat">
            <span class="stat-number">{{passedProfiles.length}}</span>
            <span class="stat-label">Passed</span>
          </div>
          <div class="stat">
            <span class="stat-number">{{profiles.length - currentIndex}}</span>
            <span class="stat-label">Remaining</span>
          </div>
        </div>

        <!-- Filters -->
        <div class="filters" *ngIf="preferenceOptions">
          <div class="filters-header">
            <span>Filters</span>
          </div>

          <div class="filters-grid">
            <div class="filter-section">
              <div class="filter-label">Gender</div>
              <div class="filter-chips">
                <button
                  *ngFor="let g of preferenceOptions.gender_options"
                  type="button"
                  class="chip-filter"
                  [class.active]="selectedGenders.includes(g)"
                  (click)="toggleSelection(selectedGenders, g)">
                  {{ g }}
                </button>
              </div>
            </div>

            <div class="filter-section">
              <div class="filter-label">Age</div>
              <div class="age-inputs">
                <input type="number" [(ngModel)]="minAge" placeholder="Min" min="16" max="120">
                <span>–</span>
                <input type="number" [(ngModel)]="maxAge" placeholder="Max" min="16" max="120">
              </div>
            </div>

            <div class="filter-section">
              <div class="filter-label">Year</div>
              <div class="filter-chips">
                <button
                  *ngFor="let y of preferenceOptions.year_options"
                  type="button"
                  class="chip-filter"
                  [class.active]="selectedYears.includes(y)"
                  (click)="toggleSelection(selectedYears, y)">
                  {{ y }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Match overlay animation -->
      <div class="match-overlay" *ngIf="showMatchOverlay">
        <div class="match-card">
          <h3>✨ It's a Match!</h3>
          <p>You and {{ lastMatchedProfile?.name || 'this user' }} like each other.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .swipe-container {
      max-width: 480px;
      margin: 0 auto;
      padding: 1.5rem;
    }

    .swipe-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .swipe-header h2 {
      color: white;
      font-size: 1.8rem;
      margin: 0 0 0.5rem 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .swipe-header p {
      color: rgba(255, 255, 255, 0.8);
      margin: 0;
    }

    .swipe-content {
      position: relative;
      max-width: 480px;
      margin: 0 auto;
    }

    .cards-container {
      position: relative;
      height: 600px;
      margin-bottom: 2rem;
    }

    .profile-card {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: white;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      overflow: hidden;
      cursor: grab;
      transition: transform 0.3s ease, opacity 0.3s ease;
    }

    .profile-card:active {
      cursor: grabbing;
    }

    .profile-image {
      position: relative;
      height: 400px;
      overflow: hidden;
    }

    .profile-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .profile-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
      padding: 2rem 1.5rem 1.5rem;
    }

    .profile-info h3 {
      color: white;
      font-size: 1.5rem;
      margin: 0 0 0.5rem 0;
      font-weight: 700;
    }

    .major-year {
      color: rgba(255, 255, 255, 0.9);
      margin: 0;
      font-size: 1rem;
    }

    .profile-details {
      padding: 1.5rem;
    }

    .bio p {
      color: #333;
      line-height: 1.5;
      margin: 0 0 1.5rem 0;
    }

    .interests h4 {
      color: var(--primary);
      margin: 0 0 1rem 0;
      font-size: 1rem;
    }

    .interest-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .tag {
      background: #f3f4f6;
      color: #374151;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .action-buttons {
      display: flex;
      justify-content: center;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .action-btn {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }

    .pass-btn {
      background: white;
      color: #ef4444;
    }

    .pass-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(239, 68, 68, 0.3);
    }

    .like-btn {
      background: white;
      color: #ef4444;
    }

    .like-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(239, 68, 68, 0.3);
    }

    .swipe-indicators {
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      transform: translateY(-50%);
      display: flex;
      justify-content: space-between;
      padding: 0 2rem;
      pointer-events: none;
    }

    .indicator {
      font-size: 1.5rem;
      font-weight: 700;
      padding: 1rem 2rem;
      border-radius: 10px;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .pass-indicator {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
      border: 2px solid #ef4444;
    }

    .like-indicator {
      color: #10b981;
      background: rgba(16, 185, 129, 0.1);
      border: 2px solid #10b981;
    }

    .indicator.active {
      opacity: 1;
    }

    .no-profiles {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 400px;
    }

    .no-profiles-content {
      text-align: center;
      background: white;
      padding: 3rem;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    .no-profiles-content h3 {
      color: var(--primary);
      font-size: 1.5rem;
      margin: 0 0 1rem 0;
    }

    .no-profiles-content p {
      color: #666;
      margin: 0 0 2rem 0;
    }

    .stats {
      display: flex;
      justify-content: space-around;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .stat {
      text-align: center;
    }

    .stat-number {
      display: block;
      color: white;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .stat-label {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.9rem;
    }

    .filters {
      background: rgba(248, 250, 252, 0.96);
      border-radius: 16px;
      padding: 1rem;
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.22);
      border: 1px solid rgba(148, 163, 184, 0.4);
    }

    .filters-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
      font-weight: 600;
      color: #111827;
    }

    .filters-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.75rem;
      font-size: 0.85rem;
    }

    .filter-section {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .filter-label {
      font-weight: 600;
      color: #374151;
    }

    .filter-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }

    .chip-filter {
      border-radius: 999px;
      border: 1px solid #d1d5db;
      padding: 4px 10px;
      background: #f9fafb;
      font-size: 0.8rem;
      cursor: pointer;
      color: #374151;
    }

    .chip-filter.active {
      background: var(--primary);
      border-color: var(--primary);
      color: white;
    }

    .age-inputs {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .age-inputs input {
      width: 70px;
      padding: 4px 6px;
      border-radius: 8px;
      border: 1px solid #d1d5db;
      font-size: 0.8rem;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--primary), #1E66D0);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(0, 81, 186, 0.3);
    }

    .match-overlay {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0,0,0,0.35);
      z-index: 40;
      animation: fadeIn 0.2s ease-out;
    }

    .match-card {
      background: white;
      padding: 1.75rem 2.25rem;
      border-radius: 20px;
      box-shadow: 0 18px 45px rgba(0,0,0,0.25);
      text-align: center;
      transform: scale(0.9);
      animation: popIn 0.2s ease-out forwards;
    }

    .match-card h3 {
      margin: 0 0 0.5rem 0;
      color: var(--primary);
      font-size: 1.6rem;
    }

    .match-card p {
      margin: 0;
      color: #4b5563;
      font-size: 1rem;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes popIn {
      from { transform: scale(0.8); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `]
})

//define interface for swiping profiles
export class SwipeInterfaceComponent implements OnInit {
  profiles: Profile[] = [];
  currentIndex = 0;
  currentProfile: Profile | null = null;
  likedProfiles: Profile[] = [];
  passedProfiles: Profile[] = [];
  isLoading = false;

  // Filter state
  preferenceOptions: PreferenceOptions | null = null;
  selectedGenders: string[] = [];
  minAge: number | null = null;
  maxAge: number | null = null;
  selectedYears: string[] = [];
  filtersSaving = false;

  // Touch/Mouse handling
  isDragging = false;
  startX = 0;
  startY = 0;
  currentX = 0;
  currentY = 0;
  cardTransform = '';
  cardOpacity = 1;
  swipeDirection = '';
  showMatchOverlay = false;
  lastMatchedProfile: Profile | null = null;

  constructor(
    private profileService: ProfileService,
    private matchService: MatchService,
    private prefs: PreferencesService
  ) { }

  //on init load queue
  ngOnInit() {
    this.loadQueue();
    this.loadFilters();
  }


  //load queues using backend
  loadQueue() {
    const userId = Number(localStorage.getItem('user_id') || 0);
    if (!userId) {
      console.error('No user_id found');
      return;
    }

    this.isLoading = true;
    this.profileService.getQueue(userId).subscribe({
      next: (backendProfiles: ProfileDto[]) => {
        this.profiles = backendProfiles.map(p => this.convertToProfile(p));
        this.currentIndex = 0;
        this.currentProfile = this.profiles[0] || null;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Failed to load queue:', err);
        this.isLoading = false;
      }
    });
  }

  // Load preference options and current user preferences
  private loadFilters() {
    const userId = Number(localStorage.getItem('user_id') || 0);
    if (!userId) {
      return;
    }
    this.prefs.getOptions().subscribe({
      next: (opts) => {
        this.preferenceOptions = opts;
      },
      error: (err) => {
        console.error('Failed to load preference options', err);
      }
    });
    this.prefs.getPreferences(userId).subscribe({
      next: (p: PreferencesDto) => {
        this.selectedGenders = p.gender_preference || [];
        this.minAge = p.min_age ?? null;
        this.maxAge = p.max_age ?? null;
        this.selectedYears = p.year_preference || [];
      },
      error: (err) => {
        console.error('Failed to load preferences', err);
      }
    });
  }

  applyFilters() {
    const userId = Number(localStorage.getItem('user_id') || 0);
    if (!userId) {
      return;
    }
    const payload: PreferencesUpsertDto = {
      gender_preference: this.selectedGenders.length ? this.selectedGenders : null,
      min_age: this.minAge ?? null,
      max_age: this.maxAge ?? null,
      year_preference: this.selectedYears.length ? this.selectedYears : null
    };
    this.filtersSaving = true;
    this.prefs.savePreferences(userId, payload).subscribe({
      next: () => {
        this.filtersSaving = false;
        this.loadQueue();
      },
      error: (err) => {
        console.error('Failed to save preferences', err);
        this.filtersSaving = false;
      }
    });
  }

  //restructure serialized profile data
  convertToProfile(dto: ProfileDto): Profile {
    return {
      id: dto.user_id,
      name: dto.name || 'Anonymous',
      age: dto.age || 0,
      major: dto.major || 'Undeclared',
      year: dto.year || 'Unknown',
      bio: dto.bio || 'No bio provided',
      interests: dto.interests || [],
      image: dto.profile_picture
        ? this.profileService.profilePictureUrl(dto.user_id)
        : '',
      gender: dto.gender || 'Other'
    };
  }

  toggleSelection(list: string[], value: string) {
    const idx = list.indexOf(value);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(value);
    }
    // Immediately apply filters when a chip is toggled
    this.applyFilters();
  }

  //on start init start x and y
  onTouchStart(event: TouchEvent) {
    this.startX = event.touches[0].clientX;
    this.startY = event.touches[0].clientY;
    this.isDragging = true;
  }

  //drag on move
  onTouchMove(event: TouchEvent) {
    if (!this.isDragging) return;

    this.currentX = event.touches[0].clientX;
    this.currentY = event.touches[0].clientY;
    this.updateCardTransform();
  }


  //unselect when leaving swiping 
  onTouchEnd(event: TouchEvent) {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.handleSwipeEnd();
  }

  //enabel swiping with mouse down
  onMouseDown(event: MouseEvent) {
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.isDragging = true;
    event.preventDefault();
  }


  //swipe with mouse move
  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;

    this.currentX = event.clientX;
    this.currentY = event.clientY;
    this.updateCardTransform();
  }

  //mouse up
  onMouseUp(event: MouseEvent) {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.handleSwipeEnd();
  }

  //move card
  updateCardTransform() {
    const deltaX = this.currentX - this.startX;
    const deltaY = this.currentY - this.startY;
    const rotation = deltaX * 0.1;

    this.cardTransform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotation}deg)`;

    // Update swipe direction
    if (Math.abs(deltaX) > 50) {
      this.swipeDirection = deltaX > 0 ? 'right' : 'left';
    } else {
      this.swipeDirection = '';
    }

    // Update opacity based on distance
    const distance = Math.abs(deltaX);
    this.cardOpacity = Math.max(0.3, 1 - distance / 300);
  }

  //leave swiping
  handleSwipeEnd() {
    const deltaX = this.currentX - this.startX;

    if (Math.abs(deltaX) > 100) {
      if (deltaX > 0) {
        this.swipeRight();
      } else {
        this.swipeLeft();
      }
    } else {
      // Reset card position
      this.cardTransform = '';
      this.cardOpacity = 1;
      this.swipeDirection = '';
    }
  }

  //swipe right
  swipeRight() {
    if (!this.currentProfile) return;

    this.likedProfiles.push(this.currentProfile);

    const meId = Number(localStorage.getItem('user_id') || 0);
    const matchedProfile = this.currentProfile;
    const otherId = matchedProfile.id;

    const goNext = () => this.nextProfile();

    //create a match in the backend so users can message each other
    if (meId && otherId) {
      this.matchService.createMatch(meId, otherId).subscribe({
        next: (res) => {
          if (res?.success && res.message !== 'Match already exists') {
            this.triggerMatchAnimation(matchedProfile);
          }
          goNext();
        },
        error: (err) => {
          console.error('Failed to create match', err);
          goNext();
        }
      });
    } else {
      goNext();
    }
  }

  //swipe left
  swipeLeft() {
    if (!this.currentProfile) return;

    this.passedProfiles.push(this.currentProfile);
    this.nextProfile();
  }

  //go to next profile
  nextProfile() {
    this.currentIndex++;
    this.currentProfile = this.profiles[this.currentIndex] || null;
    this.cardTransform = '';
    this.cardOpacity = 1;
    this.swipeDirection = '';
  }

  private triggerMatchAnimation(profile: Profile) {
    this.lastMatchedProfile = profile;
    this.showMatchOverlay = true;
    setTimeout(() => {
      this.showMatchOverlay = false;
    }, 1400);
  }
}