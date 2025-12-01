/*
Name: preferences.service.ts
Description: Service for loading and saving swipe preference filters
Programmer: Maren, Ibrahim, Zack
Dates: 11/23/2025
Revision: 1
Pre/Post Conditions: Should correctly retrieve and update preference filters for a user
Errors: None
*/

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PreferenceOptions {
  gender_options: string[];
  year_options: string[];
}

export interface PreferencesDto {
  user_id: number;
  gender_preference?: string[] | null;
  min_age?: number | null;
  max_age?: number | null;
  year_preference?: string[] | null;
  major_preference?: string[] | null;
}

export interface PreferencesUpsertDto {
  gender_preference?: string[] | null;
  min_age?: number | null;
  max_age?: number | null;
  year_preference?: string[] | null;
  major_preference?: string[] | null;
}

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly base = 'https://api.jaymatch.cc';

  constructor(private http: HttpClient) { }

  getOptions(): Observable<PreferenceOptions> {
    return this.http.get<PreferenceOptions>(`${this.base}/preference-options`);
  }

  getPreferences(userId: number): Observable<PreferencesDto> {
    return this.http.get<PreferencesDto>(`${this.base}/preferences/${userId}`);
  }

  savePreferences(userId: number, prefs: PreferencesUpsertDto): Observable<{ success: boolean; user_id: number }> {
    return this.http.put<{ success: boolean; user_id: number }>(`${this.base}/preferences/${userId}`, prefs);
  }
}



