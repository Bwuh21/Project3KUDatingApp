/*
Name: match.service.ts
Description: Service for working with matches (list/create/delete)
Programmer: Maren, Ibrahim, Zack
Dates: 11/23/2025
Revision: 2
Pre/Post Conditions: Should correctly load and manage match data from the backend
Errors: None
*/

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MatchDto {
  user_id: number;
  matched_user_id: number;
  timestamp: number;
}

export interface MatchRequest {
  user_id: number;
  matched_user_id: number;
}

@Injectable({ providedIn: 'root' })
export class MatchService {
  private readonly base = 'https://api.jaymatch.cc';

  constructor(private http: HttpClient) { }

  //load all matches for a user
  listMatches(userId: number): Observable<MatchDto[]> {
    return this.http.get<MatchDto[]>(`${this.base}/matches/${userId}`);
  }

  //create a new match between two users
  createMatch(userId: number, matchedUserId: number): Observable<{ success: boolean; message?: string }> {
    const body: MatchRequest = { user_id: userId, matched_user_id: matchedUserId };
    return this.http.post<{ success: boolean; message?: string }>(`${this.base}/matches`, body);
  }

  //delete an existing match
  deleteMatch(userId: number, matchedUserId: number): Observable<{ success: boolean; message?: string }> {
    const body: MatchRequest = { user_id: userId, matched_user_id: matchedUserId };
    return this.http.delete<{ success: boolean; message?: string }>(`${this.base}/matches`, { body });
  }
}



