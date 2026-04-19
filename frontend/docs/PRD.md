# PRD: FLOAT Banking Interface (Angular)

1. Project Overview
Project Name: FLOAT (formerly Antigravity)

Objective: Build a high-integrity, reactive banking dashboard using Angular 18+. The frontend must strictly adhere to CQRS principles—separating "Commands" (money movement) from "Queries" (data visualization).

2. Technical Stack
Framework: Angular (using Signals for state management).

Styling: Tailwind CSS + Lucide Icons.

Communication: REST/JSON via the Go API Gateway (acting as a BFF for gRPC).

Safety: Strict TypeScript interfaces mirroring the ledger.proto contract.

3. Core Requirements & Page Specifications
A. Authentication Page (/login)
Purpose: Secure entry point via OAuth2.

Functionality:

Form validation for email/password.

Storage of JWT in a secure HttpOnly cookie or localStorage (for dev).

Route guarding to prevent unauthenticated access to the dashboard.

B. Main Dashboard (/dashboard) - The "Query" Side
Purpose: Fast, read-optimized view of the user's financial status.

Data Source: Fetched from the Gateway (originating from MongoDB).

Components:

Balance Card: Reactive display of "Last Known Balance."

Transaction Feed: Infinite scroll or paginated list of activities (Credits/Debits).

Real-time Updates: Integration points for WebSockets/SSE to update when the Python Bot finishes projecting events.

C. Transfer Page (/transfer) - The "Command" Side
Purpose: Critical path for moving money.

Data Source: Sends data to the Gateway (destined for CockroachDB).

Crucial Logic:

Idempotency: The UI must generate a UUID v4 as an idempotencyKey upon component initialization or button click to prevent double-charging.

Optimistic UI: (Optional) Update the local Signal balance immediately while the gRPC call is pending.

4. Data Models (TypeScript)
TypeScript
/** * Matches the 'LedgerEvent' and 'Transaction' logic 
 */
export interface Transaction {
  id: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  description: string;
  createdAt: Date;
}

export interface UserAccount {
  id: string;
  fullName: string;
  balance: number;
  currency: string;
}

/** * Matches the Protobuf 'TransferRequest' 
 */
export interface TransferCommand {
  toAccountId: string;
  amount: number;
  description: string;
  idempotencyKey: string; // Required for system integrity
}

5. Architectural Non-Functionals
Strict Typing: No any types allowed; every API response must be mapped to an interface.

Interceptor Logic: A global AuthInterceptor to inject Bearer tokens into headers.

Error Handling: Specific handling for "Insufficient Funds" vs. "Network Error" to provide user-friendly feedback.

Signal-Based State: Use Angular Signals to ensure the UI remains performant without unnecessary change detection cycles.