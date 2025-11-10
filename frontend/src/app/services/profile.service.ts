import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

export interface ProfileUpsertDto {
  name?: string | null;
  age?: number | null;
  major?: string | null;
  year?: string | null;
  bio?: string | null;
  interests?: string[] | null;
  profile_picture?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly base = 'https://api.jaymatch.cc';

  constructor(private http: HttpClient) { }

  getProfile(userId: number): Observable<ProfileDto> {
    return this.http.get<ProfileDto>(`${this.base}/profiles/${userId}`);
  }

  upsertProfile(userId: number, payload: ProfileUpsertDto): Observable<{ success: boolean; user_id: number }> {
    return this.http.put<{ success: boolean; user_id: number }>(`${this.base}/profiles/${userId}`, payload);
  }

  uploadProfilePicture(userId: number, file: File): Observable<any> {
    const form = new FormData();
    form.append('user_id', String(userId));
    form.append('image', file);
    return this.http.post(`${this.base}/users/profile-picture`, form);
  }

  profilePictureUrl(userId: number): string {
    return `${this.base}/users/${userId}/profile-picture`;
  }
}


