/*
Name: app.component.ts
Description: main angular file, incorporate all components and setup main html + css
Programmer: Maren, Ibrahim, Zack
Dates: 11/23/2025
Revision: 1
Pre/Post Should start all of the component services, should create html and should not have any console errors
Errors: None
*/

// Import Angular component decorator
import { Component } from '@angular/core';
// Import profile service and data transfer objects
import { ProfileService, ProfileUpsertDto } from './services/profile.service';
// Import authentication service
import { AuthService } from './services/auth.service';
// Import match service and data transfer objects
import { MatchService, MatchDto } from './services/match.service';
// Import RxJS forkJoin for parallel observables
import { forkJoin } from 'rxjs';

// Generate all start page HTML
// HTML partially assisted by gemini.ai
// Main app component - root component that contains all views
@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <nav class="navbar" *ngIf="isAuthenticated">
        <div class="nav-brand">
          <h1>❤️ JayMatch</h1>
          <span class="ku-badge">KU Verified</span>
        </div>
        <div class="nav-menu">
          <button class="nav-btn" [class.active]="currentView === 'swipe'" (click)="setView('swipe')">
            🔥 Discover
          </button>
          <button class="nav-btn" [class.active]="currentView === 'matches'" (click)="setView('matches')">
            💑 Matches
          </button>
          <button class="nav-btn" [class.active]="currentView === 'chat'" (click)="setView('chat')">
            💬 Chat
          </button>
          <button class="nav-btn" [class.active]="currentView === 'profile'" (click)="setView('profile')">
            👤 Profile
          </button>
          <button class="btn btn-outline" (click)="logout()">Logout</button>
        </div>
      </nav>

      <main class="main-content" [class.no-nav]="!isAuthenticated">
        <div *ngIf="!isAuthenticated" class="login-container">
          <div class="login-card">
            <div class="login-header">
              <h1>❤️ JayMatch</h1>
              <p class="subtitle">KU Dating App</p>
              <span class="ku-badge">Rock Chalk! 🐦</span>
            </div>
            
            <ng-container *ngIf="!showRegister; else signupTpl">
              <form class="login-form" (ngSubmit)="login()">
                <div class="form-group">
                  <label for="email">Email</label>
                  <input 
                    type="text" 
                    id="email" 
                    [(ngModel)]="loginForm.email" 
                    name="email"
                    placeholder="Your email"
                    required
                  >
                </div>
                
                <div class="form-group">
                  <label for="password">Password</label>
                  <input 
                    type="password" 
                    id="password" 
                    [(ngModel)]="loginForm.password" 
                    name="password"
                    placeholder="Enter your password"
                    required
                  >
                </div>
                
                <button type="submit" class="btn btn-primary btn-full">
                  Login
                </button>
              </form>
              
              <p class="login-footer">
                Don't have an account? <a href="#" (click)="showRegister = true; $event.preventDefault()">Sign up</a>
              </p>
            </ng-container>

            <ng-template #signupTpl>
              <form class="login-form" (ngSubmit)="register()">
                <div class="form-group">
                  <label for="rname">Name</label>
                  <input 
                    id="rname"
                    [(ngModel)]="registerForm.name"
                    name="rname"
                    placeholder="Your full name"
                    required
                  >
                </div>

                <div class="form-group">
                  <label for="remail">KU Email</label>
                  <input 
                    type="email" 
                    id="remail" 
                    [(ngModel)]="registerForm.email" 
                    name="remail"
                    placeholder="your.email@ku.edu"
                    required
                  >
                </div>
                
                <div class="form-group">
                  <label for="rpassword">Password</label>
                  <input 
                    type="password" 
                    id="rpassword" 
                    [(ngModel)]="registerForm.password" 
                    name="rpassword"
                    placeholder="Create a password"
                    required
                  >
                </div>

                <div class="form-group">
                  <label for="rpassword2">Confirm Password</label>
                  <input 
                    type="password" 
                    id="rpassword2" 
                    [(ngModel)]="registerFormConfirm" 
                    name="rpassword2"
                    placeholder="Repeat your password"
                    required
                  >
                </div>

                <button type="submit" class="btn btn-primary btn-full">
                  Create account
                </button>
              </form>
              <p class="login-footer">
                Already have an account? <a href="#" (click)="showRegister = false; $event.preventDefault()">Back to login</a>
              </p>
            </ng-template>
          </div>
        </div>

        <div *ngIf="isAuthenticated">
          <div *ngIf="currentView === 'swipe'" class="swipe-container">
            <app-swipe-interface></app-swipe-interface>
          </div>

          <div *ngIf="currentView === 'matches'" class="matches-container" style="padding: 2rem;">
            <div class="coming-soon-content" style="text-align:left; max-width: 900px; margin: 0 auto;">
              <h2>Your Matches</h2>
              <p *ngIf="matchesLoading">Loading matches...</p>
              <p *ngIf="matchesError" style="color:#b91c1c;">{{ matchesError }}</p>
              <div *ngIf="!matchesLoading && !matchesError && !matches.length">
                <p>You don't have any matches yet. Keep swiping on Discover!</p>
              </div>
              <div *ngIf="!matchesLoading && !matchesError && matches.length">
                <div *ngFor="let m of matches" class="match-row" style="display:flex; align-items:center; gap:1rem; padding:0.75rem 0; border-bottom:1px solid #e5e7eb;">
                  <div style="width:56px; height:56px; border-radius:50%; overflow:hidden; background:#e5e7eb; flex-shrink:0;">
                    <img *ngIf="m.photoUrl" [src]="m.photoUrl" alt="Profile photo" style="width:100%; height:100%; object-fit:cover;">
                  </div>
                  <div style="flex:1; display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap;">
                    <div>
                      <div style="font-weight:600; color:#111827;">
                        {{ m.name }}
                      </div>
                      <div style="color:#6b7280; font-size:0.9rem;">
                        <span *ngIf="m.year">{{ m.year }}</span>
                        <span *ngIf="m.year && m.major"> • </span>
                        <span *ngIf="m.major">{{ m.major }}</span>
                        <span *ngIf=\"(m.year || m.major) && m.gender\"> • </span>
                        <span *ngIf=\"m.gender\">{{ m.gender }}</span>
                      </div>
                    </div>
                    <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                      <button type="button" class="btn btn-outline" (click)="openChatWith(m.matchedUserId)">Message</button>
                      <button type="button" class="btn btn-outline" (click)="openChatProfileWith(m.matchedUserId)">View Profile</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="currentView === 'chat'" class="chat-container" style="padding: 2rem;">
            <app-chat-window></app-chat-window>
          </div>
          
          <div *ngIf="currentView === 'profile'" class="profile-container">
            <div *ngIf="!showProfileForm" class="profile-cta">
              <div class="coming-soon-content">
                <h2>👤 Profile</h2>
                <p>Create your profile to start matching</p>
                <button class="btn btn-primary" (click)="openProfileForm()">{{ hasProfile ? 'Edit Profile' : 'Create Profile' }}</button>
              </div>
            </div>

            <div *ngIf="showProfileForm" class="profile-form-card">
              <div class="coming-soon-content" style="text-align:left; max-width: 900px; margin: 0 auto;">
                <h2 style="margin-bottom: 1rem;">{{ hasProfile ? 'Edit Profile' : 'Create Profile' }}</h2>

                <form (ngSubmit)="saveProfile()">
                  <div style="display:grid; grid-template-columns: 1fr 320px; gap: 2rem; align-items: start;">

                    <div>
                      <div class="form-group">
                        <label for="pname">Name</label>
                        <input id="pname" [(ngModel)]="profileForm.name" name="pname" required>
                      </div>

                      <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                          <label for="page">Age</label>
                          <input 
                            id="page" 
                            type="number" 
                            [(ngModel)]="profileForm.age" 
                            name="page" 
                            min="18" 
                            max="100" 
                            required>
                        </div>
                        <div class="form-group">
                          <label for="pyear">Year</label>
                          <select id="pyear" [(ngModel)]="profileForm.year" name="pyear" required>
                            <option value="" disabled>Select year</option>
                            <option>Freshman</option>
                            <option>Sophomore</option>
                            <option>Junior</option>
                            <option>Senior</option>
                            <option>Graduate</option>
                          </select>
                        </div>
                      </div>

                      <div class="form-group">
                        <label for="pgender">Gender</label>
                        <select id="pgender" [(ngModel)]="profileForm.gender" name="pgender">
                          <option value="" disabled>Select gender</option>
                          <option>Male</option>
                          <option>Female</option>
                          <option>Other</option>
                        </select>
                      </div>

                      <div class="form-group">
                        <label for="pmajor">Major</label>
                        <input id="pmajor" [(ngModel)]="profileForm.major" name="pmajor" required>
                      </div>

                      <div class="form-group">
                        <label for="pbio">Bio</label>
                        <textarea id="pbio" rows="4" [(ngModel)]="profileForm.bio" name="pbio" placeholder="Tell others about yourself"></textarea>
                      </div>

                      <div class="form-group">
                        <label for="pinterests">Interests (comma separated)</label>
                        <input id="pinterests" [(ngModel)]="profileForm.interestsCsv" name="pinterests" placeholder="Hiking, Coffee, Photography">
                        <small style="color:#666; display:block; margin-top: 0.25rem;">Tip: add at least 3 interests.</small>
                      </div>
                    </div>

                    <div>
                      <div style="background:#f8fafc; border:2px dashed #e2e8f0; border-radius:16px; padding:1rem; text-align:center;">
                        <div style="width: 100%; aspect-ratio: 2 / 3; background:#e5e7eb; border-radius:12px; margin-bottom: 0.75rem; overflow:hidden; display:flex; align-items:center; justify-content:center;">
                          <img *ngIf="profilePhotoDataUrl" [src]="profilePhotoDataUrl" alt="Profile preview" style="width:100%; height:100%; object-fit:cover;">
                          <div *ngIf="!profilePhotoDataUrl" style="color:#9ca3af; font-size:3rem;">📷</div>
                        </div>
                        <input type="file" accept="image/*" (change)="onPhotoSelected($event)" style="display:none;" #fileInput>
                        <div style="display:flex; gap:0.5rem; justify-content:center;">
                          <button type="button" class="btn btn-outline" (click)="fileInput.click()">Upload Photo</button>
                          <button type="button" class="btn btn-outline" [disabled]="!profilePhotoDataUrl" (click)="removePhoto()">Remove</button>
                        </div>
                        <small style="color:#666; display:block; margin-top: 0.5rem;">Recommended: portrait, 4:6 or 2:3 ratio</small>
                      </div>
                    </div>
                  </div>

                  <div style="display:flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1.25rem;">
                    <button type="button" class="btn btn-outline" (click)="cancelProfileForm()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      /* KU Theme variables */
      --ku-blue: #0051BA;
      --ku-crimson: #E8000D;
      --ku-yellow: #FFD200;
      --primary: var(--ku-blue);
      --secondary: var(--ku-crimson);
      --accent: var(--ku-yellow);
      --blue-50: #f0f6ff;
      --blue-100: #e6f0ff;
      --blue-200: #c7ddff;

      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      display: flex;
      flex-direction: column;
    }

    .navbar {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .nav-brand h1 {
      color: var(--primary);
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0;
    }

    .ku-badge {
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      color: white;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .nav-menu {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .nav-btn {
      background: none;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
      color: #444;
    }

    .nav-btn:hover {
      background: rgba(0, 81, 186, 0.1);
      color: var(--primary);
    }

    .nav-btn.active {
      background: var(--primary);
      color: white;
    }

    .main-content {
      flex: 1;
    }

    .main-content.no-nav {
      min-height: 100vh;
    }

    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .login-card {
      background: white;
      border-radius: 20px;
      padding: 3rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 400px;
      text-align: center;
    }

    .login-header h1 {
      color: var(--primary);
      font-size: 2.5rem;
      margin: 0 0 0.5rem 0;
      font-weight: 700;
    }

    .subtitle {
      color: #666;
      margin: 0 0 1rem 0;
      font-size: 1.1rem;
    }

    .login-form {
      margin: 2rem 0;
    }

    .form-group {
      margin-bottom: 1.5rem;
      text-align: left;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      color: #333;
      font-weight: 500;
    }

    .form-group input, .form-group select, .form-group textarea {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e1e5e9;
      border-radius: 10px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
      box-sizing: border-box;
    }

    .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
      outline: none;
      border-color: var(--primary);
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      display: inline-block;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--primary), #1E66D0);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(0, 81, 186, 0.3);
    }

    .btn-outline {
      background: transparent;
      color: var(--primary);
      border: 2px solid var(--primary);
    }

    .btn-outline:hover {
      background: var(--primary);
      color: white;
    }

    .btn-full {
      width: 100%;
    }

    .login-footer {
      margin-top: 1.5rem;
      color: #666;
    }

    .login-footer a {
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
    }

    .coming-soon {
      min-height: 60vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .coming-soon-content {
      text-align: center;
      background: white;
      padding: 3rem;
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    }

    .coming-soon-content h2 {
      color: var(--primary);
      font-size: 2rem;
      margin: 0 0 1rem 0;
    }

    .coming-soon-content p {
      color: #666;
      font-size: 1.2rem;
      margin: 0 0 2rem 0;
    }

    .swipe-container {
      padding: 2rem;
      min-height: 60vh;
    }

    @media (max-width: 768px) {
      .navbar {
        padding: 1rem;
        flex-direction: column;
        gap: 1rem;
      }

      .nav-menu {
        flex-wrap: wrap;
        justify-content: center;
      }

      .login-card {
        padding: 2rem;
        margin: 1rem;
      }
    }
  `]
})

// Define main app component class
export class AppComponent {
  // Authentication state - true if user is logged in
  isAuthenticated = false;
  // Current view being displayed (swipe, matches, chat, profile)
  currentView = 'swipe';
  // Whether to show registration form instead of login
  showRegister = false;
  // Whether to show profile creation/edit form
  showProfileForm = false;
  // Whether current user has a profile created
  hasProfile = false;
  // Current logged-in user ID
  userId = 0;

  // Login form data - email and password fields
  loginForm = {
    email: '',
    password: ''
  };

  // Profile form data structure
  profileForm: {
    name: string;
    age: number | null;
    major: string;
    year: string;
    bio: string;
    interestsCsv: string;
    gender: string;
  } = {
      name: '',
      age: null,
      major: '',
      year: '',
      bio: '',
      interestsCsv: '',
      gender: ''
    };

  // Profile photo preview as data URL (base64)
  profilePhotoDataUrl: string | null = null;
  // Profile photo file object for upload
  private profilePhotoFile: File | null = null;

  // Registration form data
  registerForm = {
    name: '',
    email: '',
    password: ''
  };
  // Password confirmation field for registration
  registerFormConfirm = '';

  // Array of matched users with their profile information
  matches: Array<{
    matchedUserId: number;
    name: string;
    year: string | null;
    major: string | null;
    gender: string | null;
    photoUrl: string | null;
    matchedAt: number;
  }> = [];
  // Loading state for matches
  matchesLoading = false;
  // Error message for matches loading
  matchesError = '';

  // Constructor - injects required services
  constructor(
    private profiles: ProfileService,  // Profile service for user profiles
    private auth: AuthService,         // Authentication service
    private matchesSvc: MatchService   // Match service for matches
  ) { }

  // Define login method - handles user authentication
  login() {
    if (!this.loginForm.email || !this.loginForm.password) {
      alert('Please enter email and password');
      return;
    }

    this.auth.login({
      email: this.loginForm.email,
      password: this.loginForm.password
    }).subscribe({
      next: (response) => {
        if (response.success && response.user_id) {
          this.userId = response.user_id;
          localStorage.setItem('user_id', this.userId.toString());
          this.isAuthenticated = true;
          this.setView('swipe');
        } else {
          alert(response.message || 'Login failed');
        }
      },
      error: (err) => {
        const msg = err?.error?.message || 'Login failed';
        alert(msg);
      }
    });
  }

  // Setup account registration service - handles new user registration
  register() {
    const email = (this.registerForm.email || '').toLowerCase().trim();
    if (!email.endsWith('@ku.edu')) {
      alert('Please use a valid KU email address (must end with @ku.edu).');
      return;
    }
    if (!this.registerForm.name || !this.registerForm.password) {
      alert('Please complete all fields.');
      return;
    }
    if (this.registerForm.password !== this.registerFormConfirm) {
      alert('Passwords do not match. Please re-enter them.');
      return;
    }
    this.auth.register({
      name: this.registerForm.name.trim(),
      email,
      password: this.registerForm.password
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.userId = Number(res.user_id || 0);
          localStorage.setItem('user_id', this.userId.toString());
          this.isAuthenticated = true;
          this.setView('profile');
          this.showRegister = false;
        } else {
          alert(res.message || 'Registration failed.');
        }
      },
      error: (err) => {
        const msg = (err && (err.error?.message || err.message)) || 'Registration failed.';
        alert(msg);
      }
    });
  }

  // Setup account logout button - clears authentication and resets state
  logout() {
    this.isAuthenticated = false;
    this.userId = 0;
    this.hasProfile = false;
    localStorage.removeItem('user_id');
    this.loginForm = { email: '', password: '' };
  }

  // Set the current view and load related data if needed
  setView(view: string) {
    this.currentView = view;
    if (view === 'profile') {
      this.refreshProfileStatus();
    } else if (view === 'matches') {
      this.loadMatches();
    }
  }

  // Open chat tab focused on a specific match
  // Stores the matched user ID in localStorage for chat component to use
  openChatWith(matchedUserId: number) {
    if (!matchedUserId) {
      return;
    }
    localStorage.setItem('initial_chat_peer_id', String(matchedUserId));
    localStorage.removeItem('initial_chat_open_profile');
    this.setView('chat');
  }

  // Open chat tab and immediately show that match's profile panel
  // Sets flags in localStorage to open profile panel automatically
  openChatProfileWith(matchedUserId: number) {
    if (!matchedUserId) {
      return;
    }
    localStorage.setItem('initial_chat_peer_id', String(matchedUserId));
    localStorage.setItem('initial_chat_open_profile', '1');
    this.setView('chat');
  }

  // Setup service to refresh profile status
  // Checks if current user has a profile created
  private refreshProfileStatus() {
    if (!this.userId) {
      this.hasProfile = false;
      return;
    }
    this.profiles.getProfile(this.userId).subscribe({
      next: (p) => {
        this.hasProfile = !!p;
      },
      error: () => {
        this.hasProfile = false;
      }
    });
  }

  // Load all matches for the logged in user
  // Fetches matches from server and loads profile data for each match
  private loadMatches() {
    if (!this.userId) {
      this.matches = [];
      return;
    }
    this.matchesLoading = true;
    this.matchesError = '';
    this.matches = [];
    this.matchesSvc.listMatches(this.userId).subscribe({
      next: (list: MatchDto[]) => {
        const ids = Array.from(new Set(list.map(m => m.matched_user_id)));
        if (!ids.length) {
          this.matchesLoading = false;
          return;
        }
        forkJoin(ids.map(id => this.profiles.getProfile(id))).subscribe({
          next: profiles => {
            this.matches = profiles.map(p => {
              const matchInfo = list.find(m => m.matched_user_id === p.user_id) || list[0];
              const photoUrl = p.profile_picture ? this.profiles.profilePictureUrl(p.user_id) : null;
              return {
                matchedUserId: p.user_id,
                name: p.name || `User ${p.user_id}`,
                year: p.year || null,
                major: p.major || null,
                gender: p.gender || null,
                photoUrl,
                matchedAt: matchInfo.timestamp
              };
            }).sort((a, b) => b.matchedAt - a.matchedAt);
            this.matchesLoading = false;
          },
          error: () => {
            this.matchesError = 'Failed to load match profiles.';
            this.matchesLoading = false;
          }
        });
      },
      error: () => {
        this.matchesError = 'Failed to load matches.';
        this.matchesLoading = false;
      }
    });
  }

  // Setup HTML connections for opening the profile form
  // Loads existing profile data if available, otherwise shows empty form
  openProfileForm() {
    this.profileForm = {
      name: '',
      age: null,
      major: '',
      year: '',
      bio: '',
      interestsCsv: '',
      gender: ''
    };
    this.profilePhotoDataUrl = null;
    this.profilePhotoFile = null;
    this.showProfileForm = true;
    this.profiles.getProfile(this.userId).subscribe({
      next: (p) => {
        if (p.name) this.profileForm.name = p.name;
        if (typeof p.age === 'number') this.profileForm.age = p.age;
        if (p.major) this.profileForm.major = p.major;
        if (p.year) this.profileForm.year = p.year;
        if (p.bio) this.profileForm.bio = p.bio;
        if (p.interests && Array.isArray(p.interests)) {
          this.profileForm.interestsCsv = p.interests.join(', ');
        }
        if (p.profile_picture) {
          this.profilePhotoDataUrl = this.profiles.profilePictureUrl(this.userId);
        }
        if (p.gender) {
          this.profileForm.gender = p.gender;
        }
      },
      error: (err) => {
        console.log('No existing profile data found (this is normal for new users)');
      }
    });
  }

  // Exit profile form - closes the profile editing interface
  cancelProfileForm() {
    this.showProfileForm = false;
  }

  // Setup button for saving profile
  // Validates profile data and uploads photo if provided, then saves profile
  saveProfile() {
    // Enforce age between 18 and 100 (if provided)
    if (this.profileForm.age == null || isNaN(this.profileForm.age as any)) {
      alert('Please enter a valid age between 18 and 100.');
      return;
    }
    if (this.profileForm.age < 18 || this.profileForm.age > 100) {
      alert('Age must be between 18 and 100 to create a profile.');
      return;
    }

    const interests = this.profileForm.interestsCsv
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const payload: ProfileUpsertDto = {
      name: this.profileForm.name || null,
      age: this.profileForm.age ?? null,
      major: this.profileForm.major || null,
      year: this.profileForm.year || null,
      bio: this.profileForm.bio || null,
      interests: interests.length ? interests : null,
      gender: this.profileForm.gender || null
    };

    const afterUploadAndSave = () => {
      this.profiles.upsertProfile(this.userId, payload).subscribe({
        next: () => {
          alert('Profile saved successfully.');
          this.showProfileForm = false;
          this.hasProfile = true;
        },
        error: () => {
          alert('Failed to save profile. Please try again.');
        }
      });
    };

    if (this.profilePhotoFile) {
      this.profiles.uploadProfilePicture(this.userId, this.profilePhotoFile).subscribe({
        next: () => afterUploadAndSave(),
        error: () => {
          alert('Failed to upload profile picture.');
          afterUploadAndSave();
        }
      });
    } else {
      afterUploadAndSave();
    }
  }

  // Setup service to handle selecting a photo to use as a profile picture
  // Validates file size and creates preview using FileReader
  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;

    const maxSizeMb = 5;
    if (file.size > maxSizeMb * 1024 * 1024) {
      alert(`Image too large. Please select a file under ${maxSizeMb}MB.`);
      input.value = '';
      return;
    }

    this.profilePhotoFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.profilePhotoDataUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  // Remove profile photo - clears the photo preview and file reference
  removePhoto() {
    this.profilePhotoDataUrl = null;
    this.profilePhotoFile = null;
  }
}