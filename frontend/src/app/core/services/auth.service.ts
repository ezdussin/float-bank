import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthResponse } from '../models/ledger.models';
import { CookieService } from './cookie.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private cookieService = inject(CookieService);
  private readonly baseUrl = 'http://localhost:8080/api/v1';

  // Signals for state management
  private authState = signal<{ token: string | null; user: AuthResponse['user'] | null }>({
    token: this.cookieService.get('float_token'),
    user: JSON.parse(this.cookieService.get('float_user') || 'null')
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
    this.cookieService.delete('float_token');
    this.cookieService.delete('float_user');
    this.router.navigate(['/login']);
  }

  private setSession(response: AuthResponse) {
    this.authState.set({ token: response.token, user: response.user });
    this.cookieService.set('float_token', response.token, 7); // Set for 7 days
    this.cookieService.set('float_user', JSON.stringify(response.user), 7);
  }
}
