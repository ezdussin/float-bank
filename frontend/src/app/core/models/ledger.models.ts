/**
 * Matches the 'LedgerEvent' and 'Transaction' logic from the PRD and Ledger Proto.
 */
export type TransactionType = 'CREDIT' | 'DEBIT';
export type TransactionStatus = 'SUCCESS' | 'PENDING' | 'FAILED';

export interface Transaction {
  id: string;
  user_id?: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description: string;
  createdAt: Date | string;
  receiver_email: string;
}

export interface AccountSummary {
  id: string;
  fullName: string;
  balance: number;
  currency: string;
  monthly_variance: number;
}

export interface DashboardData {
  user_id: string;
  account: AccountSummary;
  recent_transactions?: Transaction[];
  updated_at: Date | string;
}

/**
 * Matches the Protobuf 'TransferRequest'
 */
export interface TransferCommand {
  receiver_email: string;
  amount: number;
  description: string;
  type: string;
}

export interface AuthResponse {
  token: string;
  user: {
    // id: string;
    full_name: string;
    email: string;
  };
}
