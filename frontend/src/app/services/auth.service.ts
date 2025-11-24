/*
Name: auth_service.ts
Description: Javascript for authenticating against the server
Programmer: Maren, Ibrahim, Zack
Dates: 11/23/2025
Revision: 1
Pre/Post Conditions: should send api requests to the backend when a user goes to auth. The backend should respond and this will handle the response
Errors: None
*/

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

//structur for holding the payload
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

//structure for holding the response data
export interface RegisterResponse {
  success: boolean;
  message: string;
  user_id?: number;
}

//structure for the login payload
export interface LoginPayload {
  email: string;
  password: string;
}

//structure for the login response 
export interface LoginResponse {
  success: boolean;
  message: string;
  user_id?: number;
}

//define the auth methods
//they should send auth requests to api.jaymatch.cc
//define both register and login posts
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = 'https://api.jaymatch.cc';

  constructor(private http: HttpClient) { }

  register(payload: RegisterPayload): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.base}/users/new`, payload);
  }

  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/login`, payload);
  }
}


