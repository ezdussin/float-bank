import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideUser, LucideLogOut, LucideWallet, LucideArrowUpRight,
  LucideSend, LucideHistory, LucideChevronRight, LucideLoader2, LucideArrowDownLeft
} from '@lucide/angular';
import { LedgerService } from '../../core/services/ledger.service';
import { AuthService } from '../../core/services/auth.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    LucideUser, LucideLogOut, LucideWallet, LucideArrowUpRight,
    LucideSend, LucideHistory, LucideChevronRight, LucideLoader2, LucideArrowDownLeft
  ],
  template: `
    <div class="min-h-screen bg-[#0F172A] text-white p-4 lg:p-8">
      <div class="max-w-7xl mx-auto space-y-8">
        <!-- Header -->
        <header class="flex justify-between items-center animate-in fade-in duration-500">
          <div>
            <h1 class="text-2xl font-bold tracking-tight">Financial Overview</h1>
            <p class="text-slate-400 text-sm mt-1">Welcome back, {{ authService.currentUser()?.full_name }}</p>
          </div>
          <div class="flex items-center gap-4">
            <button class="bg-slate-800/50 p-3 rounded-2xl hover:bg-slate-800 transition-colors border border-white/5 relative">
               <svg lucideUser class="w-5 h-5 text-indigo-300"></svg>
            </button>
            <button (click)="authService.logout()" class="bg-red-500/10 p-3 rounded-2xl hover:bg-red-500/20 transition-colors border border-red-500/10">
               <svg lucideLogOut class="w-5 h-5 text-red-400"></svg>
            </button>
          </div>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Left Column: Balance & Quick Actions -->
          <div class="lg:col-span-1 space-y-6 animate-in slide-in-from-left duration-700">
            <!-- Balance Card -->
            <div class="bg-gradient-to-br from-[#1E1B4B] to-indigo-950 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group border border-white/5">
              <div class="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform duration-500">
                <svg lucideWallet class="w-24 h-24 text-emerald-400"></svg>
              </div>
              
              <div class="relative z-10">
                <p class="text-indigo-200/60 text-sm font-medium uppercase tracking-wider mb-2">Total Balance</p>
                <div class="flex items-baseline gap-2">
                  <span class="text-5xl font-bold tracking-tighter">
                    {{ ledgerService.balance() | currency:'USD':'symbol':'1.2-2' }}
                  </span>
                </div>
                
                <div class="mt-8 flex items-center gap-4">
                  <div class="{{ ledgerService.monthlyVariance() < 0 ? 'bg-red-500/10' : 'bg-emerald-500/10' }} px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                    <svg lucideArrowUpRight class="w-4 h-4 {{ ledgerService.monthlyVariance() < 0 ? 'text-red-400' : 'text-emerald-400' }}"></svg>
                    <span class="text-xs {{ ledgerService.monthlyVariance() < 0 ? 'text-red-400' : 'text-emerald-400' }} font-semibold">{{ledgerService.monthlyVariance()}}%</span>
                  </div>
                  <span class="text-xs text-indigo-200/40">From last month</span>
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="bg-white/5 p-6 rounded-[2rem] border border-white/5 backdrop-blur-md">
              <h3 class="text-sm font-semibold text-indigo-200/60 uppercase tracking-widest mb-4">Quick Commands</h3>
              <div class="grid grid-cols-2 gap-4">
                <a routerLink="/transfer" class="bg-[#10B981] hover:bg-[#059669] p-4 rounded-2xl flex flex-col items-center gap-3 transition-all shadow-lg shadow-emerald-500/10">
                  <svg lucideSend class="w-6 h-6 text-white"></svg>
                  <span class="text-sm font-medium">Transfer</span>
                </a>
                <button class="bg-indigo-600 hover:bg-indigo-500 p-4 rounded-2xl flex flex-col items-center gap-3 transition-all">
                  <svg lucideHistory class="w-6 h-6 text-white"></svg>
                  <span class="text-sm font-medium">Activity</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Right Column: Transaction Feed -->
          <div class="lg:col-span-2 animate-in slide-in-from-bottom duration-700">
            <div class="bg-white/5 rounded-[2.5rem] border border-white/5 backdrop-blur-xl h-full flex flex-col">
              <div class="p-8 border-b border-white/5 flex justify-between items-center">
                <h2 class="text-xl font-bold">Recent Transactions</h2>
                <button class="text-[#10B981] text-sm font-medium hover:underline flex items-center gap-1">
                  View All <svg lucideChevronRight class="w-4 h-4"></svg>
                </button>
              </div>
              
              <div class="flex-1 overflow-y-auto max-h-[500px] p-4 space-y-2">
                <div *ngIf="ledgerService.isLoading()" class="flex flex-col items-center justify-center h-full py-12 gap-4">
                   <svg lucideLoader2 class="w-10 h-10 text-emerald-400 animate-spin"></svg>
                   <p class="text-indigo-200/40 animate-pulse">Querying Authoritative Ledger...</p>
                </div>

                <div *ngFor="let tx of ledgerService.transactions()" class="group flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5">
                  <div class="flex items-center gap-4">
                    <div [class]="tx.type === 'CREDIT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'" class="w-12 h-12 rounded-xl flex items-center justify-center">
                      <svg *ngIf="tx.type === 'CREDIT'" lucideArrowDownLeft class="w-6 h-6"></svg>
                      <svg *ngIf="tx.type !== 'CREDIT'" lucideArrowUpRight class="w-6 h-6"></svg>
                    </div>
                    <div>
                      <p class="font-semibold text-slate-100">{{ tx.description }}</p>
                      <p class="text-xs text-indigo-300/40">{{ tx.createdAt | date:'medium' }}</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p [class]="tx.type === 'CREDIT' ? 'text-emerald-400' : 'text-slate-100'" class="font-bold text-lg">
                      {{ tx.type === 'CREDIT' ? '+' : '-' }}{{ tx.amount | currency }}
                    </p>
                    <span [class]="getStatusClass(tx.status)" class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                      {{ tx.status }}
                    </span>
                  </div>
                </div>

                <div *ngIf="!ledgerService.isLoading() && ledgerService.transactions().length === 0" class="flex flex-col items-center justify-center h-full py-12 text-indigo-200/20">
                   <svg lucideHistory class="w-12 h-12 mb-4 opacity-10"></svg>
                   <p>No activity recorded yet</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slide-in-left { from { transform: translateX(-20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slide-in-bottom { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .animate-in { animation: 0.6s ease-out forwards; }
    .fade-in { animation-name: fade-in; }
    .slide-in-from-left { animation-name: slide-in-left; }
    .slide-in-from-bottom { animation-name: slide-in-bottom; }
    
    /* Custom scrollbar for transaction feed */
    .overflow-y-auto::-webkit-scrollbar { width: 4px; }
    .overflow-y-auto::-webkit-scrollbar-track { background: transparent; }
    .overflow-y-auto::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
  `]
})
export class DashboardComponent implements OnInit {
  ledgerService = inject(LedgerService);
  authService = inject(AuthService);

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user?.email) {
      this.ledgerService.fetchDashboard().subscribe();
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'SUCCESS': return 'bg-emerald-500/20 text-emerald-400';
      case 'PENDING': return 'bg-amber-500/20 text-amber-400';
      case 'FAILED': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  }
}
