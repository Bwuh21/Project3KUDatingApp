/*
Name: profile.service.ts
Description: Javascript for interacting with profiles
Programmer: Maren, Ibrahim, Zack
Dates: 11/23/2025
Revision: 1
Pre/Post Conditions: should send and recieve profile data. Should interact with the rest of the client and with the server. Should not corrupt any profile data
Errors: None
*/

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

//define struct for profile data
export interface ProfileDto {
  user_id: number;
  name?: string | null;
  age?: number | null;
  major?: string | null;
  year?: string | null;
  bio?: string | null;
  interests?: string[] | null;
  profile_picture?: string | null;
}

//define upsert profile structure
export interface ProfileUpsertDto {
  name?: string | null;
  age?: number | null;
  major?: string | null;
  year?: string | null;
  bio?: string | null;
  interests?: string[] | null;
  profile_picture?: string | null;
}

//define profile service
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly base = 'https://api.jaymatch.cc';

  constructor(private http: HttpClient) { }

  //send request to server to get a profile data
  getProfile(userId: number): Observable<ProfileDto> {
    return this.http.get<ProfileDto>(`${this.base}/profiles/${userId}`);
  }

  //send request to update profile in sqlite tables
  upsertProfile(userId: number, payload: ProfileUpsertDto): Observable<{ success: boolean; user_id: number }> {
    return this.http.put<{ success: boolean; user_id: number }>(`${this.base}/profiles/${userId}`, payload);
  }

  //send a new profile picture and tell the server to update headers
  uploadProfilePicture(userId: number, file: File): Observable<any> {
    const form = new FormData();
    form.append('user_id', String(userId));
    form.append('image', file);
    return this.http.post(`${this.base}/users/profile-picture`, form);
  }

  //create a url for the profile for it to be sent
  profilePictureUrl(userId: number): string {
    return `${this.base}/users/${userId}/profile-picture`;
  }

  //retrieve a queue of profiles for each user using server
  getQueue(userId: number): Observable<ProfileDto[]> {
    return this.http.get<ProfileDto[]>(`${this.base}/queue/${userId}`);
  }
}


