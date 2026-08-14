import {
  Client,
  Payment,
  PaymentMethod,
  Physiotherapist,
  Package,
  CommissionSettlement,
  ReportingPeriod,
  AuditLog,
  CloudBackupConfig,
  RecycleBinItem,
} from '../types';
import {
  getCommissionMonthMetadata,
  getStandardCommissionMonths,
  commissionMonthToReportingPeriod,
  getCurrentRealtimeMonthKey,
} from './commissionRules';

const STORAGE_KEYS = {
  PHYSIOTHERAPISTS: 'fitback_physiotherapists_v1',
  CLIENTS: 'fitback_clients_v1',
  PACKAGES: 'fitback_packages_v1',
  PAYMENTS: 'fitback_payments_v1',
  SETTLEMENTS: 'fitback_settlements_v1',
  REPORTING_PERIODS: 'fitback_periods_v1',
  CURRENT_PERIOD: 'fitback_current_period_v1',
  AUDIT_LOGS: 'fitback_audit_logs_v1',
  CLOUD_CONFIG: 'fitback_cloud_config_v1',
  RECYCLE_BIN: 'fitback_recycle_bin_v1',
};

// Initial Seed Data
const DEFAULT_PHYSIOTHERAPISTS: Physiotherapist[] = [
  {
    id: 'physio-1',
    name: 'Farhana Jahan',
    title: 'Senior Physiotherapist',
    phone: '01711223344',
    email: 'farhana@fitbackreset.com',
    avatarUrl:
      'https://images.unsplash.com/photo-1594824813566-78a933f38f15?w=200&auto=format&fit=crop&q=80',
    commissionRate: 25,
    status: 'ACTIVE',
    dateJoined: '2025-01-15',
    notes: 'Specializes in spine and neck rehabilitation.',
  },
  {
    id: 'physio-2',
    name: 'Dr. Ariful Islam',
    title: 'Consulting Physician',
    phone: '01811223344',
    email: 'ariful@fitbackreset.com',
    avatarUrl:
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80',
    commissionRate: 30,
    status: 'ACTIVE',
    dateJoined: '2025-03-01',
    notes: 'Consulting specialist for complex musculoskeletal rehab.',
  },
  {
    id: 'physio-3',
    name: 'Sarah Jenkins',
    title: 'Occupational Therapist',
    phone: '01911223344',
    email: 'sarah.j@fitbackreset.com',
    avatarUrl:
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&auto=format&fit=crop&q=80',
    commissionRate: 20,
    status: 'ACTIVE',
    dateJoined: '2025-06-10',
    notes: 'Focus on ergonomic posture correction and mobility.',
  },
  {
    id: 'physio-4',
    name: 'Michael Chang',
    title: 'Sports Massage Therapist',
    phone: '01611223344',
    email: 'michael@fitbackreset.com',
    avatarUrl:
      'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&auto=format&fit=crop&q=80',
    commissionRate: 20,
    status: 'ACTIVE',
    dateJoined: '2025-08-01',
    notes: 'Sports injury specialist and deep tissue therapy.',
  },
];

const DEFAULT_PACKAGES: Package[] = [
  {
    id: 'pkg-1',
    name: 'Initial Assessment',
    description: 'Comprehensive physical diagnosis and 1st therapy session.',
    sessionCount: 1,
    price: 3000,
    isActive: true,
  },
  {
    id: 'pkg-2',
    name: '10 Session Package',
    description: 'Targeted recovery plan across 10 structured sessions.',
    sessionCount: 10,
    price: 10000,
    isActive: true,
  },
  {
    id: 'pkg-3',
    name: 'Post-Op Rehab',
    description: 'Intensive surgical recovery physiotherapy.',
    sessionCount: 12,
    price: 12000,
    isActive: true,
  },
  {
    id: 'pkg-4',
    name: 'Premium Rehab',
    description: 'Advanced sports & posture recovery package.',
    sessionCount: 15,
    price: 15000,
    isActive: true,
  },
  {
    id: 'pkg-5',
    name: 'Monthly Rehabilitation',
    description: 'Full monthly access with unlimited supervised sessions.',
    sessionCount: 20,
    price: 20000,
    isActive: true,
  },
];

const DEFAULT_CLIENTS: Client[] = [
  {
    id: 'FR-2026-0001',
    name: 'Ahmed Rahman',
    phone: '01712345678',
    email: 'ahmed.rahman@gmail.com',
    gender: 'Male',
    enrollmentDate: '2026-08-04',
    physiotherapistId: 'physio-1',
    packageId: 'pkg-2',
    packageName: '10 Session Package',
    packagePrice: 10000,
    discount: 0,
    finalAmount: 10000,
    status: 'PARTIALLY PAID',
    notes: 'Lumbar spine stiffness. Enrolled in 10-session package. Partial payment made.',
    createdAt: '2026-08-04T09:00:00Z',
    updatedAt: '2026-08-12T14:30:00Z',
  },
  {
    id: 'FR-2026-0002',
    name: 'Sarah Jenkins',
    phone: '01898765432',
    email: 's.jenkins@outlook.com',
    gender: 'Female',
    enrollmentDate: '2026-08-02',
    physiotherapistId: 'physio-1',
    packageId: 'pkg-3',
    packageName: 'Post-Op Rehab',
    packagePrice: 12000,
    discount: 0,
    finalAmount: 12000,
    status: 'PAID',
    notes: 'Knee arthroscopy rehabilitation. Fully paid on Aug 2, 2026.',
    createdAt: '2026-08-02T10:00:00Z',
    updatedAt: '2026-08-02T10:00:00Z',
  },
  {
    id: 'FR-2026-0003',
    name: 'Marcus Rossi',
    phone: '01922334455',
    email: 'marcus.m@yahoo.com',
    gender: 'Male',
    enrollmentDate: '2026-07-28',
    physiotherapistId: 'physio-2',
    packageId: 'pkg-1',
    packageName: 'Initial Assessment',
    packagePrice: 3500,
    discount: 0,
    finalAmount: 3500,
    status: 'OVERDUE',
    notes: 'Shoulder impingement evaluation.',
    createdAt: '2026-07-28T11:00:00Z',
    updatedAt: '2026-07-28T11:00:00Z',
  },
  {
    id: 'FR-2026-0004',
    name: 'Fatima Begum',
    phone: '01633445566',
    email: 'fatima.b@gmail.com',
    gender: 'Female',
    enrollmentDate: '2026-08-10',
    physiotherapistId: 'physio-1',
    packageId: 'pkg-4',
    packageName: 'Premium Rehab',
    packagePrice: 15000,
    discount: 0,
    finalAmount: 15000,
    status: 'PARTIALLY PAID',
    notes: 'Cervical spondylosis physical recovery.',
    createdAt: '2026-08-10T09:30:00Z',
    updatedAt: '2026-08-10T09:30:00Z',
  },
  {
    id: 'FR-2026-0005',
    name: 'Tanvir Hossain',
    phone: '01544556677',
    email: 'tanvir@techcorp.bd',
    gender: 'Male',
    enrollmentDate: '2026-08-14',
    physiotherapistId: 'physio-2',
    packageId: 'pkg-5',
    packageName: 'Monthly Rehabilitation',
    packagePrice: 20000,
    discount: 0,
    finalAmount: 20000,
    status: 'PAID',
    notes: 'Full monthly athlete conditioning program. Fully paid on Aug 14, 2026.',
    createdAt: '2026-08-14T08:15:00Z',
    updatedAt: '2026-08-14T08:15:00Z',
  },
  {
    id: 'FR-2026-0006',
    name: 'Nasreen Akter',
    phone: '01755667788',
    email: 'nasreen.a@gmail.com',
    gender: 'Female',
    enrollmentDate: '2026-07-05',
    physiotherapistId: 'physio-1',
    packageId: 'pkg-2',
    packageName: '10 Session Package',
    packagePrice: 10000,
    discount: 0,
    finalAmount: 10000,
    status: 'PAID',
    notes: 'Sciatica pain management. Fully paid on July 25, 2026.',
    createdAt: '2026-07-05T10:00:00Z',
    updatedAt: '2026-07-25T16:00:00Z',
  },
  {
    id: 'FR-2026-0007',
    name: 'Rafiqul Islam',
    phone: '01866778899',
    email: 'rafiqul.i@gmail.com',
    gender: 'Male',
    enrollmentDate: '2026-07-12',
    physiotherapistId: 'physio-2',
    packageId: 'pkg-3',
    packageName: 'Post-Op Rehab',
    packagePrice: 12000,
    discount: 0,
    finalAmount: 12000,
    status: 'PAID',
    notes: 'Rotator cuff repair recovery. Fully paid on July 12, 2026.',
    createdAt: '2026-07-12T11:00:00Z',
    updatedAt: '2026-07-12T11:00:00Z',
  },
  {
    id: 'FR-2026-0008',
    name: 'Nadia Chowdhury',
    phone: '01977889900',
    email: 'nadia.c@gmail.com',
    gender: 'Female',
    enrollmentDate: '2026-06-20',
    physiotherapistId: 'physio-3',
    packageId: 'pkg-4',
    packageName: 'Premium Rehab',
    packagePrice: 15000,
    discount: 0,
    finalAmount: 15000,
    status: 'PAID',
    notes: 'Postural correction. Enrolled June 20, 2nd installment paid July 29, 2026.',
    createdAt: '2026-06-20T14:00:00Z',
    updatedAt: '2026-07-29T15:30:00Z',
  },
  {
    id: 'FR-2026-0009',
    name: 'Mahmud Hassan',
    phone: '01688990011',
    email: 'mahmud.h@gmail.com',
    gender: 'Male',
    enrollmentDate: '2026-06-02',
    physiotherapistId: 'physio-4',
    packageId: 'pkg-2',
    packageName: '10 Session Package',
    packagePrice: 10000,
    discount: 0,
    finalAmount: 10000,
    status: 'PAID',
    notes: 'Sports calf injury recovery. Fully paid June 22, 2026.',
    createdAt: '2026-06-02T09:00:00Z',
    updatedAt: '2026-06-22T10:00:00Z',
  },
];

const DEFAULT_PAYMENTS: Payment[] = [
  {
    id: 'pay-101',
    clientId: 'FR-2026-0001',
    physiotherapistId: 'physio-1',
    amount: 5000,
    paymentDate: '2026-08-04',
    paymentMethod: 'Cash',
    reference: 'RECEIPT-1001',
    notes: 'Initial payment upon enrollment',
    commissionRateSnapshot: 25,
    commissionAmount: 1250,
    createdAt: '2026-08-04T09:15:00Z',
    updatedAt: '2026-08-04T09:15:00Z',
  },
  {
    id: 'pay-102',
    clientId: 'FR-2026-0001',
    physiotherapistId: 'physio-1',
    amount: 3000,
    paymentDate: '2026-08-12',
    paymentMethod: 'bKash',
    reference: 'BK89231082',
    notes: 'Second installment via bKash',
    commissionRateSnapshot: 25,
    commissionAmount: 750,
    createdAt: '2026-08-12T14:30:00Z',
    updatedAt: '2026-08-12T14:30:00Z',
  },
  {
    id: 'pay-103',
    clientId: 'FR-2026-0002',
    physiotherapistId: 'physio-1',
    amount: 12000,
    paymentDate: '2026-08-02',
    paymentMethod: 'Bank Transfer',
    reference: 'EFT-883921',
    notes: 'Full package payment advance (Fully paid in August -> Sep 15 Commission)',
    commissionRateSnapshot: 25,
    commissionAmount: 3000,
    createdAt: '2026-08-02T10:10:00Z',
    updatedAt: '2026-08-02T10:10:00Z',
  },
  {
    id: 'pay-104',
    clientId: 'FR-2026-0004',
    physiotherapistId: 'physio-1',
    amount: 10000,
    paymentDate: '2026-08-10',
    paymentMethod: 'Nagad',
    reference: 'NGD-99812',
    notes: 'First installment',
    commissionRateSnapshot: 25,
    commissionAmount: 2500,
    createdAt: '2026-08-10T09:40:00Z',
    updatedAt: '2026-08-10T09:40:00Z',
  },
  {
    id: 'pay-105',
    clientId: 'FR-2026-0005',
    physiotherapistId: 'physio-2',
    amount: 20000,
    paymentDate: '2026-08-14',
    paymentMethod: 'bKash',
    reference: 'BK-771822',
    notes: 'Full payment via bKash (Fully paid in August -> Sep 15 Commission)',
    commissionRateSnapshot: 30,
    commissionAmount: 6000,
    createdAt: '2026-08-14T08:20:00Z',
    updatedAt: '2026-08-14T08:20:00Z',
  },
  // July 2026 Full Payments (Appear in August Report, Paid Aug 15)
  {
    id: 'pay-106',
    clientId: 'FR-2026-0006',
    physiotherapistId: 'physio-1',
    amount: 6000,
    paymentDate: '2026-07-05',
    paymentMethod: 'Cash',
    reference: 'REC-0705',
    notes: 'First installment on July 5',
    commissionRateSnapshot: 25,
    commissionAmount: 1500,
    createdAt: '2026-07-05T10:15:00Z',
    updatedAt: '2026-07-05T10:15:00Z',
  },
  {
    id: 'pay-107',
    clientId: 'FR-2026-0006',
    physiotherapistId: 'physio-1',
    amount: 4000,
    paymentDate: '2026-07-25',
    paymentMethod: 'bKash',
    reference: 'BK-JUL25',
    notes: 'Final settlement payment completing 10,000 (Fully paid July 25 -> Aug 15 Commission)',
    commissionRateSnapshot: 25,
    commissionAmount: 1000,
    createdAt: '2026-07-25T16:00:00Z',
    updatedAt: '2026-07-25T16:00:00Z',
  },
  {
    id: 'pay-108',
    clientId: 'FR-2026-0007',
    physiotherapistId: 'physio-2',
    amount: 12000,
    paymentDate: '2026-07-12',
    paymentMethod: 'Bank Transfer',
    reference: 'BT-88712',
    notes: 'Single full payment (Fully paid July 12 -> Aug 15 Commission)',
    commissionRateSnapshot: 30,
    commissionAmount: 3600,
    createdAt: '2026-07-12T11:10:00Z',
    updatedAt: '2026-07-12T11:10:00Z',
  },
  {
    id: 'pay-109',
    clientId: 'FR-2026-0008',
    physiotherapistId: 'physio-3',
    amount: 8000,
    paymentDate: '2026-06-20',
    paymentMethod: 'Card',
    reference: 'POS-0620',
    notes: 'Initial advance in June',
    commissionRateSnapshot: 20,
    commissionAmount: 1600,
    createdAt: '2026-06-20T14:10:00Z',
    updatedAt: '2026-06-20T14:10:00Z',
  },
  {
    id: 'pay-110',
    clientId: 'FR-2026-0008',
    physiotherapistId: 'physio-3',
    amount: 7000,
    paymentDate: '2026-07-29',
    paymentMethod: 'Nagad',
    reference: 'NG-0729',
    notes: 'Final settlement payment completing 15,000 (Fully paid July 29 -> Aug 15 Commission)',
    commissionRateSnapshot: 20,
    commissionAmount: 1400,
    createdAt: '2026-07-29T15:30:00Z',
    updatedAt: '2026-07-29T15:30:00Z',
  },
  // June 2026 Full Payments (Appear in July Report, Paid July 15)
  {
    id: 'pay-111',
    clientId: 'FR-2026-0009',
    physiotherapistId: 'physio-4',
    amount: 10000,
    paymentDate: '2026-06-22',
    paymentMethod: 'bKash',
    reference: 'BK-0622',
    notes: 'Full package fee payment (Fully paid June 22 -> July 15 Commission)',
    commissionRateSnapshot: 20,
    commissionAmount: 2000,
    createdAt: '2026-06-22T10:00:00Z',
    updatedAt: '2026-06-22T10:00:00Z',
  },
];

const DEFAULT_SETTLEMENTS: CommissionSettlement[] = [
  {
    id: 'stl-1',
    physiotherapistId: 'physio-1',
    amount: 5000,
    settlementDate: '2026-08-15',
    paymentMethod: 'Bank Transfer',
    reference: 'PAYROLL-AUG15',
    notes: 'August 15 Commission payout for July fully paid clients',
    createdAt: '2026-08-15T10:00:00Z',
  },
];

const DEFAULT_PERIODS: ReportingPeriod[] = getStandardCommissionMonths().map(commissionMonthToReportingPeriod);

const DEFAULT_CLOUD_CONFIG: CloudBackupConfig = {
  googleDriveConnected: false,
  dropboxConnected: false,
  autoBackup: true,
  lastBackupDate: '2026-08-13T02:00:00Z',
  lastBackupStatus: 'SUCCESS',
};

// Helper function to read/write JSON
function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    if (!data) return defaultValue;
    return JSON.parse(data) as T;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return defaultValue;
  }
}

function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
}

// Data Store Class
export class AppStorage {
  // Physiotherapists
  static getPhysiotherapists(): Physiotherapist[] {
    return getStorageItem<Physiotherapist[]>(
      STORAGE_KEYS.PHYSIOTHERAPISTS,
      DEFAULT_PHYSIOTHERAPISTS
    );
  }

  static savePhysiotherapist(physio: Physiotherapist): void {
    const list = this.getPhysiotherapists();
    const idx = list.findIndex((p) => p.id === physio.id);
    if (idx >= 0) {
      list[idx] = physio;
    } else {
      list.push(physio);
    }
    setStorageItem(STORAGE_KEYS.PHYSIOTHERAPISTS, list);
    this.addAuditLog('Staff Updated', `Physiotherapist ${physio.name} updated/added`);
  }

  static deletePhysiotherapist(physioId: string, softDelete = true): void {
    const list = this.getPhysiotherapists();
    const physio = list.find((p) => p.id === physioId);
    if (!physio) return;

    if (softDelete) {
      const binItem: RecycleBinItem = {
        id: `bin-staff-${physio.id}-${Date.now()}`,
        type: 'staff',
        title: physio.name,
        subtitle: `${physio.title} • ${physio.commissionRate}% Commission Rate`,
        deletedAt: new Date().toISOString(),
        data: physio,
      };
      this.addToRecycleBin(binItem);
    }

    const filtered = list.filter((p) => p.id !== physioId);
    setStorageItem(STORAGE_KEYS.PHYSIOTHERAPISTS, filtered);

    // Unassign clients associated with deleted physiotherapist to avoid broken references
    const clients = this.getClients();
    let clientListUpdated = false;
    const updatedClients = clients.map((c) => {
      if (c.physiotherapistId === physioId) {
        clientListUpdated = true;
        return { ...c, physiotherapistId: '' };
      }
      return c;
    });

    if (clientListUpdated) {
      setStorageItem(STORAGE_KEYS.CLIENTS, updatedClients);
    }

    this.addAuditLog(
      softDelete ? 'Staff Moved to Recycle Bin' : 'Staff Deleted',
      `Physiotherapist ${physio.name} (${physioId}) ${softDelete ? 'moved to Recycle Bin' : 'permanently deleted'}`
    );
  }

  // Packages
  static getPackages(): Package[] {
    return getStorageItem<Package[]>(STORAGE_KEYS.PACKAGES, DEFAULT_PACKAGES);
  }

  static savePackage(pkg: Package): void {
    const list = this.getPackages();
    const idx = list.findIndex((p) => p.id === pkg.id);
    if (idx >= 0) {
      list[idx] = pkg;
    } else {
      list.push(pkg);
    }
    setStorageItem(STORAGE_KEYS.PACKAGES, list);
  }

  // Clients
  static getClients(): Client[] {
    return getStorageItem<Client[]>(STORAGE_KEYS.CLIENTS, DEFAULT_CLIENTS);
  }

  static getClientById(id: string): Client | undefined {
    return this.getClients().find((c) => c.id === id);
  }

  static generateNextClientId(): string {
    const clients = this.getClients();
    const year = new Date().getFullYear();
    const prefix = `FR-${year}-`;
    const numbers = clients
      .map((c) => {
        if (c.id.startsWith(prefix)) {
          const numStr = c.id.replace(prefix, '');
          return parseInt(numStr, 10) || 0;
        }
        return 0;
      })
      .filter((n) => n > 0);

    const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNum = maxNum + 1;
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  }

  static saveClient(client: Client): void {
    const list = this.getClients();
    const idx = list.findIndex((c) => c.id === client.id);
    if (idx >= 0) {
      list[idx] = { ...client, updatedAt: new Date().toISOString() };
    } else {
      list.unshift({ ...client, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    setStorageItem(STORAGE_KEYS.CLIENTS, list);
    this.recalculateClientStatus(client.id);
    this.addAuditLog('Client Record', `Client ${client.name} (${client.id}) saved`);
  }

  static deleteClient(clientId: string, softDelete = true): void {
    const list = this.getClients();
    const client = list.find((c) => c.id === clientId);
    if (!client) return;

    const allPayments = this.getPayments();
    const clientPayments = allPayments.filter((p) => p.clientId === clientId);

    if (softDelete) {
      const binItem: RecycleBinItem = {
        id: `bin-client-${client.id}-${Date.now()}`,
        type: 'client',
        title: `${client.name} (${client.id})`,
        subtitle: `${client.packageName} • ৳${client.finalAmount.toLocaleString()} (${clientPayments.length} payment records)`,
        deletedAt: new Date().toISOString(),
        data: client,
        relatedPayments: clientPayments,
      };
      this.addToRecycleBin(binItem);
    }

    const filteredClients = list.filter((c) => c.id !== clientId);
    setStorageItem(STORAGE_KEYS.CLIENTS, filteredClients);

    // Remove associated payments for deleted client
    const remainingPayments = allPayments.filter((p) => p.clientId !== clientId);
    setStorageItem(STORAGE_KEYS.PAYMENTS, remainingPayments);

    this.addAuditLog(
      softDelete ? 'Client Moved to Recycle Bin' : 'Client Deleted',
      `Client ${client.name} (${clientId}) ${softDelete ? 'moved to Recycle Bin' : 'permanently deleted'}`
    );
  }

  // Payments
  static getPayments(): Payment[] {
    return getStorageItem<Payment[]>(STORAGE_KEYS.PAYMENTS, DEFAULT_PAYMENTS);
  }

  static getPaymentsByClient(clientId: string): Payment[] {
    return this.getPayments()
      .filter((p) => p.clientId === clientId)
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }

  static addPayment(payment: Payment): void {
    const payments = this.getPayments();
    payments.unshift(payment);
    setStorageItem(STORAGE_KEYS.PAYMENTS, payments);
    this.recalculateClientStatus(payment.clientId);
    this.addAuditLog('Payment Added', `Added ৳${payment.amount} for client ${payment.clientId}`);
  }

  static updatePayment(payment: Payment): void {
    const payments = this.getPayments();
    const idx = payments.findIndex((p) => p.id === payment.id);
    if (idx >= 0) {
      const old = payments[idx];
      payments[idx] = { ...payment, updatedAt: new Date().toISOString() };
      setStorageItem(STORAGE_KEYS.PAYMENTS, payments);
      this.recalculateClientStatus(payment.clientId);
      this.addAuditLog('Payment Edited', `Updated payment ${payment.id}: ৳${old.amount} -> ৳${payment.amount}`);
    }
  }

  static deletePayment(paymentId: string, softDelete = true): void {
    const payments = this.getPayments();
    const p = payments.find((x) => x.id === paymentId);
    if (p) {
      if (softDelete) {
        const client = this.getClientById(p.clientId);
        const binItem: RecycleBinItem = {
          id: `bin-payment-${p.id}-${Date.now()}`,
          type: 'payment',
          title: `৳${p.amount.toLocaleString()} - ${p.paymentMethod}`,
          subtitle: `Client: ${client?.name || p.clientId} • Date: ${p.paymentDate}`,
          deletedAt: new Date().toISOString(),
          data: p,
        };
        this.addToRecycleBin(binItem);
      }

      const filtered = payments.filter((x) => x.id !== paymentId);
      setStorageItem(STORAGE_KEYS.PAYMENTS, filtered);
      this.recalculateClientStatus(p.clientId);
      this.addAuditLog(
        softDelete ? 'Payment Moved to Recycle Bin' : 'Payment Deleted',
        `Payment ${paymentId} (৳${p.amount}) ${softDelete ? 'moved to Recycle Bin' : 'permanently deleted'}`
      );
    }
  }

  // Quick Action: Mark Client Fully Paid
  static markClientFullyPaid(
    clientId: string,
    paymentMethod: PaymentMethod = 'Cash'
  ): { success: boolean; payment?: Payment; message: string; paidAmount: number } {
    const client = this.getClientById(clientId);
    if (!client) {
      return { success: false, message: 'Client not found', paidAmount: 0 };
    }

    const clientPayments = this.getPaymentsByClient(clientId);
    const totalPaidSoFar = clientPayments.reduce((sum, p) => sum + p.amount, 0);
    const dueAmount = Math.max(0, client.finalAmount - totalPaidSoFar);

    if (dueAmount > 0) {
      const physios = this.getPhysiotherapists();
      const physio = physios.find((p) => p.id === client.physiotherapistId);
      const commissionRate = physio?.commissionRate ?? 25;
      const commissionAmount = Math.round((dueAmount * commissionRate) / 100);
      const today = new Date().toISOString().split('T')[0];

      const newPayment: Payment = {
        id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        clientId: client.id,
        physiotherapistId: client.physiotherapistId,
        amount: dueAmount,
        paymentDate: today,
        paymentMethod,
        reference: 'Quick Full Settlement',
        notes: 'Quick action: Settled full outstanding balance',
        commissionRateSnapshot: commissionRate,
        commissionAmount,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.addPayment(newPayment);
      this.recalculateClientStatus(client.id);
      this.addAuditLog(
        'Quick Fully Paid',
        `Client ${client.name} (${client.id}) marked fully paid with ৳${dueAmount.toLocaleString()} (${paymentMethod})`
      );

      return {
        success: true,
        payment: newPayment,
        message: `Successfully recorded ৳${dueAmount.toLocaleString()} payment. ${client.name} is now Fully Paid!`,
        paidAmount: dueAmount,
      };
    } else {
      // Already 0 due, ensure status is PAID
      this.recalculateClientStatus(client.id);
      return {
        success: true,
        message: `${client.name} is already fully paid (0 due).`,
        paidAmount: 0,
      };
    }
  }

  // Recycle Bin Methods
  static getRecycleBin(): RecycleBinItem[] {
    return getStorageItem<RecycleBinItem[]>(STORAGE_KEYS.RECYCLE_BIN, []);
  }

  static addToRecycleBin(item: RecycleBinItem): void {
    const bin = this.getRecycleBin();
    bin.unshift(item);
    setStorageItem(STORAGE_KEYS.RECYCLE_BIN, bin);
  }

  static restoreFromRecycleBin(binItemId: string): { success: boolean; message: string } {
    const bin = this.getRecycleBin();
    const itemIdx = bin.findIndex((i) => i.id === binItemId);
    if (itemIdx < 0) {
      return { success: false, message: 'Item not found in Recycle Bin' };
    }

    const item = bin[itemIdx];

    if (item.type === 'client') {
      const client = item.data as Client;
      const clients = this.getClients();
      // Add or replace client
      const existingIdx = clients.findIndex((c) => c.id === client.id);
      if (existingIdx >= 0) {
        clients[existingIdx] = client;
      } else {
        clients.unshift(client);
      }
      setStorageItem(STORAGE_KEYS.CLIENTS, clients);

      // Restore related payments if any
      if (item.relatedPayments && item.relatedPayments.length > 0) {
        const payments = this.getPayments();
        item.relatedPayments.forEach((rp) => {
          if (!payments.some((p) => p.id === rp.id)) {
            payments.push(rp);
          }
        });
        setStorageItem(STORAGE_KEYS.PAYMENTS, payments);
      }

      this.recalculateClientStatus(client.id);
      this.addAuditLog('Restored from Bin', `Restored client ${client.name} (${client.id})`);
    } else if (item.type === 'staff') {
      const staff = item.data as Physiotherapist;
      const physios = this.getPhysiotherapists();
      const existingIdx = physios.findIndex((p) => p.id === staff.id);
      if (existingIdx >= 0) {
        physios[existingIdx] = staff;
      } else {
        physios.push(staff);
      }
      setStorageItem(STORAGE_KEYS.PHYSIOTHERAPISTS, physios);
      this.addAuditLog('Restored from Bin', `Restored staff ${staff.name}`);
    } else if (item.type === 'payment') {
      const payment = item.data as Payment;
      const payments = this.getPayments();
      const existingIdx = payments.findIndex((p) => p.id === payment.id);
      if (existingIdx >= 0) {
        payments[existingIdx] = payment;
      } else {
        payments.unshift(payment);
      }
      setStorageItem(STORAGE_KEYS.PAYMENTS, payments);
      this.recalculateClientStatus(payment.clientId);
      this.addAuditLog('Restored from Bin', `Restored payment ৳${payment.amount} for client ${payment.clientId}`);
    }

    // Remove from bin
    const updatedBin = bin.filter((i) => i.id !== binItemId);
    setStorageItem(STORAGE_KEYS.RECYCLE_BIN, updatedBin);

    return {
      success: true,
      message: `Successfully restored "${item.title}" from Recycle Bin!`,
    };
  }

  static permanentlyDeleteFromRecycleBin(binItemId: string): void {
    const bin = this.getRecycleBin();
    const item = bin.find((i) => i.id === binItemId);
    const updated = bin.filter((i) => i.id !== binItemId);
    setStorageItem(STORAGE_KEYS.RECYCLE_BIN, updated);
    if (item) {
      this.addAuditLog('Permanently Deleted', `Permanently deleted "${item.title}" from Recycle Bin`);
    }
  }

  static emptyRecycleBin(): void {
    const count = this.getRecycleBin().length;
    setStorageItem(STORAGE_KEYS.RECYCLE_BIN, []);
    this.addAuditLog('Recycle Bin Emptied', `Emptied Recycle Bin (${count} items cleared)`);
  }

  // Calculate client totals
  static recalculateClientStatus(clientId: string): void {
    const clients = this.getClients();
    const clientIdx = clients.findIndex((c) => c.id === clientId);
    if (clientIdx < 0) return;

    const client = clients[clientIdx];
    const clientPayments = this.getPaymentsByClient(clientId);
    const totalPaid = clientPayments.reduce((acc, p) => acc + p.amount, 0);
    const due = Math.max(0, client.finalAmount - totalPaid);

    let status = client.status;
    if (totalPaid >= client.finalAmount) {
      status = 'PAID';
    } else if (totalPaid > 0) {
      status = 'PARTIALLY PAID';
    } else {
      // Check if overdue (>30 days since enrollment)
      const enrollDate = new Date(client.enrollmentDate).getTime();
      const now = new Date().getTime();
      const diffDays = (now - enrollDate) / (1000 * 3600 * 24);
      status = diffDays > 30 ? 'OVERDUE' : 'UNPAID';
    }

    clients[clientIdx] = { ...client, status, updatedAt: new Date().toISOString() };
    setStorageItem(STORAGE_KEYS.CLIENTS, clients);
  }

  // Settlements
  static getSettlements(): CommissionSettlement[] {
    return getStorageItem<CommissionSettlement[]>(STORAGE_KEYS.SETTLEMENTS, DEFAULT_SETTLEMENTS);
  }

  static addSettlement(settlement: CommissionSettlement): void {
    const settlements = this.getSettlements();
    settlements.unshift(settlement);
    setStorageItem(STORAGE_KEYS.SETTLEMENTS, settlements);
    this.addAuditLog('Commission Settled', `Settled ৳${settlement.amount} for Physio ${settlement.physiotherapistId}`);
  }

  // Periods (Dynamic Real-Time Commission Months)
  static getPeriods(): ReportingPeriod[] {
    const stdMonths = getStandardCommissionMonths();
    const dynamicPeriods = stdMonths.map(commissionMonthToReportingPeriod);
    const selectedId = getStorageItem<string | null>(STORAGE_KEYS.CURRENT_PERIOD, null);
    const realtimeKey = getCurrentRealtimeMonthKey();
    const activeKey = selectedId || realtimeKey;

    return dynamicPeriods.map((p) => ({
      ...p,
      isCurrent: p.id === activeKey,
    }));
  }

  static getCurrentPeriod(): ReportingPeriod {
    const periods = this.getPeriods();
    const realtimeKey = getCurrentRealtimeMonthKey();
    return periods.find((p) => p.isCurrent) || periods.find((p) => p.id === realtimeKey) || periods[0];
  }

  static setCurrentPeriod(periodId: string): void {
    setStorageItem(STORAGE_KEYS.CURRENT_PERIOD, periodId);
  }

  static addPeriod(period: ReportingPeriod): void {
    if (period.isCurrent) {
      setStorageItem(STORAGE_KEYS.CURRENT_PERIOD, period.id);
    }
  }

  // Audit Logs
  static getAuditLogs(): AuditLog[] {
    return getStorageItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, [
      {
        id: 'log-1',
        timestamp: new Date().toISOString(),
        user: 'Admin',
        action: 'System Start',
        details: 'Fitback Reset practice dataset initialized.',
      },
    ]);
  }

  static addAuditLog(action: string, details: string, previousValue?: string, newValue?: string): void {
    const logs = this.getAuditLogs();
    logs.unshift({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      user: 'Admin',
      action,
      details,
      previousValue,
      newValue,
    });
    setStorageItem(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 100)); // Keep last 100
  }

  // Cloud Config
  static getCloudConfig(): CloudBackupConfig {
    return getStorageItem<CloudBackupConfig>(STORAGE_KEYS.CLOUD_CONFIG, DEFAULT_CLOUD_CONFIG);
  }

  static saveCloudConfig(config: CloudBackupConfig): void {
    setStorageItem(STORAGE_KEYS.CLOUD_CONFIG, config);
  }

  // Export full DB snapshot
  static exportDatabaseJSON(): string {
    const dump = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      physiotherapists: this.getPhysiotherapists(),
      clients: this.getClients(),
      packages: this.getPackages(),
      payments: this.getPayments(),
      settlements: this.getSettlements(),
      periods: this.getPeriods(),
      auditLogs: this.getAuditLogs(),
      recycleBin: this.getRecycleBin(),
    };
    return JSON.stringify(dump, null, 2);
  }

  // Import full DB snapshot
  static importDatabaseJSON(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.clients || !data.payments || !data.physiotherapists) {
        throw new Error('Invalid JSON format for Fitback Reset export');
      }
      setStorageItem(STORAGE_KEYS.PHYSIOTHERAPISTS, data.physiotherapists);
      setStorageItem(STORAGE_KEYS.CLIENTS, data.clients);
      setStorageItem(STORAGE_KEYS.PACKAGES, data.packages || DEFAULT_PACKAGES);
      setStorageItem(STORAGE_KEYS.PAYMENTS, data.payments);
      setStorageItem(STORAGE_KEYS.SETTLEMENTS, data.settlements || []);
      setStorageItem(STORAGE_KEYS.REPORTING_PERIODS, data.periods || DEFAULT_PERIODS);
      if (data.recycleBin) {
        setStorageItem(STORAGE_KEYS.RECYCLE_BIN, data.recycleBin);
      }
      this.addAuditLog('Database Restore', 'Imported full JSON database snapshot');
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  }

  // Reset to default seed
  static resetToDefaultSeed(): void {
    setStorageItem(STORAGE_KEYS.PHYSIOTHERAPISTS, DEFAULT_PHYSIOTHERAPISTS);
    setStorageItem(STORAGE_KEYS.CLIENTS, DEFAULT_CLIENTS);
    setStorageItem(STORAGE_KEYS.PACKAGES, DEFAULT_PACKAGES);
    setStorageItem(STORAGE_KEYS.PAYMENTS, DEFAULT_PAYMENTS);
    setStorageItem(STORAGE_KEYS.SETTLEMENTS, DEFAULT_SETTLEMENTS);
    setStorageItem(STORAGE_KEYS.REPORTING_PERIODS, DEFAULT_PERIODS);
    setStorageItem(STORAGE_KEYS.CLOUD_CONFIG, DEFAULT_CLOUD_CONFIG);
    setStorageItem(STORAGE_KEYS.RECYCLE_BIN, []);
    this.addAuditLog('Database Reset', 'Reset application to factory default seed data');
  }
}
