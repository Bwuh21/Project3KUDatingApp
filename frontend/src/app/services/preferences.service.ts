/*
Name: preferences.service.ts
Description: Service for loading and saving swipe preference filters
Programmer: Maren, Ibrahim, Zack
Dates: 11/23/2025
Revision: 1
Pre/Post Conditions: Should correctly retrieve and update preference filters for a user
Errors: None
*/

// Import Angular injectable decorator for dependency injection
import { Injectable } from '@angular/core';
// Import HTTP client for making API requests
import { HttpClient } from '@angular/common/http';
// Import Observable for handling asynchronous responses
import { Observable } from 'rxjs';

// Structure for available preference options from server
export interface PreferenceOptions {
  gender_options: string[];  // Available gender options (Male, Female, Other)
  year_options: string[];     // Available year options (Freshman, Sophomore, etc.)
}

// Structure for user preferences data
export interface PreferencesDto {
  user_id: number;                    // User ID
  gender_preference?: string[] | null; // Preferred genders
  min_age?: number | null;            // Minimum age preference
  max_age?: number | null;            // Maximum age preference
  year_preference?: string[] | null;    // Preferred academic years
  major_preference?: string[] | null;  // Preferred majors
}

// Structure for creating or updating preferences (upsert operation)
export interface PreferencesUpsertDto {
  gender_preference?: string[] | null; // Preferred genders
  min_age?: number | null;            // Minimum age preference
  max_age?: number | null;            // Maximum age preference
  year_preference?: string[] | null;    // Preferred academic years
  major_preference?: string[] | null;  // Preferred majors
}

// Service for loading and saving swipe preference filters
@Injectable({ providedIn: 'root' })
export class PreferencesService {
  // Base URL for the API server
  private readonly base = 'https://api.jaymatch.cc';

  // Constructor - injects HttpClient for making HTTP requests
  constructor(private http: HttpClient) { }

  // Get available preference options
  // GET request to /preference-options endpoint
  // Returns list of valid options for filters
  getOptions(): Observable<PreferenceOptions> {
    return this.http.get<PreferenceOptions>(`${this.base}/preference-options`);
  }

  // Get user's current preferences
  // GET request to /preferences/{userId} endpoint
  // Returns the user's saved filter preferences
  getPreferences(userId: number): Observable<PreferencesDto> {
    return this.http.get<PreferencesDto>(`${this.base}/preferences/${userId}`);
  }

  // Save user preferences
  // PUT request to /preferences/{userId} endpoint
  // Updates the preferences table with new filter settings
  savePreferences(userId: number, prefs: PreferencesUpsertDto): Observable<{ success: boolean; user_id: number }> {
    return this.http.put<{ success: boolean; user_id: number }>(`${this.base}/preferences/${userId}`, prefs);
  }
}



