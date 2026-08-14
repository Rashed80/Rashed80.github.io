import React, { useState } from 'react';
import {
  Calendar,
  FileText,
  Download,
  Search,
  PieChart,
  UserCheck,
  Percent,
  Info,
  CheckCircle2,
  Clock,
  Filter,
  User,
  Phone,
} from 'lucide-react';
import { Client, Payment, Physiotherapist, ReportingPeriod } from '../types';
import { Avatar } from './common/Avatar';
import {
  getCommissionSummaryForMonth,
  getCommissionMonthMetadata,
  evaluateClientCommission,
  getCurrentRealtimeMonthKey,
  ClientCommissionQualification,
} from '../lib/commissionRules';

interface ReportsViewProps {
  periods: ReportingPeriod[];
  currentPeriod: ReportingPeriod;
  onSelectPeriod: (periodId: string) => void;
  clients: Client[];
  payments: Payment[];
  physiotherapists: Physiotherapist[];
  onGenerateClientPdf: (client: Client) => void;
  onGenerateStaffPdf: () => void;
  onGenerateIndividualPhysioPdf: (physio: Physiotherapist) => void;
  onExportCsv: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  periods,
  currentPeriod,
  onSelectPeriod,
  clients,
  payments,
  physiotherapists,
  onGenerateClientPdf,
  onGenerateStaffPdf,
  onGenerateIndividualPhysioPdf,
  onExportCsv,
}) => {
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedPhysioId, setSelectedPhysioId] = useState<string>(physiotherapists[0]?.id || '');
  
  // Table tab filter
  const [tableFilter, setTableFilter] = useState<'ALL' | 'QUALIFYING' | 'PARTIAL'>('ALL');
  const [tablePhysioFilter, setTablePhysioFilter] = useState<string>('ALL');
  const [tableSearch, setTableSearch] = useState<string>('');

  const selectedMonthKey = currentPeriod.id && currentPeriod.id.includes('-') ? currentPeriod.id : getCurrentRealtimeMonthKey();
  const meta = getCommissionMonthMetadata(selectedMonthKey);
  const summary = getCommissionSummaryForMonth(clients, payments, physiotherapists, selectedMonthKey);

  // Evaluate all clients
  const evaluatedClients: ClientCommissionQualification[] = clients
    .filter((c) => !c.archived)
    .map((c) => {
      const clientPayments = payments.filter((p) => p.clientId === c.id);
      return evaluateClientCommission(c, clientPayments, physiotherapists, selectedMonthKey);
    });

  const qualifyingList = evaluatedClients.filter((e) => e.qualifiesForSelectedMonth);
  const pendingList = evaluatedClients.filter((e) => e.qualificationStatus === 'PENDING_PAYMENT');

  // Filtered evaluated clients for interactive table
  const displayedTableClients = evaluatedClients.filter((item) => {
    // Tab filter
    if (tableFilter === 'QUALIFYING' && !item.qualifiesForSelectedMonth) return false;
    if (tableFilter === 'PARTIAL' && item.qualificationStatus !== 'PENDING_PAYMENT') return false;

    // Physio filter
    if (tablePhysioFilter !== 'ALL' && item.client.physiotherapistId !== tablePhysioFilter) return false;

    // Search filter
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      const matchName = item.client.name.toLowerCase().includes(q);
      const matchId = item.client.id.toLowerCase().includes(q);
      const matchPhone = (item.client.phone || '').includes(q);
      const matchPkg = item.client.packageName.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchPhone && !matchPkg) return false;
    }

    return true;
  });

  // Filter client search options for PDF generator selector
  const searchedClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(clientSearchTerm.toLowerCase())
  );

  const selectedClient = clients.find((c) => c.id === selectedClientId) || searchedClients[0];
  const selectedPhysio = physiotherapists.find((p) => p.id === selectedPhysioId) || physiotherapists[0];

  // Specific selected physio evaluation
  const selectedPhysioClients = clients.filter((c) => c.physiotherapistId === selectedPhysio?.id);
  const selectedPhysioPayments = payments.filter((p) => p.physiotherapistId === selectedPhysio?.id);
  const selectedPhysioEvaluated = selectedPhysioClients.map((c) =>
    evaluateClientCommission(c, selectedPhysioPayments, selectedPhysio ? [selectedPhysio] : [], selectedMonthKey)
  );
  const selectedPhysioQualifying = selectedPhysioEvaluated.filter((e) => e.qualifiesForSelectedMonth);
  const selectedPhysioEarned = selectedPhysioQualifying.reduce((sum, e) => sum + e.commissionAmount, 0);

  // Financial metrics
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  // Payment method stats
  const methodTotals: Record<string, number> = {};
  payments.forEach((p) => {
    methodTotals[p.paymentMethod] = (methodTotals[p.paymentMethod] || 0) + p.amount;
  });

  const methodPercents = Object.entries(methodTotals).map(([method, amount]) => ({
    method,
    amount,
    percent: Math.round((amount / (totalCollected || 1)) * 100),
  }));

  // Get Initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Helper date formatting
  const formatPretty = (d?: string) => {
    if (!d) return '-';
    try {
      const parts = d.split('-');
      if (parts.length === 3) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const mIdx = parseInt(parts[1], 10) - 1;
        return `${parts[2]} ${months[mIdx]} ${parts[0]}`;
      }
      return d;
    } catch {
      return d;
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#131b2e] dark:text-[#faf8ff]">
            Reports & Statement Engine
          </h1>
          <p className="text-sm text-[#6e7979] dark:text-[#bec9c8] mt-0.5">
            Complete practice commission statements, enrollment dates, and client payment registers
          </p>
        </div>

        <button
          onClick={onExportCsv}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#bec9c8]/40 bg-white dark:bg-[#283044] text-xs font-semibold text-[#005052] dark:text-[#84d4d5] hover:bg-[#f2f3ff] transition-colors self-start md:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Export Practice CSV
        </button>
      </div>

      {/* Reporting Period & Commission Rule Card */}
      <section className="bg-white dark:bg-[#283044] rounded-2xl shadow-xs border border-[#bec9c8]/30 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#005052]/10 text-[#005052] dark:text-[#84d4d5] flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#6e7979] uppercase tracking-wider">
              Selected Commission Month
            </p>
            <select
              value={currentPeriod.id}
              onChange={(e) => onSelectPeriod(e.target.value)}
              className="font-bold text-sm text-[#131b2e] dark:text-[#faf8ff] bg-transparent focus:outline-none cursor-pointer mt-0.5"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id} className="bg-white dark:bg-[#131b2e]">
                  {p.name.split('(')[0].trim()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#005052] dark:text-[#84d4d5] bg-[#005052]/10 px-3.5 py-2 rounded-xl border border-[#005052]/20">
          <Info className="w-4 h-4 shrink-0" />
          <span>
            Payout Date: <strong>{meta.payoutDateFormatted}</strong> • Qualifying Cycle: <strong>{meta.qualifyingRangeLabel}</strong>
          </span>
        </div>
      </section>

      {/* Grid Layout: Top Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Physiotherapist Commission Reports */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-[#131b2e] dark:text-[#faf8ff]">
            Physiotherapist A4 Commission Reports
          </h2>

          {/* Individual Physiotherapist Report */}
          <div className="bg-white dark:bg-[#283044] rounded-2xl p-5 shadow-xs border border-[#bec9c8]/30 space-y-4">
            <div>
              <h3 className="font-semibold text-sm text-[#131b2e] dark:text-[#faf8ff]">
                Individual Physiotherapist A4 PDF Statement
              </h3>
              <p className="text-xs text-[#6e7979] mt-1">
                Generates official statement for <strong>{meta.commissionMonthName}</strong> (paid on <strong>{meta.payoutDateFormatted}</strong>) with client enrollment dates and full payment verification.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#6e7979] block">
                Select Physiotherapist:
              </label>
              <select
                value={selectedPhysioId}
                onChange={(e) => setSelectedPhysioId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[#bec9c8]/40 bg-white dark:bg-[#131b2e] text-xs font-semibold text-[#131b2e] dark:text-[#faf8ff] focus:outline-none cursor-pointer"
              >
                {physiotherapists.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.title} - {p.commissionRate}% Rate)
                  </option>
                ))}
              </select>

              {selectedPhysio && (
                <div className="p-3 bg-[#faf8ff] dark:bg-[#131b2e] rounded-xl border border-[#bec9c8]/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={selectedPhysio.avatarUrl}
                      name={selectedPhysio.name}
                      sizeClassName="w-8 h-8"
                      className="text-xs"
                    />
                    <div>
                      <span className="font-bold block text-[#131b2e] dark:text-[#faf8ff]">
                        {selectedPhysio.name}
                      </span>
                      <span className="text-[#6e7979]">
                        {selectedPhysioQualifying.length} qualifying client(s) in {meta.qualifyingMonthName}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full bg-[#005052]/10 text-[#005052] dark:text-[#84d4d5] font-bold block">
                      {selectedPhysio.commissionRate}% Rate
                    </span>
                    <span className="text-[11px] font-bold text-[#005052] dark:text-[#84d4d5] mt-1 block">
                      ৳{selectedPhysioEarned.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button
              disabled={!selectedPhysio}
              onClick={() => selectedPhysio && onGenerateIndividualPhysioPdf(selectedPhysio)}
              className="w-full py-2.5 rounded-xl bg-[#005052] text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#006a6c] active:scale-95 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Preview & Download A4 PDF ({selectedPhysio?.name || 'Select Physio'})
            </button>
          </div>

          {/* Master Staff Summary Report */}
          <div className="bg-white dark:bg-[#283044] rounded-2xl p-5 shadow-xs border border-[#bec9c8]/30 space-y-4">
            <div>
              <h3 className="font-semibold text-sm text-[#131b2e] dark:text-[#faf8ff]">
                Master Staff Commission & Payout Summary PDF
              </h3>
              <p className="text-xs text-[#6e7979] mt-1">
                Comprehensive overview table of all staff, qualifying clients, enrollment dates, and earned commissions payable on {meta.payoutDateFormatted}.
              </p>
            </div>

            <button
              onClick={onGenerateStaffPdf}
              className="w-full py-2.5 rounded-xl border border-[#005052] text-[#005052] dark:text-[#84d4d5] text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#005052]/5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Preview & Export Master Staff A4 PDF
            </button>
          </div>
        </div>

        {/* 2. Client Payment Reports & Payment Methods */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-[#131b2e] dark:text-[#faf8ff]">
            Client Statements & Analytics
          </h2>

          {/* Individual Client Statement */}
          <div className="bg-white dark:bg-[#283044] rounded-2xl p-5 shadow-xs border border-[#bec9c8]/30 space-y-4">
            <div>
              <h3 className="font-semibold text-sm text-[#131b2e] dark:text-[#faf8ff]">
                Individual Client Statement (A4 PDF)
              </h3>
              <p className="text-xs text-[#6e7979] mt-1">
                Generate official payment history and package breakdown PDF statement with enrollment dates.
              </p>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6e7979]" />
                <input
                  type="text"
                  placeholder="Search client name or ID..."
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-[#bec9c8]/40 bg-white dark:bg-[#131b2e] text-xs text-[#131b2e] dark:text-[#faf8ff] focus:outline-none"
                />
              </div>

              {clientSearchTerm && searchedClients.length > 0 && (
                <div className="max-h-32 overflow-y-auto border border-[#bec9c8]/30 rounded-xl bg-white dark:bg-[#131b2e] p-1 divide-y divide-[#bec9c8]/10">
                  {searchedClients.map((c, index) => (
                    <div
                      key={`${c.id}-${index}`}
                      onClick={() => {
                        setSelectedClientId(c.id);
                        setClientSearchTerm(c.name);
                      }}
                      className="p-2 text-xs hover:bg-[#f2f3ff] dark:hover:bg-[#283044] cursor-pointer flex justify-between items-center"
                    >
                      <div>
                        <span className="font-medium text-[#131b2e] dark:text-[#faf8ff] block">{c.name}</span>
                        <span className="text-[10px] text-[#6e7979]">Enrolled: {formatPretty(c.enrollmentDate)}</span>
                      </div>
                      <span className="text-[#6e7979] font-mono text-[11px]">{c.id}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              disabled={!selectedClient}
              onClick={() => selectedClient && onGenerateClientPdf(selectedClient)}
              className="w-full py-2.5 rounded-xl bg-[#005052] text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#006a6c] active:scale-95 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Generate Statement PDF ({selectedClient?.name || 'Select Client'})
            </button>
          </div>

          {/* Payment Methods Distribution */}
          <div className="bg-white dark:bg-[#283044] rounded-2xl p-5 shadow-xs border border-[#bec9c8]/30 space-y-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#005052]" />
              <h3 className="font-semibold text-sm text-[#131b2e] dark:text-[#faf8ff]">
                Payment Methods Distribution
              </h3>
            </div>

            <div className="space-y-2 pt-1">
              {methodPercents.length === 0 ? (
                <p className="text-xs text-[#6e7979]">No payment data recorded yet.</p>
              ) : (
                methodPercents.map(({ method, percent, amount }) => (
                  <div key={method} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-[#3e4949] dark:text-[#eef0ff]">{method}</span>
                      <span className="font-bold text-[#131b2e] dark:text-[#faf8ff]">
                        {percent}% (৳{amount.toLocaleString()})
                      </span>
                    </div>
                    <div className="w-full bg-[#f2f3ff] dark:bg-[#131b2e] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#005052] h-full rounded-full"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Comprehensive Client Commission & Payment Register Table */}
      <section className="bg-white dark:bg-[#283044] rounded-2xl shadow-xs border border-[#bec9c8]/30 overflow-hidden">
        {/* Table Header & Controls */}
        <div className="p-5 border-b border-[#bec9c8]/20 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#131b2e] dark:text-[#faf8ff] flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#005052] dark:text-[#84d4d5]" />
                Client Commission & Enrollment Register
              </h2>
              <p className="text-xs text-[#6e7979] dark:text-[#bec9c8] mt-0.5">
                Detailed breakdown for both fully paid qualifying clients and partial payment clients with enrollment dates
              </p>
            </div>

            {/* Tab Filter Chips */}
            <div className="flex items-center gap-1.5 bg-[#faf8ff] dark:bg-[#131b2e] p-1 rounded-xl border border-[#bec9c8]/30 self-start md:self-auto">
              <button
                onClick={() => setTableFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  tableFilter === 'ALL'
                    ? 'bg-[#005052] text-white shadow-2xs'
                    : 'text-[#6e7979] dark:text-[#bec9c8] hover:text-[#131b2e]'
                }`}
              >
                All Clients ({evaluatedClients.length})
              </button>
              <button
                onClick={() => setTableFilter('QUALIFYING')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  tableFilter === 'QUALIFYING'
                    ? 'bg-[#137333] text-white shadow-2xs'
                    : 'text-[#137333] hover:bg-[#e6f4ea]'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Fully Paid ({qualifyingList.length})
              </button>
              <button
                onClick={() => setTableFilter('PARTIAL')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  tableFilter === 'PARTIAL'
                    ? 'bg-[#8a5a19] text-white shadow-2xs'
                    : 'text-[#8a5a19] hover:bg-[#ffebd2]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Partial Payment ({pendingList.length})
              </button>
            </div>
          </div>

          {/* Search & Physio Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6e7979]" />
              <input
                type="text"
                placeholder="Search by client name, ID, phone, or package..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-[#faf8ff] dark:bg-[#131b2e] rounded-xl border border-[#bec9c8]/30 text-xs text-[#131b2e] dark:text-[#faf8ff] placeholder-[#6e7979] focus:outline-none focus:ring-1 focus:ring-[#005052]"
              />
            </div>

            <select
              value={tablePhysioFilter}
              onChange={(e) => setTablePhysioFilter(e.target.value)}
              className="h-10 px-3 bg-[#faf8ff] dark:bg-[#131b2e] rounded-xl border border-[#bec9c8]/30 text-xs font-medium text-[#131b2e] dark:text-[#faf8ff] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Physiotherapists</option>
              {physiotherapists.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.commissionRate}%)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#faf8ff] dark:bg-[#131b2e]/60 border-b border-[#bec9c8]/20 text-[11px] font-bold text-[#6e7979] uppercase tracking-wider">
                <th className="py-3 px-4">Client Name & Details</th>
                <th className="py-3 px-3">Enrollment Date</th>
                <th className="py-3 px-3">Therapy Package</th>
                <th className="py-3 px-3">Assigned Physio</th>
                <th className="py-3 px-3 text-right">Package Fee</th>
                <th className="py-3 px-3 text-right">Paid (Partial/Full)</th>
                <th className="py-3 px-3 text-right">Due Balance</th>
                <th className="py-3 px-3">Commission Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#bec9c8]/15 text-xs">
              {displayedTableClients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#6e7979] dark:text-[#bec9c8]">
                    No client records match the current filter or search criteria.
                  </td>
                </tr>
              ) : (
                displayedTableClients.map((item) => {
                  const physio = physiotherapists.find((p) => p.id === item.client.physiotherapistId);
                  const isQualifying = item.qualifiesForSelectedMonth;

                  return (
                    <tr
                      key={item.client.id}
                      className="hover:bg-[#faf8ff]/80 dark:hover:bg-[#131b2e]/50 transition-colors"
                    >
                      {/* 1. Client Name & Details (Beautiful formatting for long-form names) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#eaedff] dark:bg-[#131b2e] text-[#005052] dark:text-[#84d4d5] font-bold text-xs flex items-center justify-center shrink-0 border border-[#bec9c8]/30">
                            {getInitials(item.client.name)}
                          </div>
                          <div className="min-w-0">
                            <span
                              className="font-bold text-[#131b2e] dark:text-[#faf8ff] block leading-tight text-sm"
                              title={item.client.name}
                            >
                              {item.client.name}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-[#6e7979] mt-0.5">
                              <span className="font-mono">{item.client.id}</span>
                              {item.client.phone && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-0.5">
                                    <Phone className="w-2.5 h-2.5" />
                                    {item.client.phone}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Enrollment Date (PROMINENT for both fully paid and partial) */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f2f3ff] dark:bg-[#131b2e] border border-[#bec9c8]/30 text-xs font-semibold text-[#131b2e] dark:text-[#faf8ff]">
                          <Calendar className="w-3.5 h-3.5 text-[#005052] dark:text-[#84d4d5]" />
                          <span>{formatPretty(item.client.enrollmentDate)}</span>
                        </div>
                      </td>

                      {/* 3. Therapy Package */}
                      <td className="py-3.5 px-3">
                        <span className="font-medium text-[#3e4949] dark:text-[#eef0ff] block leading-snug">
                          {item.client.packageName}
                        </span>
                        {item.client.packagePrice !== item.client.finalAmount && (
                          <span className="text-[10px] text-[#6e7979] line-through block">
                            ৳{item.client.packagePrice.toLocaleString()}
                          </span>
                        )}
                      </td>

                      {/* 4. Assigned Physio */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {physio ? (
                          <div className="flex items-center gap-2">
                            <Avatar
                              src={physio.avatarUrl}
                              name={physio.name}
                              sizeClassName="w-6 h-6"
                              className="text-[10px] shrink-0"
                            />
                            <div>
                              <span className="font-semibold text-[#131b2e] dark:text-[#faf8ff] block text-xs">
                                {physio.name}
                              </span>
                              <span className="text-[10px] text-[#005052] dark:text-[#84d4d5] font-bold">
                                {physio.commissionRate}% Rate
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#6e7979] italic">Unassigned</span>
                        )}
                      </td>

                      {/* 5. Total Package Fee */}
                      <td className="py-3.5 px-3 text-right font-bold text-[#131b2e] dark:text-[#faf8ff] whitespace-nowrap">
                        ৳{item.client.finalAmount.toLocaleString()}
                      </td>

                      {/* 6. Paid (Partial or Full) */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <span className="font-bold text-[#28695c]">
                          ৳{item.totalPaid.toLocaleString()}
                        </span>
                        {item.dueAmount > 0 && (
                          <span className="text-[10px] text-[#8a5a19] block font-medium">
                            (Partial)
                          </span>
                        )}
                      </td>

                      {/* 7. Due Balance */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        {item.dueAmount > 0 ? (
                          <span className="font-bold text-[#ba1a1a]">
                            ৳{item.dueAmount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-[#137333] bg-[#e6f4ea] px-2 py-0.5 rounded-full">
                            ৳0 (Clear)
                          </span>
                        )}
                      </td>

                      {/* 8. Commission Status */}
                      <td className="py-3.5 px-3">
                        {isQualifying ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#e6f4ea] text-[#137333]">
                              <CheckCircle2 className="w-3 h-3" />
                              +৳{item.commissionAmount.toLocaleString()} Comm.
                            </span>
                            <span className="text-[10px] text-[#6e7979] block">
                              Paid {formatPretty(item.fullPaymentDate)} • Payout: {meta.payoutDateFormatted}
                            </span>
                          </div>
                        ) : item.qualificationStatus === 'PENDING_PAYMENT' ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#ffebd2] text-[#8a5a19]">
                              <Clock className="w-3 h-3" />
                              Awaiting Full Payment
                            </span>
                            <span className="text-[10px] text-[#6e7979] block">
                              Est. ৳{Math.round((item.client.finalAmount * (physio?.commissionRate || 0)) / 100).toLocaleString()} upon completion
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#6e7979]">
                            {item.statusExplanation}
                          </span>
                        )}
                      </td>

                      {/* 9. Action Button */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => onGenerateClientPdf(item.client)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#bec9c8]/40 hover:border-[#005052] bg-white dark:bg-[#283044] text-[#005052] dark:text-[#84d4d5] hover:bg-[#005052]/5 text-xs font-semibold transition-colors cursor-pointer"
                          title="Generate Client Statement PDF"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="p-4 bg-[#faf8ff] dark:bg-[#131b2e]/60 border-t border-[#bec9c8]/20 flex flex-col sm:flex-row items-center justify-between text-xs text-[#6e7979] gap-2">
          <span>
            Showing {displayedTableClients.length} of {evaluatedClients.length} enrolled clients
          </span>
          <div className="flex items-center gap-4 font-semibold">
            <span>Qualifying Commission ({meta.commissionMonthName}): <strong className="text-[#005052] dark:text-[#84d4d5]">৳{summary.totalCommissionPayable.toLocaleString()}</strong></span>
            <span>Total Revenue: <strong className="text-[#28695c]">৳{totalCollected.toLocaleString()}</strong></span>
          </div>
        </div>
      </section>
    </div>
  );
};
