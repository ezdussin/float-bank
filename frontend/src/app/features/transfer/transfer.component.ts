import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LedgerService } from '../../core/services/ledger.service';
import { AuthService } from '../../core/services/auth.service';
import { 
  LucideArrowDownLeft, LucideWallet, LucideUser, LucideLock, 
  LucideLoader2, LucideSend 
} from '@lucide/angular';
import { v4 as uuid } from 'uuid';

@Component({
  selector: 'app-transfer',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterLink,
    LucideArrowDownLeft, LucideWallet, LucideUser, LucideLock, 
    LucideLoader2, LucideSend
  ],
  template: `
    <div class="min-h-screen bg-[#0F172A] text-white p-4 lg:p-8">
      <div class="max-w-2xl mx-auto">
        <!-- Header -->
        <header class="flex items-center gap-4 mb-10 animate-in fade-in duration-500">
          <a routerLink="/dashboard" class="bg-slate-800/50 p-3 rounded-2xl hover:bg-slate-800 transition-colors border border-white/5">
             <svg lucideArrowDownLeft class="w-5 h-5 text-indigo-300 rotate-45"></svg>
          </a>
          <div>
            <h1 class="text-2xl font-bold tracking-tight">Move Funds</h1>
            <p class="text-slate-400 text-sm">Initiate a secure ledger command</p>
          </div>
        </header>

        <!-- Transfer Card -->
        <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 lg:p-12 shadow-2xl animate-in zoom-in duration-500">
          <form [formGroup]="transferForm" (ngSubmit)="onSubmit()" class="space-y-8">
            
            <!-- From Account (Read-only) -->
            <div class="space-y-3">
              <label class="text-sm font-semibold text-indigo-300/40 uppercase tracking-widest px-2">Source Account</label>
              <div class="bg-indigo-950/30 border border-white/5 rounded-3xl p-6 flex justify-between items-center">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center">
                    <svg lucideWallet class="w-6 h-6 text-indigo-400"></svg>
                  </div>
                  <div>
                    <p class="font-bold">Authoritative Account</p>
                    <p class="text-xs text-indigo-300/40">ID: {{ authService.currentUser()?.id }}</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-xs text-indigo-300/40 uppercase font-bold">Available</p>
                  <p class="text-xl font-bold text-emerald-400">{{ ledgerService.balance() | currency }}</p>
                </div>
              </div>
            </div>

            <!-- To Account -->
            <div class="space-y-3">
              <label class="text-sm font-semibold text-indigo-300/40 uppercase tracking-widest px-2">Destination Account ID</label>
              <div class="relative group">
                <svg lucideUser class="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300/40 group-focus-within:text-[#10B981] transition-colors"></svg>
                <input 
                  type="text" 
                  formControlName="toAccountId"
                  placeholder="e.g. ACC-77821-X"
                  class="w-full bg-white/5 border border-white/10 rounded-3xl py-6 pl-14 pr-6 text-white placeholder:text-indigo-300/20 focus:outline-none focus:ring-2 focus:ring-[#10B981]/50 focus:border-[#10B981] transition-all font-mono"
                />
              </div>
            </div>

            <!-- Amount -->
            <div class="space-y-3">
              <label class="text-sm font-semibold text-indigo-300/40 uppercase tracking-widest px-2">Amount (USD)</label>
              <div class="relative group">
                <span class="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-indigo-300/40 group-focus-within:text-white transition-colors">$</span>
                <input 
                  type="number" 
                  formControlName="amount"
                  placeholder="0.00"
                  class="w-full bg-white/5 border border-white/10 rounded-3xl py-6 pl-12 pr-6 text-3xl font-bold text-white placeholder:text-indigo-300/20 focus:outline-none focus:ring-2 focus:ring-[#10B981]/50 focus:border-[#10B981] transition-all"
                />
              </div>
            </div>

            <!-- Description -->
            <div class="space-y-3">
              <label class="text-sm font-semibold text-indigo-300/40 uppercase tracking-widest px-2">Description</label>
              <input 
                type="text" 
                formControlName="description"
                placeholder="What's this for?"
                class="w-full bg-white/5 border border-white/10 rounded-3xl py-6 px-6 text-white placeholder:text-indigo-300/20 focus:outline-none focus:ring-2 focus:ring-[#10B981]/50 focus:border-[#10B981] transition-all"
              />
            </div>

            <!-- Idempotency Info -->
            <div class="flex items-center gap-2 px-2 text-[10px] text-indigo-300/20 font-mono uppercase">
              <svg lucideLock class="w-3 h-3"></svg>
              Idempotency Key: {{ idempotencyKey() }}
            </div>

            <!-- Submit Button -->
            <button 
              type="submit" 
              [disabled]="transferForm.invalid || isLoading() || (transferForm.get('amount')?.value || 0) > ledgerService.balance()"
              class="w-full bg-[#10B981] hover:bg-[#059669] disabled:bg-emerald-900/50 disabled:cursor-not-allowed text-white font-bold py-6 rounded-3xl shadow-2xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 text-lg"
            >
              <svg *ngIf="isLoading()" lucideLoader2 class="w-6 h-6 animate-spin"></svg>
              {{ isLoading() ? 'Proposing Command...' : 'Authorize Transfer' }}
            </button>
          </form>

          <div *ngIf="successMessage()" class="mt-8 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl text-emerald-400 text-center animate-in slide-in-from-top-4">
             <svg lucideSend class="w-12 h-12 mx-auto mb-4"></svg>
             <p class="font-bold text-xl">Transfer Success</p>
             <p class="text-sm opacity-60 mt-1">{{ successMessage() }}</p>
             <button (click)="resetForm()" class="mt-4 text-emerald-400/60 hover:text-emerald-400 text-sm font-bold uppercase tracking-widest">New Transfer</button>
          </div>

          <div *ngIf="errorMessage()" class="mt-8 p-6 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-400 text-center animate-in slide-in-from-top-4">
             <p class="font-bold">Transaction Failed</p>
             <p class="text-sm opacity-60 mt-1">{{ errorMessage() }}</p>
          </div>
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
    input[type=number]::-webkit-inner-spin-button, 
    input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  `]
})
export class TransferComponent implements OnInit {
  private fb = inject(FormBuilder);
  ledgerService = inject(LedgerService);
  authService = inject(AuthService);
  private router = inject(Router);

  transferForm = this.fb.group({
    toAccountId: ['', [Validators.required]],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    description: ['', [Validators.required, Validators.minLength(3)]]
  });

  isLoading = signal(false);
  idempotencyKey = signal('');
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  ngOnInit() {
    this.generateIdempotencyKey();

    // Ensure we have current data
    const user = this.authService.currentUser();
    if (user?.id) {
      this.ledgerService.fetchDashboardData(user.id).subscribe();
    }
  }

  generateIdempotencyKey() {
    this.idempotencyKey.set(uuid());
  }

  onSubmit() {
    if (this.transferForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      const command = {
        ...this.transferForm.value,
        idempotencyKey: this.idempotencyKey()
      } as any;

      this.ledgerService.transfer(command).subscribe({
        next: (res: any) => {
          this.isLoading.set(false);
          this.successMessage.set(`Transaction ID: ${res.transaction_id}`);
          this.transferForm.disable();
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.message || 'Ledger rejected command. Verify funds and account ID.');
        }
      });
    }
  }

  resetForm() {
    this.transferForm.enable();
    this.transferForm.reset();
    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.generateIdempotencyKey();
  }
}
