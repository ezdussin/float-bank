/**
 * Matches the 'LedgerEvent' and 'Transaction' logic from the PRD and Ledger Proto.
 */
export interface Transaction {
  id: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  description: string;
  createdAt: Date | string;
}

export interface UserAccount {
  id: string;
  fullName: string;
  balance: number;
  currency: string;
}

/**
 * Matches the Protobuf 'TransferRequest'
 */
export interface TransferCommand {
  toAccountId: string;
  amount: number;
  description: string;
  idempotencyKey: string; // Required for system integrity
}

export interface AuthResponse {
  token: string;
  user: {
    // id: string;
    full_name: string;
    email: string;
  };
}
