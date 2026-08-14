export type PaymentMethod = 'bKash' | 'Nagad' | 'Cash' | 'Bank Transfer' | 'Card' | 'Other';

export type PaymentStatus = 'PAID' | 'PARTIALLY PAID' | 'OVERDUE' | 'UNPAID';

export interface Physiotherapist {
  id: string;
  name: string;
  title: string;
  phone: string;
  email: string;
  avatarUrl: string;
  commissionRate: number; // e.g. 25 for 25%
  status: 'ACTIVE' | 'INACTIVE';
  dateJoined: string;
  notes?: string;
}

export interface Package {
  id: string;
  name: string;
  description: string;
  sessionCount: number;
  price: number;
  isActive: boolean;
}

export interface Payment {
  id: string;
  clientId: string;
  physiotherapistId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
  commissionRateSnapshot: number; // Commission rate at time of payment
  commissionAmount: number; // Calculated commission amount
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string; // e.g., FR-2026-0001
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gender?: 'Male' | 'Female' | 'Other';
  enrollmentDate: string; // YYYY-MM-DD
  physiotherapistId: string;
  packageId: string;
  packageName: string;
  packagePrice: number;
  discount: number;
  finalAmount: number; // packagePrice - discount
  status: PaymentStatus;
  notes?: string;
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionSettlement {
  id: string;
  physiotherapistId: string;
  amount: number;
  settlementDate: string;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
  createdAt: string;
}

export interface ReportingPeriod {
  id: string;
  name: string; // e.g., "July 26 – Aug 25, 2026"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isCurrent: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  previousValue?: string;
  newValue?: string;
}

export interface CloudBackupConfig {
  googleDriveConnected: boolean;
  googleDriveAccount?: string;
  dropboxConnected: boolean;
  dropboxAccount?: string;
  autoBackup: boolean;
  lastBackupDate?: string;
  lastBackupStatus?: 'SUCCESS' | 'FAILED' | 'PENDING';
}

export type RecycleBinType = 'client' | 'staff' | 'payment' | 'package';

export interface RecycleBinItem {
  id: string;
  type: RecycleBinType;
  title: string;
  subtitle: string;
  deletedAt: string; // ISO string
  data: Client | Physiotherapist | Payment | Package;
  relatedPayments?: Payment[];
}

export type ViewTab = 'dashboard' | 'clients' | 'payments' | 'reports' | 'more' | 'staff';
