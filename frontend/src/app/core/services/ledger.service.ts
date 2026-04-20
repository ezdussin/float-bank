import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AccountSummary, DashboardData, Transaction, TransferCommand } from '../models/ledger.models';

@Injectable({
  providedIn: 'root'
})
export class LedgerService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/v1';

  // State Management via Signals
  private accountState = signal<AccountSummary | null>(null);
  private transactionsState = signal<Transaction[]>([]);
  private loadingState = signal<boolean>(false);

  // Computed signals
  account = computed(() => this.accountState());
  transactions = computed(() => this.transactionsState());
  isLoading = computed(() => this.loadingState());
  balance = computed(() => this.accountState()?.balance ?? 0);
  monthlyVariance = computed(() => this.accountState()?.monthly_variance ?? 0);

  fetchDashboard() {
    this.loadingState.set(true);

    return this.http.get<DashboardData>(`${this.baseUrl}/dashboard`, { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).pipe(
      tap(data => {
        console.log(data)
        this.transactionsState.set(data?.recent_transactions || []);
        this.accountState.set(data.account);
        this.loadingState.set(false);
      }),
      catchError(error => {
        this.loadingState.set(false);
        console.error('Failed to fetch dashboard data', error);
        return throwError(() => error);
      })
    );
  }

  transfer(command: TransferCommand) {
    return this.http.post<{ success: boolean; transaction_id: string }>(`${this.baseUrl}/transfer`, command).pipe(
      tap(response => {
        if (response.success) {
          // WebSocket would handle the update
          setTimeout(() => {
            if (this.accountState()?.id) {
              this.fetchDashboard().subscribe();
            }
          }, 1000);
        }
      })
    );
  }
}
