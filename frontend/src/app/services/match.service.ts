/*
Name: match.service.ts
Description: Service for working with matches (list/create/delete)
Programmer: Maren, Ibrahim, Zack
Dates: 11/23/2025
Revision: 2
Pre/Post Conditions: Should correctly load and manage match data from the backend
Errors: None
*/

// Import Angular injectable decorator for dependency injection
import { Injectable } from '@angular/core';
// Import HTTP client for making API requests
import { HttpClient } from '@angular/common/http';
// Import Observable for handling asynchronous responses
import { Observable } from 'rxjs';

// Structure for match data received from the server
export interface MatchDto {
  user_id: number;          // ID of the current user
  matched_user_id: number;  // ID of the matched user
  timestamp: number;        // Unix timestamp when the match was created
}

// Structure for match request payload
export interface MatchRequest {
  user_id: number;          // ID of the current user
  matched_user_id: number;   // ID of the user to match with
}

// Service for working with matches (list/create/delete)
@Injectable({ providedIn: 'root' })
export class MatchService {
  // Base URL for the API server
  private readonly base = 'https://api.jaymatch.cc';

  // Constructor - injects HttpClient for making HTTP requests
  constructor(private http: HttpClient) { }

  // Load all matches for a user
  // GET request to /matches/{userId} endpoint
  // Returns array of all matches for the specified user
  listMatches(userId: number): Observable<MatchDto[]> {
    return this.http.get<MatchDto[]>(`${this.base}/matches/${userId}`);
  }

  // Create a new match between two users
  // POST request to /matches endpoint
  // Creates a match record when two users like each other
  createMatch(userId: number, matchedUserId: number): Observable<{ success: boolean; message?: string }> {
    // Create request body with user IDs
    const body: MatchRequest = { user_id: userId, matched_user_id: matchedUserId };
    // Send POST request to create match
    return this.http.post<{ success: boolean; message?: string }>(`${this.base}/matches`, body);
  }

  // Delete an existing match (unmatch)
  // DELETE request to /matches endpoint
  // Removes the match relationship between two users
  deleteMatch(userId: number, matchedUserId: number): Observable<{ success: boolean; message?: string }> {
    // Create request body with user IDs
    const body: MatchRequest = { user_id: userId, matched_user_id: matchedUserId };
    // Send DELETE request with body to remove match
    return this.http.delete<{ success: boolean; message?: string }>(`${this.base}/matches`, { body });
  }
}



