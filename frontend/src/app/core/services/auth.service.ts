import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, tap } from 'rxjs/operators';
import { of, throwError } from 'rxjs';
import { AuthResponse } from '../models/ledger.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly baseUrl = 'http://localhost:8080/api/v1';

  // Signals for state management
  private authState = signal<{ token: string | null; user: AuthResponse['user'] | null }>({
    token: typeof localStorage !== 'undefined' ? localStorage.getItem('float_token') : null,
    user: typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('float_user') || 'null') : null
  });

  // Computed signals for easy access
  isAuthenticated = computed(() => !!this.authState().token);
  currentUser = computed(() => this.authState().user);
  token = computed(() => this.authState().token);

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, { email, password }).pipe(
      tap(response => {
        this.setSession(response);
      }),
      catchError(error => {
        console.error('Login failed', error);
        return throwError(() => error);
      })
    );
  }

  register(name: string, email: string, password: string) {
    return this.http.post(`${this.baseUrl}/register`, { full_name: name, email, password }).pipe(
      catchError(error => {
        console.error('Registration failed', error);
        return throwError(() => error);
      })
    );
  }

  logout() {
    this.authState.set({ token: null, user: null });
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('float_token');
      localStorage.removeItem('float_user');
    }
    this.router.navigate(['/login']);
  }

  private setSession(response: AuthResponse) {
    this.authState.set({ token: response.token, user: response.user });
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('float_token', response.token);
      localStorage.setItem('float_user', JSON.stringify(response.user));
    }
  }
}
