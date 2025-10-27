# JayMatch - KU Dating App Frontend

A clean, modern frontend for the JayMatch KU Dating App with swipe functionality and backend integration ready.

## Features

### 🔐 Login Page
- Beautiful login form with KU branding
- **Bypass Login button** for quick demo access
- Responsive design with gradient background

### 🔥 Swipe Interface
- Interactive card-based swiping (left/right)
- Touch and mouse support for desktop and mobile
- 6 fake KU student profiles with realistic data
- Visual feedback during swiping
- Statistics tracking (liked, passed, remaining)

### 🧭 Navigation
- Clean navigation bar with tabs:
  - **Discover** - Main swipe interface
  - **Chat** - Coming soon placeholder
  - **Profile** - Coming soon placeholder
  - **Backend** - Integration area for developers

### 🔧 Backend Integration Area
- Dedicated space for backend API integration
- Clear documentation of required endpoints
- Step-by-step integration guide
- Ready-to-use service structure

## Quick Start

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server:**
   ```bash
   npm start
   ```

3. **Access the app:**
   - Open http://localhost:4200
   - Click "🚀 Bypass Login (Demo)" to skip authentication
   - Start swiping through KU student profiles!

## Project Structure

```
frontend/src/app/
├── app.component.ts          # Main app with login and navigation
├── app.module.ts            # Simplified module configuration
├── app-routing.module.ts     # Basic routing setup
└── components/
    ├── swipe-interface/      # Swipe functionality
    └── backend-integration/  # Backend integration guide
```

## Backend Integration

The app is ready for backend integration with these key areas:

- **Authentication**: Replace bypass login with real API calls
- **User Profiles**: Connect to your user database
- **Matching System**: Implement real matching logic
- **Chat System**: Add real-time messaging

Check the Backend tab in the app for detailed integration instructions.

## Technologies Used

- **Angular 17** - Modern frontend framework
- **TypeScript** - Type-safe development
- **CSS3** - Modern styling with gradients and animations
- **Responsive Design** - Works on desktop and mobile

## Demo Data

The app includes 6 realistic KU student profiles with:
- Names, ages, majors, and graduation years
- Personal bios and interests
- High-quality profile images from Unsplash
- Diverse backgrounds and interests

## Next Steps

1. Set up your backend API
2. Replace mock data with real API calls
3. Add authentication flow
4. Implement real-time chat
5. Add profile editing functionality

---

**Rock Chalk! 🐦** - Built for KU students, by KU students.