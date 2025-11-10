import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user_id?: number;
}

export interface LoginPayload {
  name: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user_id?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = 'https://api.jaymatch.cc';

  constructor(private http: HttpClient) {}

  register(payload: RegisterPayload): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.base}/users/new`, payload);
  }

  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/login`, payload);
  }
}


