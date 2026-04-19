import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LucideLogIn, LucideMail, LucideLock, LucideLoader2 } from '@lucide/angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, LucideLogIn, LucideMail, LucideLock, LucideLoader2],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-[#1E1B4B] overflow-hidden relative">
      <!-- Background Decorations -->
      <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#10B981] opacity-10 blur-[120px] rounded-full"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500 opacity-10 blur-[120px] rounded-full"></div>

      <div class="w-full max-w-md p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl relative z-10 animate-in fade-in zoom-in duration-500">
        <div class="text-center mb-10">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-[#10B981] rounded-2xl mb-4 shadow-lg shadow-emerald-500/20">
             <svg lucideLogIn class="w-8 h-8 text-white"></svg>
          </div>
          <h1 class="text-3xl font-bold text-white tracking-tight">FLOAT</h1>
          <p class="text-indigo-200/60 mt-2">Next-Gen Banking Interface</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">
          <div class="space-y-2">
            <label class="text-sm font-medium text-indigo-200/80 ml-1">Email Address</label>
            <div class="relative group">
              <svg lucideMail class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300/40 group-focus-within:text-[#10B981] transition-colors"></svg>
              <input 
                type="email" 
                formControlName="email"
                placeholder="name@example.com"
                class="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-indigo-300/20 focus:outline-none focus:ring-2 focus:ring-[#10B981]/50 focus:border-[#10B981] transition-all"
              />
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-indigo-200/80 ml-1">Password</label>
            <div class="relative group">
              <svg lucideLock class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300/40 group-focus-within:text-[#10B981] transition-colors"></svg>
              <input 
                type="password" 
                formControlName="password"
                placeholder="••••••••"
                class="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-indigo-300/20 focus:outline-none focus:ring-2 focus:ring-[#10B981]/50 focus:border-[#10B981] transition-all"
              />
            </div>
          </div>

          <button 
            type="submit" 
            [disabled]="loginForm.invalid || isLoading()"
            class="w-full bg-[#10B981] hover:bg-[#059669] disabled:bg-emerald-900/50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
          >
            <svg *ngIf="isLoading()" lucideLoader2 class="w-5 h-5 animate-spin"></svg>
            {{ isLoading() ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="mt-8 text-center">
          <a routerLink="/register" class="text-sm text-indigo-200/40 hover:text-[#10B981] transition-colors">
            Don't have an account? Sign Up
          </a>
        </div>

        <p class="text-center mt-6 text-sm text-indigo-200/40">
          Secure, Authoritative Ledger access
        </p>

        <div *ngIf="errorMessage()" class="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm animate-in slide-in-from-top-4">
          {{ errorMessage() }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes zoom-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .animate-in { animation: 0.5s ease-out forwards; }
    .fade-in { animation-name: fade-in; }
    .zoom-in { animation-name: zoom-in; }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]]
  });

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      const { email, password } = this.loginForm.value;

      this.authService.login(email!, password!).subscribe({
        next: () => {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
          this.router.navigateByUrl(returnUrl);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set('Invalid credentials. Please try again.');
        }
      });
    }
  }
}
