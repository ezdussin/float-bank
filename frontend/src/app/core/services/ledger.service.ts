import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { of, throwError } from 'rxjs';
import { Transaction, UserAccount, TransferCommand } from '../models/ledger.models';

@Injectable({
  providedIn: 'root'
})
export class LedgerService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080';

  // State Management via Signals
  private accountState = signal<UserAccount | null>(null);
  private transactionsState = signal<Transaction[]>([]);
  private loadingState = signal<boolean>(false);

  // Computed signals
  account = computed(() => this.accountState());
  transactions = computed(() => this.transactionsState());
  isLoading = computed(() => this.loadingState());
  balance = computed(() => this.accountState()?.balance ?? 0);

  fetchDashboardData(accountId: string) {
    this.loadingState.set(true);
    
    // In a CQRS architecture, we query the read-optimized views
    // Assuming the Gateway has these endpoints
    return this.http.get<{ account: UserAccount; transactions: Transaction[] }>(`${this.baseUrl}/query/dashboard/${accountId}`).pipe(
      tap(data => {
        this.accountState.set(data.account);
        this.transactionsState.set(data.transactions);
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
    // Command side: communicates with the authoritative ledger
    return this.http.post<{ success: boolean; transaction_id: string }>(`${this.baseUrl}/command/transfer`, command).pipe(
      tap(response => {
        if (response.success) {
          // Optimistic update could go here, or we wait for the WebSocket event
          // For now, let's just trigger a re-fetch of the balance/transactions
          // after a short delay to allow the projection to finish
          setTimeout(() => {
            if (this.accountState()?.id) {
              this.fetchDashboardData(this.accountState()!.id).subscribe();
            }
          }, 1000);
        }
      })
    );
  }
}
