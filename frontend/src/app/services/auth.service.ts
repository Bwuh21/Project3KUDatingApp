/*
Name: auth_service.ts
Description: Javascript for authenticating against the server
Programmer: Maren, Ibrahim, Zack
Dates: 11/23/2025
Revision: 1
Pre/Post Conditions: should send api requests to the backend when a user goes to auth. The backend should respond and this will handle the response
Errors: None
*/

// Import Angular injectable decorator for dependency injection
import { Injectable } from '@angular/core';
// Import HTTP client for making API requests
import { HttpClient } from '@angular/common/http';
// Import Observable for handling asynchronous responses
import { Observable } from 'rxjs';

// Structure for holding the registration payload data
export interface RegisterPayload {
  name: string;      // User's full name
  email: string;    // User's email address (must be @ku.edu)
  password: string; // User's password
}

// Structure for holding the registration response data from the server
export interface RegisterResponse {
  success: boolean;  // Whether registration was successful
  message: string;   // Response message from server
  user_id?: number;  // Optional user ID if registration succeeds
}

// Structure for the login payload data
export interface LoginPayload {
  email: string;    // User's email address
  password: string;  // User's password
}

// Structure for the login response data from the server
export interface LoginResponse {
  success: boolean;  // Whether login was successful
  message: string;   // Response message from server
  user_id?: number;  // Optional user ID if login succeeds
}

// Define the authentication service
// This service sends authentication requests to api.jaymatch.cc
// It provides both register and login methods
@Injectable({ providedIn: 'root' })
export class AuthService {
  // Base URL for the API server
  private readonly base = 'https://api.jaymatch.cc';

  // Constructor - injects HttpClient for making HTTP requests
  constructor(private http: HttpClient) { }

  // Register a new user
  // Sends POST request to /users/new endpoint with registration data
  // Returns Observable that emits the server response
  register(payload: RegisterPayload): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.base}/users/new`, payload);
  }

  // Login an existing user
  // Sends POST request to /login endpoint with login credentials
  // Returns Observable that emits the server response
  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/login`, payload);
  }
}


