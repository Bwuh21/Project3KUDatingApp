import { Component, OnInit } from '@angular/core';

interface Profile {
  id: number;
  name: string;
  age: number;
  major: string;
  year: string;
  bio: string;
  interests: string[];
  image: string;
}

@Component({
  selector: 'app-swipe-interface',
  template: `
    <div class="swipe-container">
      <div class="swipe-header">
        <h2>🔥 Discover KU Students</h2>
        <p>Swipe right to like, left to pass</p>
      </div>

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
            <img [src]="currentProfile.image" [alt]="currentProfile.name">
            <div class="profile-overlay">
              <div class="profile-info">
                <h3>{{currentProfile.name}}, {{currentProfile.age}}</h3>
                <p class="major-year">{{currentProfile.major}} • {{currentProfile.year}}</p>
              </div>
            </div>
          </div>

          <div class="profile-details">
            <div class="bio">
              <p>{{currentProfile.bio}}</p>
            </div>
            
            <div class="interests">
              <h4>Interests</h4>
              <div class="interest-tags">
                <span class="tag" *ngFor="let interest of currentProfile.interests">
                  {{interest}}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button class="action-btn pass-btn" (click)="swipeLeft()">
            ❌
          </button>
          <button class="action-btn like-btn" (click)="swipeRight()">
            ❤️
          </button>
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

      <!-- No More Profiles -->
      <div class="no-profiles" *ngIf="!currentProfile">
        <div class="no-profiles-content">
          <h3>🎉 That's all for now!</h3>
          <p>Check back later for more KU students</p>
          <button class="btn btn-primary" (click)="resetProfiles()">
            Start Over
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
    </div>
  `,
  styles: [`
    .swipe-container {
      max-width: 400px;
      margin: 0 auto;
      padding: 1rem;
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
      color: #8b5cf6;
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
      color: #8b5cf6;
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
      background: linear-gradient(135deg, #8b5cf6, #a855f7);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(139, 92, 246, 0.3);
    }
  `]
})
export class SwipeInterfaceComponent implements OnInit {
  profiles: Profile[] = [];
  currentIndex = 0;
  currentProfile: Profile | null = null;
  likedProfiles: Profile[] = [];
  passedProfiles: Profile[] = [];
  
  // Touch/Mouse handling
  isDragging = false;
  startX = 0;
  startY = 0;
  currentX = 0;
  currentY = 0;
  cardTransform = '';
  cardOpacity = 1;
  swipeDirection = '';

  ngOnInit() {
    this.loadFakeProfiles();
    this.currentProfile = this.profiles[0] || null;
  }

  loadFakeProfiles() {
    this.profiles = [
      {
        id: 1,
        name: 'Emma',
        age: 20,
        major: 'Computer Science',
        year: 'Junior',
        bio: 'Love coding, hiking, and trying new coffee shops around Lawrence! Always up for an adventure.',
        interests: ['Programming', 'Hiking', 'Coffee', 'Photography', 'Rock Climbing'],
        image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=600&fit=crop&crop=face'
      },
      {
        id: 2,
        name: 'Alex',
        age: 22,
        major: 'Business',
        year: 'Senior',
        bio: 'Future entrepreneur! Love basketball, cooking, and exploring new places. Let\'s grab some BBQ!',
        interests: ['Basketball', 'Cooking', 'Travel', 'Business', 'Music'],
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face'
      },
      {
        id: 3,
        name: 'Sarah',
        age: 19,
        major: 'Psychology',
        year: 'Sophomore',
        bio: 'Passionate about mental health and helping others. Love yoga, reading, and late-night talks.',
        interests: ['Psychology', 'Yoga', 'Reading', 'Volunteering', 'Art'],
        image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop&crop=face'
      },
      {
        id: 4,
        name: 'Jake',
        age: 21,
        major: 'Engineering',
        year: 'Junior',
        bio: 'Building the future one project at a time! Love gaming, craft beer, and weekend road trips.',
        interests: ['Engineering', 'Gaming', 'Craft Beer', 'Road Trips', 'Technology'],
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop&crop=face'
      },
      {
        id: 5,
        name: 'Maya',
        age: 20,
        major: 'Journalism',
        year: 'Junior',
        bio: 'Storyteller at heart! Love writing, dancing, and discovering hidden gems in Lawrence.',
        interests: ['Writing', 'Dancing', 'Journalism', 'Podcasts', 'Food'],
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop&crop=face'
      },
      {
        id: 6,
        name: 'Ryan',
        age: 23,
        major: 'Biology',
        year: 'Graduate',
        bio: 'Research enthusiast! Love nature, fitness, and deep conversations about life and science.',
        interests: ['Biology', 'Research', 'Fitness', 'Nature', 'Philosophy'],
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop&crop=face'
      }
    ];
  }

  onTouchStart(event: TouchEvent) {
    this.startX = event.touches[0].clientX;
    this.startY = event.touches[0].clientY;
    this.isDragging = true;
  }

  onTouchMove(event: TouchEvent) {
    if (!this.isDragging) return;
    
    this.currentX = event.touches[0].clientX;
    this.currentY = event.touches[0].clientY;
    this.updateCardTransform();
  }

  onTouchEnd(event: TouchEvent) {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    this.handleSwipeEnd();
  }

  onMouseDown(event: MouseEvent) {
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.isDragging = true;
    event.preventDefault();
  }

  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;
    
    this.currentX = event.clientX;
    this.currentY = event.clientY;
    this.updateCardTransform();
  }

  onMouseUp(event: MouseEvent) {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    this.handleSwipeEnd();
  }

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

  swipeRight() {
    if (!this.currentProfile) return;
    
    this.likedProfiles.push(this.currentProfile);
    this.nextProfile();
  }

  swipeLeft() {
    if (!this.currentProfile) return;
    
    this.passedProfiles.push(this.currentProfile);
    this.nextProfile();
  }

  nextProfile() {
    this.currentIndex++;
    this.currentProfile = this.profiles[this.currentIndex] || null;
    this.cardTransform = '';
    this.cardOpacity = 1;
    this.swipeDirection = '';
  }

  resetProfiles() {
    this.currentIndex = 0;
    this.currentProfile = this.profiles[0] || null;
    this.likedProfiles = [];
    this.passedProfiles = [];
  }
}

