import { Client, Payment, Physiotherapist, ReportingPeriod } from '../types';

export interface ClientCommissionQualification {
  client: Client;
  physio?: Physiotherapist;
  isFullyPaid: boolean;
  totalPaid: number;
  dueAmount: number;
  fullPaymentDate?: string; // YYYY-MM-DD
  fullPaymentMonthKey?: string; // YYYY-MM (the calendar month of full payment)
  fullPaymentMonthName?: string; // e.g., "July 2026"
  commissionMonthKey?: string; // YYYY-MM (the following month when commission is paid)
  commissionMonthName?: string; // e.g., "August 2026"
  commissionPayoutDate?: string; // e.g., "2026-08-15"
  commissionPayoutFormatted?: string; // e.g., "August 15, 2026"
  commissionRate: number;
  commissionAmount: number; // Calculated on client.finalAmount
  qualifiesForSelectedMonth: boolean;
  qualificationStatus: 'QUALIFIED' | 'PENDING_PAYMENT' | 'OTHER_MONTH' | 'NO_PACKAGE';
  statusExplanation: string;
}

export interface CommissionMonthMetadata {
  id: string; // e.g. "2026-08"
  key: string; // e.g. "2026-08"
  commissionMonthName: string; // e.g. "August 2026"
  payoutDate: string; // e.g. "2026-08-15"
  payoutDateFormatted: string; // e.g. "August 15, 2026"
  qualifyingMonthKey: string; // e.g. "2026-07"
  qualifyingMonthName: string; // e.g. "July 2026"
  qualifyingStartDate: string; // e.g. "2026-07-01"
  qualifyingEndDate: string; // e.g. "2026-07-31"
  qualifyingRangeLabel: string; // e.g. "July 1 – July 31, 2026"
  dropdownLabel: string; // e.g. "August 2026 (Paid Aug 15) • Qualifies July 1–31"
  isCurrent: boolean;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Get comprehensive metadata for a specific Commission Month (YYYY-MM).
 * E.g., for "2026-08" (August 2026):
 * - Qualifying month is July 2026 (2026-07-01 to 2026-07-31)
 * - Payout date is August 15, 2026
 */
export function getCommissionMonthMetadata(monthKey: string): CommissionMonthMetadata {
  const parts = monthKey.split('-');
  const commYear = parseInt(parts[0], 10) || new Date().getFullYear();
  const commMonthNum = parseInt(parts[1], 10) || new Date().getMonth() + 1; // 1-12

  // Month 0-indexed for Commission Month
  const commMonthIdx = commMonthNum - 1;
  const commissionMonthName = `${MONTH_NAMES[commMonthIdx]} ${commYear}`;
  const payoutDate = `${commYear}-${String(commMonthNum).padStart(2, '0')}-15`;
  const payoutDateFormatted = `${MONTH_NAMES[commMonthIdx]} 15, ${commYear}`;

  // Previous calendar month (Qualifying Month)
  let qualYear = commYear;
  let qualMonthNum = commMonthNum - 1;
  if (qualMonthNum < 1) {
    qualMonthNum = 12;
    qualYear = commYear - 1;
  }
  const qualMonthIdx = qualMonthNum - 1;
  const qualMonthKey = `${qualYear}-${String(qualMonthNum).padStart(2, '0')}`;
  const qualifyingMonthName = `${MONTH_NAMES[qualMonthIdx]} ${qualYear}`;

  // Find last day of qualifying month
  const lastDayDate = new Date(qualYear, qualMonthNum, 0);
  const lastDay = lastDayDate.getDate();

  const qualifyingStartDate = `${qualYear}-${String(qualMonthNum).padStart(2, '0')}-01`;
  const qualifyingEndDate = `${qualYear}-${String(qualMonthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  const qualifyingRangeLabel = `${MONTH_NAMES[qualMonthIdx]} 1 – ${MONTH_NAMES[qualMonthIdx]} ${lastDay}, ${qualYear}`;

  // Check if current month in real life
  const today = new Date();
  const currentKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const isCurrent = monthKey === currentKey;

  const dropdownLabel = commissionMonthName;

  return {
    id: monthKey,
    key: monthKey,
    commissionMonthName,
    payoutDate,
    payoutDateFormatted,
    qualifyingMonthKey: qualMonthKey,
    qualifyingMonthName,
    qualifyingStartDate,
    qualifyingEndDate,
    qualifyingRangeLabel,
    dropdownLabel,
    isCurrent,
  };
}

/**
 * Get current real-time month key (YYYY-MM).
 */
export function getCurrentRealtimeMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Generate standard list of Commission Month options dynamically in real-time.
 * Covers rolling past months, current real-time month, and upcoming months.
 */
export function getStandardCommissionMonths(): CommissionMonthMetadata[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth(); // 0-11
  const months: CommissionMonthMetadata[] = [];
  const seenKeys = new Set<string>();

  // Generate rolling window: from past 12 months up to next 6 months
  for (let offset = -12; offset <= 6; offset++) {
    const d = new Date(currentYear, currentMonthIdx + offset, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      months.push(getCommissionMonthMetadata(key));
    }
  }

  // Sort descending (latest/future first, current near top, past below)
  months.sort((a, b) => b.key.localeCompare(a.key));

  return months;
}

/**
 * Convert a standard Commission Month Metadata into a ReportingPeriod interface
 */
export function commissionMonthToReportingPeriod(meta: CommissionMonthMetadata): ReportingPeriod {
  return {
    id: meta.key,
    name: meta.commissionMonthName,
    startDate: meta.qualifyingStartDate,
    endDate: meta.qualifyingEndDate,
    isCurrent: meta.isCurrent,
  };
}

/**
 * Evaluates a client's full payment status and determines their Commission Month and Payout Date.
 * Rule:
 * - A client qualifies for commission when their full payment is completed during the previous calendar month.
 * - Previous month runs from 1st to last day of that month.
 * - Commission is paid on the 15th of the following month.
 * - The commission month is always the month AFTER the client becomes fully paid, regardless of enrollment date.
 */
export function evaluateClientCommission(
  client: Client,
  payments: Payment[],
  physiotherapists: Physiotherapist[],
  selectedCommissionMonthKey?: string
): ClientCommissionQualification {
  const physio = physiotherapists.find((p) => p.id === client.physiotherapistId);
  const commissionRate = physio?.commissionRate || 0;

  // Filter and sort client payments chronologically
  const clientPayments = payments
    .filter((p) => p.clientId === client.id)
    .sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime());

  const totalPaid = clientPayments.reduce((sum, p) => sum + p.amount, 0);
  const dueAmount = Math.max(0, client.finalAmount - totalPaid);

  let cumulative = 0;
  let fullPaymentDate: string | undefined = undefined;

  for (const p of clientPayments) {
    cumulative += p.amount;
    if (cumulative >= client.finalAmount && client.finalAmount > 0 && !fullPaymentDate) {
      fullPaymentDate = p.paymentDate;
    }
  }

  const isFullyPaid = client.finalAmount > 0 && totalPaid >= client.finalAmount;

  let fullPaymentMonthKey: string | undefined;
  let fullPaymentMonthName: string | undefined;
  let commissionMonthKey: string | undefined;
  let commissionMonthName: string | undefined;
  let commissionPayoutDate: string | undefined;
  let commissionPayoutFormatted: string | undefined;
  let commissionAmount = 0;

  if (isFullyPaid && fullPaymentDate) {
    commissionAmount = Math.round((client.finalAmount * commissionRate) / 100);

    const paidParts = fullPaymentDate.split('-');
    const paidYear = parseInt(paidParts[0], 10);
    const paidMonthNum = parseInt(paidParts[1], 10); // 1-12
    const paidMonthIdx = paidMonthNum - 1;

    fullPaymentMonthKey = `${paidYear}-${String(paidMonthNum).padStart(2, '0')}`;
    fullPaymentMonthName = `${MONTH_NAMES[paidMonthIdx]} ${paidYear}`;

    // Following calendar month
    let commYear = paidYear;
    let commMonthNum = paidMonthNum + 1;
    if (commMonthNum > 12) {
      commMonthNum = 1;
      commYear = paidYear + 1;
    }
    const commMonthIdx = commMonthNum - 1;

    commissionMonthKey = `${commYear}-${String(commMonthNum).padStart(2, '0')}`;
    commissionMonthName = `${MONTH_NAMES[commMonthIdx]} ${commYear}`;
    commissionPayoutDate = `${commYear}-${String(commMonthNum).padStart(2, '0')}-15`;
    commissionPayoutFormatted = `${MONTH_NAMES[commMonthIdx]} 15, ${commYear}`;
  }

  // Check if qualifies for selected commission month
  let qualifiesForSelectedMonth = false;
  let qualificationStatus: 'QUALIFIED' | 'PENDING_PAYMENT' | 'OTHER_MONTH' | 'NO_PACKAGE' =
    'PENDING_PAYMENT';
  let statusExplanation = '';

  if (client.finalAmount <= 0) {
    qualificationStatus = 'NO_PACKAGE';
    statusExplanation = 'No package fee assigned.';
  } else if (!isFullyPaid) {
    qualificationStatus = 'PENDING_PAYMENT';
    statusExplanation = `Partially paid (৳${totalPaid.toLocaleString()} of ৳${client.finalAmount.toLocaleString()} • ৳${dueAmount.toLocaleString()} due). Commission qualifies in the month after full payment is completed.`;
  } else {
    // Fully paid!
    if (!selectedCommissionMonthKey || selectedCommissionMonthKey === 'ALL') {
      qualifiesForSelectedMonth = true;
      qualificationStatus = 'QUALIFIED';
      statusExplanation = `Fully paid on ${fullPaymentDate} (${fullPaymentMonthName}). Commission ৳${commissionAmount.toLocaleString()} paid on ${commissionPayoutFormatted}.`;
    } else if (commissionMonthKey === selectedCommissionMonthKey) {
      qualifiesForSelectedMonth = true;
      qualificationStatus = 'QUALIFIED';
      statusExplanation = `Fully paid on ${fullPaymentDate} (in ${fullPaymentMonthName}). Qualifies for ${commissionMonthName} report • Paid on ${commissionPayoutFormatted}.`;
    } else {
      qualifiesForSelectedMonth = false;
      qualificationStatus = 'OTHER_MONTH';
      statusExplanation = `Fully paid on ${fullPaymentDate} (${fullPaymentMonthName}). Belongs to ${commissionMonthName} report (Paid ${commissionPayoutFormatted}), not the selected month.`;
    }
  }

  return {
    client,
    physio,
    isFullyPaid,
    totalPaid,
    dueAmount,
    fullPaymentDate,
    fullPaymentMonthKey,
    fullPaymentMonthName,
    commissionMonthKey,
    commissionMonthName,
    commissionPayoutDate,
    commissionPayoutFormatted,
    commissionRate,
    commissionAmount,
    qualifiesForSelectedMonth,
    qualificationStatus,
    statusExplanation,
  };
}

/**
 * Filter and compute commission summary for a selected commission month.
 */
export function getCommissionSummaryForMonth(
  arg1: string | Client[],
  arg2: Client[] | Payment[],
  arg3: Payment[] | Physiotherapist[],
  arg4?: Physiotherapist[] | string
) {
  let selectedMonthKey: string;
  let clients: Client[];
  let payments: Payment[];
  let physiotherapists: Physiotherapist[];

  if (typeof arg1 === 'string') {
    selectedMonthKey = arg1;
    clients = arg2 as Client[];
    payments = arg3 as Payment[];
    physiotherapists = (arg4 as Physiotherapist[]) || [];
  } else {
    clients = arg1;
    payments = arg2 as Payment[];
    physiotherapists = arg3 as Physiotherapist[];
    selectedMonthKey = (arg4 as string) || getCurrentRealtimeMonthKey();
  }

  const meta = getCommissionMonthMetadata(selectedMonthKey);

  const evaluatedClients = clients.map((c) =>
    evaluateClientCommission(c, payments, physiotherapists, selectedMonthKey)
  );

  const qualifyingClients = evaluatedClients.filter((e) => e.qualifiesForSelectedMonth);
  const pendingClients = evaluatedClients.filter((e) => e.qualificationStatus === 'PENDING_PAYMENT');
  const otherMonthClients = evaluatedClients.filter((e) => e.qualificationStatus === 'OTHER_MONTH');

  const totalPackageValue = qualifyingClients.reduce((sum, e) => sum + e.client.finalAmount, 0);
  const totalCommissionPayable = qualifyingClients.reduce((sum, e) => sum + e.commissionAmount, 0);

  // Group by Physiotherapist
  const physioSummaries = physiotherapists.map((physio) => {
    const physioQualifying = qualifyingClients.filter((e) => e.client.physiotherapistId === physio.id);
    const physioPending = pendingClients.filter((e) => e.client.physiotherapistId === physio.id);

    const packageValue = physioQualifying.reduce((sum, e) => sum + e.client.finalAmount, 0);
    const commissionEarned = physioQualifying.reduce((sum, e) => sum + e.commissionAmount, 0);

    return {
      physio,
      qualifyingClients: physioQualifying,
      pendingClients: physioPending,
      qualifyingCount: physioQualifying.length,
      packageValue,
      commissionEarned,
      payoutDate: meta.payoutDateFormatted,
    };
  });

  return {
    meta,
    evaluatedClients,
    qualifyingClients,
    pendingClients,
    otherMonthClients,
    totalQualifyingCount: qualifyingClients.length,
    totalPackageValue,
    totalQualifyingPackageValue: totalPackageValue,
    totalCommissionPayable,
    totalEarnedCommission: totalCommissionPayable,
    physioSummaries,
  };
}
