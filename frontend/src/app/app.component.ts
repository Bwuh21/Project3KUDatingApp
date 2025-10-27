import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <!-- Navigation Header - Only show when authenticated -->
      <nav class="navbar" *ngIf="isAuthenticated">
        <div class="nav-brand">
          <h1>❤️ JayMatch</h1>
          <span class="ku-badge">KU Verified</span>
        </div>
        <div class="nav-menu">
          <button class="nav-btn" [class.active]="currentView === 'swipe'" (click)="setView('swipe')">
            🔥 Discover
          </button>
          <button class="nav-btn" [class.active]="currentView === 'chat'" (click)="setView('chat')">
            💬 Chat
          </button>
          <button class="nav-btn" [class.active]="currentView === 'profile'" (click)="setView('profile')">
            👤 Profile
          </button>
          <button class="nav-btn" [class.active]="currentView === 'backend'" (click)="setView('backend')">
            🔧 Backend
          </button>
          <button class="btn btn-outline" (click)="logout()">Logout</button>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="main-content" [class.no-nav]="!isAuthenticated">
        <!-- Login Page -->
        <div *ngIf="!isAuthenticated" class="login-container">
          <div class="login-card">
            <div class="login-header">
              <h1>❤️ JayMatch</h1>
              <p class="subtitle">KU Dating App</p>
              <span class="ku-badge">Rock Chalk! 🐦</span>
            </div>
            
            <form class="login-form" (ngSubmit)="login()">
              <div class="form-group">
                <label for="email">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  [(ngModel)]="loginForm.email" 
                  name="email"
                  placeholder="your.email@ku.edu"
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
            
            <div class="login-divider">
              <span>or</span>
            </div>
            
            <button class="btn btn-bypass" (click)="bypassLogin()">
              🚀 Bypass Login (Demo)
            </button>
            
            <p class="login-footer">
              Don't have an account? <a href="#" (click)="showRegister = true; $event.preventDefault()">Sign up</a>
            </p>
          </div>
        </div>

        <!-- Main App Views -->
        <div *ngIf="isAuthenticated">
          <!-- Swipe View -->
          <div *ngIf="currentView === 'swipe'" class="swipe-container">
            <app-swipe-interface></app-swipe-interface>
          </div>
          
          <!-- Chat View -->
          <div *ngIf="currentView === 'chat'" class="coming-soon">
            <div class="coming-soon-content">
              <h2>💬 Chat</h2>
              <p>Coming Soon!</p>
              <div class="placeholder-icon">💬</div>
            </div>
          </div>
          
          <!-- Profile View -->
          <div *ngIf="currentView === 'profile'" class="coming-soon">
            <div class="coming-soon-content">
              <h2>👤 Profile</h2>
              <p>Coming Soon!</p>
              <div class="placeholder-icon">👤</div>
            </div>
          </div>
          
          <!-- Backend Integration Area -->
          <div *ngIf="currentView === 'backend'" class="backend-area">
            <app-backend-integration></app-backend-integration>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
      color: #8b5cf6;
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0;
    }

    .ku-badge {
      background: linear-gradient(135deg, #8b5cf6, #a855f7);
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
      color: #666;
    }

    .nav-btn:hover {
      background: rgba(139, 92, 246, 0.1);
      color: #8b5cf6;
    }

    .nav-btn.active {
      background: #8b5cf6;
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
      color: #8b5cf6;
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

    .form-group input {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e1e5e9;
      border-radius: 10px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
      box-sizing: border-box;
    }

    .form-group input:focus {
      outline: none;
      border-color: #8b5cf6;
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
      background: linear-gradient(135deg, #8b5cf6, #a855f7);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(139, 92, 246, 0.3);
    }

    .btn-outline {
      background: transparent;
      color: #8b5cf6;
      border: 2px solid #8b5cf6;
    }

    .btn-outline:hover {
      background: #8b5cf6;
      color: white;
    }

    .btn-bypass {
      background: linear-gradient(135deg, #f59e0b, #f97316);
      color: white;
      width: 100%;
    }

    .btn-bypass:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(245, 158, 11, 0.3);
    }

    .btn-full {
      width: 100%;
    }

    .login-divider {
      margin: 1.5rem 0;
      position: relative;
      text-align: center;
    }

    .login-divider span {
      background: white;
      padding: 0 1rem;
      color: #999;
    }

    .login-divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: #e1e5e9;
      z-index: -1;
    }

    .login-footer {
      margin-top: 1.5rem;
      color: #666;
    }

    .login-footer a {
      color: #8b5cf6;
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
      color: #8b5cf6;
      font-size: 2rem;
      margin: 0 0 1rem 0;
    }

    .coming-soon-content p {
      color: #666;
      font-size: 1.2rem;
      margin: 0 0 2rem 0;
    }

    .placeholder-icon {
      font-size: 4rem;
      opacity: 0.5;
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
export class AppComponent {
  isAuthenticated = false;
  currentView = 'swipe';
  showRegister = false;
  
  loginForm = {
    email: '',
    password: ''
  };

  login() {
    // Simple validation
    if (this.loginForm.email && this.loginForm.password) {
      this.isAuthenticated = true;
      this.currentView = 'swipe';
    }
  }

  bypassLogin() {
    this.isAuthenticated = true;
    this.currentView = 'swipe';
  }

  logout() {
    this.isAuthenticated = false;
    this.loginForm = { email: '', password: '' };
  }

  setView(view: string) {
    this.currentView = view;
  }
}