/*
Name: profile.service.ts
Description: Javascript for interacting with profiles
Programmer: Maren, Ibrahim, Zack
Dates: 11/23/2025
Revision: 1
Pre/Post Conditions: should send and recieve profile data. Should interact with the rest of the client and with the server. Should not corrupt any profile data
Errors: None
*/

// Import Angular injectable decorator for dependency injection
import { Injectable } from '@angular/core';
// Import HTTP client for making API requests
import { HttpClient } from '@angular/common/http';
// Import Observable for handling asynchronous responses
import { Observable } from 'rxjs';

// Define structure for profile data received from the server
export interface ProfileDto {
  user_id: number;              // Unique user identifier
  name?: string | null;         // User's full name
  age?: number | null;          // User's age
  major?: string | null;        // User's major field of study
  year?: string | null;         // User's academic year (Freshman, Sophomore, etc.)
  bio?: string | null;          // User's biography/description
  interests?: string[] | null;   // Array of user's interests
  profile_picture?: string | null; // Path to profile picture file
  gender?: string | null;        // User's gender
}

// Define structure for creating or updating a profile (upsert operation)
export interface ProfileUpsertDto {
  name?: string | null;         // User's full name
  age?: number | null;          // User's age
  major?: string | null;        // User's major field of study
  year?: string | null;         // User's academic year
  bio?: string | null;          // User's biography/description
  interests?: string[] | null;   // Array of user's interests
  profile_picture?: string | null; // Path to profile picture file
  gender?: string | null;        // User's gender
}

// Define profile service for interacting with user profiles
@Injectable({ providedIn: 'root' })
export class ProfileService {
  // Base URL for the API server
  private readonly base = 'https://api.jaymatch.cc';

  // Constructor - injects HttpClient for making HTTP requests
  constructor(private http: HttpClient) { }

  // Send request to server to get a user's profile data
  // GET request to /profiles/{userId} endpoint
  getProfile(userId: number): Observable<ProfileDto> {
    return this.http.get<ProfileDto>(`${this.base}/profiles/${userId}`);
  }

  // Send request to update profile in database (create or update)
  // PUT request to /profiles/{userId} endpoint
  // Updates SQLite tables with new profile data
  upsertProfile(userId: number, payload: ProfileUpsertDto): Observable<{ success: boolean; user_id: number }> {
    return this.http.put<{ success: boolean; user_id: number }>(`${this.base}/profiles/${userId}`, payload);
  }

  // Send a new profile picture file to the server
  // POST request to /users/profile-picture endpoint
  // Uses FormData to upload the image file
  uploadProfilePicture(userId: number, file: File): Observable<any> {
    // Create FormData object for file upload
    const form = new FormData();
    // Append user ID to form data
    form.append('user_id', String(userId));
    // Append image file to form data
    form.append('image', file);
    // Send POST request with form data
    return this.http.post(`${this.base}/users/profile-picture`, form);
  }

  // Create a URL for retrieving a user's profile picture
  // Returns the API endpoint URL for the profile picture
  profilePictureUrl(userId: number): string {
    return `${this.base}/users/${userId}/profile-picture`;
  }

  // Retrieve a queue of potential match profiles for a user
  // GET request to /queue/{userId} endpoint
  // Returns filtered list of profiles based on user preferences
  getQueue(userId: number): Observable<ProfileDto[]> {
    return this.http.get<ProfileDto[]>(`${this.base}/queue/${userId}`);
  }
}


