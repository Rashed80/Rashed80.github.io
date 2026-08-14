import React from 'react';
import {
  Calendar,
  ChevronDown,
  DollarSign,
  UserCheck,
  FileText,
  Percent,
  Download,
  Users,
  CreditCard,
  Building2,
  Info,
  CheckCircle2,
} from 'lucide-react';
import {
  Client,
  Payment,
  Physiotherapist,
  ReportingPeriod,
  ViewTab,
} from '../types';
import { Avatar } from './common/Avatar';
import { FitbackLogo } from '../assets/FitbackLogo';
import {
  getCommissionSummaryForMonth,
  getCommissionMonthMetadata,
  evaluateClientCommission,
  getCurrentRealtimeMonthKey,
} from '../lib/commissionRules';

interface DashboardViewProps {
  periods: ReportingPeriod[];
  currentPeriod: ReportingPeriod;
  onSelectPeriod: (periodId: string) => void;
  clients: Client[];
  payments: Payment[];
  physiotherapists: Physiotherapist[];
  settlements?: any[];
  onNavigateTab: (tab: ViewTab) => void;
  onSelectClient: (clientId: string) => void;
  onEditStaff: (physio: Physiotherapist) => void;
  onGenerateIndividualPhysioPdf: (physio: Physiotherapist) => void;
  onGenerateMasterStaffPdf: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  periods,
  currentPeriod,
  onSelectPeriod,
  clients,
  payments,
  physiotherapists,
  onNavigateTab,
  onSelectClient,
  onGenerateIndividualPhysioPdf,
  onGenerateMasterStaffPdf,
}) => {
  // Practice-wide Commission Calculations adhering to the 15th of the month rule
  const selectedMonthKey = currentPeriod.id && currentPeriod.id.includes('-') ? currentPeriod.id : getCurrentRealtimeMonthKey();
  const meta = getCommissionMonthMetadata(selectedMonthKey);
  const summary = getCommissionSummaryForMonth(clients, payments, physiotherapists, selectedMonthKey);

  const totalCollectedRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

  // Recent client payment activity
  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const getClientName = (clientId: string) => {
    const c = clients.find((x) => x.id === clientId);
    return c ? c.name : clientId;
  };

  const getPhysioName = (physioId?: string) => {
    const p = physiotherapists.find((x) => x.id === physioId);
    return p ? p.name : 'Unassigned';
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header Banner with Fitback Reset Logo */}
      <section className="bg-white dark:bg-[#283044] rounded-2xl p-5 shadow-xs border border-[#bec9c8]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <FitbackLogo className="h-12 shrink-0" showTagline={true} />
          <div className="border-l border-[#bec9c8]/30 pl-4 hidden sm:block">
            <h1 className="text-xl md:text-2xl font-bold text-[#131b2e] dark:text-[#faf8ff]">
              Physiotherapist Commission Center
            </h1>
            <p className="text-xs text-[#6e7979] dark:text-[#bec9c8] mt-0.5">
              Automated 15th-of-the-month commission payout tracking for fully paid clients
            </p>
          </div>
        </div>

        {/* Reporting Period & Master Export Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-[#f2f3ff] dark:bg-[#131b2e] px-3.5 py-2 rounded-xl border border-[#bec9c8]/40 shadow-2xs">
            <Calendar className="w-4 h-4 text-[#005052] dark:text-[#84d4d5]" />
            <select
              value={currentPeriod.id}
              onChange={(e) => onSelectPeriod(e.target.value)}
              className="bg-transparent font-semibold text-xs text-[#131b2e] dark:text-[#faf8ff] focus:outline-none cursor-pointer pr-1"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id} className="bg-white dark:bg-[#131b2e]">
                  {p.name.split('(')[0].trim()}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#6e7979] pointer-events-none" />
          </div>

          <button
            onClick={onGenerateMasterStaffPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#005052] text-white text-xs font-semibold hover:bg-[#006a6c] active:scale-95 transition-all shadow-xs cursor-pointer"
            title="Download Master Commission A4 PDF Report for All Physiotherapists"
          >
            <FileText className="w-4 h-4" />
            <span>Master A4 Staff PDF</span>
          </button>
        </div>
      </section>

      {/* Commission Payment Rule Callout Banner */}
      <section className="bg-linear-to-r from-[#005052]/10 via-[#005052]/5 to-transparent border border-[#005052]/25 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-[#005052] text-white shrink-0 mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#005052] dark:text-[#84d4d5] flex items-center gap-2 flex-wrap">
              <span>Commission Payment Rule: Paid on the 15th</span>
              <span className="text-[11px] font-semibold bg-[#005052] text-white px-2 py-0.5 rounded-full">
                Payout: {meta.payoutDateFormatted}
              </span>
            </h2>
            <p className="text-xs text-[#131b2e] dark:text-[#faf8ff] mt-1 leading-relaxed">
              Clients qualify for <strong>{meta.commissionMonthName}</strong> commission when full payment was completed during the previous calendar month (<strong>{meta.qualifyingRangeLabel}</strong>).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          <span className="text-xs text-[#6e7979] dark:text-[#bec9c8]">
            Qualifying Clients: <strong className="text-[#005052] dark:text-[#84d4d5] text-sm">{summary.qualifyingClients.length}</strong>
          </span>
        </div>
      </section>

      {/* Primary Practice KPIs Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* KPI 1: Total Earned Commission */}
        <div className="bg-white dark:bg-[#283044] rounded-2xl p-5 shadow-xs border border-[#bec9c8]/30 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-28 h-28 bg-[#005052]/5 rounded-bl-full pointer-events-none"></div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold text-[#6e7979] dark:text-[#bec9c8] uppercase tracking-wider block">
                Total Earned Commission
              </span>
              <span className="text-[10px] font-semibold text-[#005052] dark:text-[#84d4d5] bg-[#005052]/10 px-2 py-0.5 rounded-full inline-block mt-1">
                Payable on {meta.payoutDateFormatted}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#005052] text-white">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-[#005052] dark:text-[#84d4d5] mt-3">
            ৳{summary.totalEarnedCommission.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#6e7979] dark:text-[#bec9c8] mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#28695c]" />
            <span>For {summary.qualifyingClients.length} client(s) fully paid in {meta.qualifyingMonthName}</span>
          </div>
        </div>

        {/* KPI 2: Total Practice Package Value */}
        <div className="bg-white dark:bg-[#283044] rounded-2xl p-5 shadow-xs border border-[#bec9c8]/30 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold text-[#6e7979] dark:text-[#bec9c8] uppercase tracking-wider block">
                Qualifying Package Value
              </span>
              <span className="text-2xl md:text-3xl font-bold text-[#131b2e] dark:text-[#faf8ff] mt-2 block">
                ৳{summary.totalQualifyingPackageValue.toLocaleString()}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#f2f3ff] dark:bg-[#131b2e] text-[#005052] dark:text-[#84d4d5]">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[11px] text-[#6e7979] dark:text-[#bec9c8] mt-2 font-medium">
            Total packages qualifying in {meta.qualifyingMonthName}
          </span>
        </div>

        {/* KPI 3: Total Revenue Collected */}
        <div className="bg-white dark:bg-[#283044] rounded-2xl p-5 shadow-xs border border-[#bec9c8]/30 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold text-[#6e7979] dark:text-[#bec9c8] uppercase tracking-wider block">
                Total Revenue Collected
              </span>
              <div className="text-2xl md:text-3xl font-bold text-[#28695c] mt-2">
                ৳{totalCollectedRevenue.toLocaleString()}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#28695c]/10 text-[#28695c]">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[11px] text-[#6e7979] dark:text-[#bec9c8] mt-2 font-medium">
            Cumulative payments received across all clients
          </span>
        </div>
      </section>

      {/* Physiotherapist Commission Breakdown */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-lg font-bold text-[#131b2e] dark:text-[#faf8ff] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#005052] dark:text-[#84d4d5]" />
              Physiotherapist Commission Statements — {meta.commissionMonthName}
            </h2>
            <p className="text-xs text-[#6e7979] dark:text-[#bec9c8]">
              Qualifying clients completed full payment in {meta.qualifyingRangeLabel}
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('staff')}
            className="text-xs font-semibold text-[#005052] dark:text-[#84d4d5] hover:underline cursor-pointer"
          >
            Manage Profiles & Rates →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {physiotherapists.map((physio) => {
            const physioClients = clients.filter((c) => c.physiotherapistId === physio.id);
            const physioPayments = payments.filter((p) => p.physiotherapistId === physio.id);

            const evaluated = physioClients.map((c) =>
              evaluateClientCommission(c, physioPayments, [physio], selectedMonthKey)
            );

            const qualifying = evaluated.filter((e) => e.qualifiesForSelectedMonth);

            const totalQualPkgVal = qualifying.reduce((sum, e) => sum + e.client.finalAmount, 0);
            const totalEarnedComm = qualifying.reduce((sum, e) => sum + e.commissionAmount, 0);

            return (
              <div
                key={physio.id}
                className="bg-white dark:bg-[#283044] rounded-2xl shadow-xs border border-[#bec9c8]/30 p-5 space-y-4 flex flex-col justify-between hover:border-[#005052]/40 transition-colors"
              >
                {/* Header Profile Info */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={physio.avatarUrl}
                      name={physio.name}
                      sizeClassName="w-12 h-12"
                      className="border-2 border-[#eaedff] shrink-0 text-sm"
                    />
                    <div>
                      <h3 className="font-bold text-base text-[#131b2e] dark:text-[#faf8ff]">
                        {physio.name}
                      </h3>
                      <p className="text-xs text-[#6e7979] dark:text-[#bec9c8]">{physio.title}</p>

                      <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-[#005052] dark:text-[#84d4d5]">
                        <Calendar className="w-3 h-3" />
                        <span>Payout: {meta.payoutDateFormatted}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#005052]/10 text-[#005052] dark:text-[#84d4d5]">
                      <Percent className="w-3 h-3" /> {physio.commissionRate}% Rate
                    </span>
                  </div>
                </div>

                {/* Stat Grid */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-[#faf8ff] dark:bg-[#131b2e] rounded-xl border border-[#bec9c8]/20 text-center text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-[#6e7979] block uppercase">Qualifying</span>
                    <span className="font-bold text-[#131b2e] dark:text-[#faf8ff] text-sm">
                      {qualifying.length} <span className="text-[10px] text-[#6e7979] font-normal">({physioClients.length} total)</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#6e7979] block uppercase">Qualifying Value</span>
                    <span className="font-bold text-[#131b2e] dark:text-[#faf8ff] text-sm">
                      ৳{totalQualPkgVal.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#005052] dark:text-[#84d4d5] block uppercase">
                      Earned Comm.
                    </span>
                    <span className="font-bold text-[#005052] dark:text-[#84d4d5] text-sm">
                      ৳{totalEarnedComm.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Qualifying Clients Preview */}
                {qualifying.length > 0 ? (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-[#131b2e] dark:text-[#faf8ff] flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#28695c]" />
                        Qualifying Clients (Paid in {meta.qualifyingMonthName}):
                      </span>
                    </div>
                    <div className="space-y-1">
                      {qualifying.map((q) => (
                        <div
                          key={q.client.id}
                          onClick={() => onSelectClient(q.client.id)}
                          className="flex items-center justify-between text-xs p-2 rounded-xl bg-white dark:bg-[#283044] border border-[#bec9c8]/30 hover:border-[#005052] cursor-pointer"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="font-semibold text-[#131b2e] dark:text-[#faf8ff] block truncate" title={q.client.name}>
                              {q.client.name}
                            </span>
                            <span className="text-[10px] text-[#6e7979] dark:text-[#bec9c8] flex items-center gap-1 mt-0.5">
                              <Calendar className="w-2.5 h-2.5" /> Enrolled: {q.client.enrollmentDate}
                            </span>
                          </div>
                          <span className="font-bold text-[#005052] dark:text-[#84d4d5] shrink-0">
                            +৳{q.commissionAmount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-[#6e7979] dark:text-[#bec9c8] p-2 rounded-lg bg-[#faf8ff] dark:bg-[#131b2e] text-center">
                    No clients completed full payment in {meta.qualifyingMonthName}
                  </div>
                )}

                {/* Direct Action Button to Export A4 PDF Report */}
                <button
                  type="button"
                  onClick={() => onGenerateIndividualPhysioPdf(physio)}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#005052] hover:bg-[#006a6c] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-2xs active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Preview & Download A4 PDF Statement</span>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Client Transactions */}
      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-lg font-bold text-[#131b2e] dark:text-[#faf8ff]">
            Recent Client Payments
          </h2>
          <button
            onClick={() => onNavigateTab('clients')}
            className="text-xs font-semibold text-[#005052] dark:text-[#84d4d5] hover:underline cursor-pointer"
          >
            View all clients →
          </button>
        </div>

        <div className="bg-white dark:bg-[#283044] rounded-2xl shadow-xs border border-[#bec9c8]/30 overflow-hidden divide-y divide-[#bec9c8]/20">
          {recentPayments.map((p, idx) => {
            const client = clients.find((c) => c.id === p.clientId);
            const physio = physiotherapists.find((ph) => ph.id === p.physiotherapistId);
            const commAmount =
              client && physio
                ? Math.round((client.finalAmount * physio.commissionRate) / 100)
                : p.commissionAmount;

            return (
              <div
                key={`${p.id}-${idx}`}
                onClick={() => onSelectClient(p.clientId)}
                className="flex items-center justify-between p-4 hover:bg-[#faf8ff] dark:hover:bg-[#131b2e] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#005052]/10 text-[#005052] dark:text-[#84d4d5] flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-[#131b2e] dark:text-[#faf8ff] truncate group-hover:text-[#005052]" title={getClientName(p.clientId)}>
                      {getClientName(p.clientId)}
                    </h3>
                    <p className="text-xs text-[#6e7979] dark:text-[#bec9c8] truncate">
                      Physio: <span className="font-medium text-[#131b2e] dark:text-[#faf8ff]">{getPhysioName(p.physiotherapistId)}</span> • {p.paymentMethod} • Enrolled: <span className="font-medium text-[#131b2e] dark:text-[#faf8ff]">{client?.enrollmentDate || '-'}</span> • Paid: {p.paymentDate || p.createdAt.split('T')[0]}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-3">
                  <div className="font-bold text-sm text-[#005052] dark:text-[#84d4d5]">
                    ৳{p.amount.toLocaleString()} <span className="text-[10px] text-[#6e7979] font-normal">(Paid)</span>
                  </div>
                  <div className="text-[11px] font-semibold text-[#28695c]">
                    Status: {client?.paymentStatus === 'PAID' ? 'Fully Paid' : 'Partial'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
