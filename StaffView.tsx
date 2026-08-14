import React, { useState } from 'react';
import {
  UserCheck,
  Calendar,
  Building2,
  Plus,
  Percent,
  Pencil,
  Trash2,
  FileText,
  Download,
  Info,
  CheckCircle2,
  Users,
  RotateCcw,
} from 'lucide-react';
import { Client, Payment, Physiotherapist, ReportingPeriod } from '../types';
import { Avatar } from './common/Avatar';
import {
  getCommissionSummaryForMonth,
  getCommissionMonthMetadata,
  evaluateClientCommission,
  getCurrentRealtimeMonthKey,
} from '../lib/commissionRules';
import { AppStorage } from '../lib/storage';
import { ConfirmDeleteModal } from './modals/ConfirmDeleteModal';

interface StaffViewProps {
  physiotherapists: Physiotherapist[];
  clients: Client[];
  payments: Payment[];
  periods: ReportingPeriod[];
  currentPeriod: ReportingPeriod;
  onSelectPeriod: (periodId: string) => void;
  onOpenAddStaffModal: () => void;
  onEditStaff: (physio: Physiotherapist) => void;
  onDeleteStaff?: (physioId: string) => void;
  onGenerateIndividualPhysioPdf?: (physio: Physiotherapist) => void;
  onGenerateMasterStaffPdf?: () => void;
  onOpenRecycleBin?: () => void;
}

export const StaffView: React.FC<StaffViewProps> = ({
  physiotherapists,
  clients,
  payments,
  periods,
  currentPeriod,
  onSelectPeriod,
  onOpenAddStaffModal,
  onEditStaff,
  onDeleteStaff,
  onGenerateIndividualPhysioPdf,
  onGenerateMasterStaffPdf,
  onOpenRecycleBin,
}) => {
  const [physioToDelete, setPhysioToDelete] = useState<Physiotherapist | null>(null);

  const selectedMonthKey = currentPeriod.id && currentPeriod.id.includes('-') ? currentPeriod.id : getCurrentRealtimeMonthKey();
  const meta = getCommissionMonthMetadata(selectedMonthKey);
  const summary = getCommissionSummaryForMonth(clients, payments, physiotherapists, selectedMonthKey);
  const recycleBinCount = AppStorage.getRecycleBin().length;

  const totalRevenueCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  const handleConfirmDelete = () => {
    if (physioToDelete && onDeleteStaff) {
      onDeleteStaff(physioToDelete.id);
      setPhysioToDelete(null);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#131b2e] dark:text-[#faf8ff]">
            Physiotherapist Commission Management
          </h1>
          <p className="text-sm text-[#6e7979] dark:text-[#bec9c8] mt-0.5">
            Commission paid on the 15th of each month for clients who completed full payment in the previous month
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Global Period Selector */}
          <div className="flex items-center gap-2 bg-[#f2f3ff] dark:bg-[#283044] px-3.5 py-2 rounded-xl border border-[#bec9c8]/40 text-xs font-semibold">
            <Calendar className="w-4 h-4 text-[#005052] dark:text-[#84d4d5]" />
            <select
              value={currentPeriod.id}
              onChange={(e) => onSelectPeriod(e.target.value)}
              className="bg-transparent text-[#131b2e] dark:text-[#faf8ff] focus:outline-none cursor-pointer"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id} className="bg-white dark:bg-[#131b2e]">
                  {p.name.split('(')[0].trim()}
                </option>
              ))}
            </select>
          </div>

          {onOpenRecycleBin && (
            <button
              type="button"
              onClick={onOpenRecycleBin}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#bec9c8]/40 bg-white dark:bg-[#283044] text-[#3e4949] dark:text-[#eef0ff] text-xs font-semibold hover:bg-[#f2f3ff] transition-all cursor-pointer shadow-2xs"
              title="Open Recycle Bin"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#005052] dark:text-[#84d4d5]" />
              <span>Recycle Bin</span>
              {recycleBinCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#005052] text-white">
                  {recycleBinCount}
                </span>
              )}
            </button>
          )}

          {onGenerateMasterStaffPdf && (
            <button
              onClick={onGenerateMasterStaffPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#f2f3ff] dark:bg-[#283044] text-[#005052] dark:text-[#84d4d5] text-xs font-semibold hover:bg-[#eaedff] border border-[#bec9c8]/40 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Master Staff A4 PDF
            </button>
          )}

          <button
            onClick={onOpenAddStaffModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#005052] text-white text-xs font-semibold hover:bg-[#006a6c] active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Physiotherapist
          </button>
        </div>
      </div>

      {/* Commission Rule Highlights Banner */}
      <div className="bg-white dark:bg-[#283044] p-4 rounded-2xl border border-[#bec9c8]/40 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-[#e6f4ea] text-[#005052] dark:text-[#84d4d5] mt-0.5">
            <Info className="w-5 h-5 text-[#005052]" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#131b2e] dark:text-[#faf8ff]">
              Active Month: {meta.qualifyingMonthName} (Commission Payout: {meta.payoutDateFormatted})
            </h3>
            <p className="text-xs text-[#6e7979] dark:text-[#bec9c8] mt-0.5 max-w-2xl leading-relaxed">
              Only clients whose <strong>full package fee was completed during {meta.qualifyingMonthName}</strong> are qualified.
              Commission for these clients is scheduled for release on <strong>{meta.payoutDateFormatted}</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-[#bec9c8]/30 pt-3 md:pt-0 md:pl-5 shrink-0">
          <div>
            <span className="text-[11px] font-bold text-[#6e7979] block uppercase">Qualifying Revenue</span>
            <span className="font-bold text-base text-[#131b2e] dark:text-[#faf8ff]">
              ৳{summary.totalQualifyingPackageValue.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-[#6e7979] block uppercase">Total Commission Due</span>
            <span className="font-bold text-base text-[#137333] dark:text-[#84d4d5]">
              ৳{summary.totalCommissionPayable.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Staff Cards List */}
      <div className="space-y-4">
        {physiotherapists.map((physio) => {
          const physioClients = clients.filter((c) => c.physiotherapistId === physio.id);
          const physioPayments = payments.filter((p) => p.physiotherapistId === physio.id);

          // Evaluate qualifying clients for current month
          const qualifiedInMonth = physioClients.filter((c) => {
            const ev = evaluateClientCommission(c, payments, [physio], selectedMonthKey);
            return ev.qualifiesForSelectedMonth;
          });

          const monthlyQualifyingRevenue = qualifiedInMonth.reduce((sum, c) => sum + c.finalAmount, 0);
          const monthlyCommissionDue = Math.round((monthlyQualifyingRevenue * (physio.commissionRate || 25)) / 100);

          return (
            <div
              key={physio.id}
              className="bg-white dark:bg-[#283044] rounded-2xl p-5 border border-[#bec9c8]/30 shadow-xs hover:border-[#005052] transition-all space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#bec9c8]/20">
                {/* Profile Info with Avatar */}
                <div className="flex items-center gap-3.5">
                  <Avatar
                    src={physio.avatarUrl}
                    name={physio.name}
                    className="w-14 h-14 rounded-full border-2 border-white shadow-xs"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-[#131b2e] dark:text-[#faf8ff]">
                        {physio.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#f2f3ff] dark:bg-[#131b2e] text-[#005052] dark:text-[#84d4d5]">
                        {physio.commissionRate || 25}% Commission
                      </span>
                    </div>
                    <p className="text-xs text-[#6e7979] dark:text-[#bec9c8] mt-0.5">
                      {physio.title || 'Physiotherapist'} • Phone: {physio.phone}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-[#6e7979] mt-1">
                      <span>Payout: {meta.payoutDateFormatted} (Paid in {meta.qualifyingMonthName})</span>
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => onEditStaff(physio)}
                        className="text-[11px] font-semibold text-[#005052] dark:text-[#84d4d5] hover:underline flex items-center gap-1 cursor-pointer"
                        title="Modify Profile & Commission Rate"
                      >
                        <Pencil className="w-3 h-3" /> Edit Profile & Rate
                      </button>

                      <button
                        onClick={() => setPhysioToDelete(physio)}
                        className="text-[11px] font-semibold text-[#ba1a1a] hover:underline flex items-center gap-1 cursor-pointer"
                        title="Delete Physiotherapist Profile (Moves to Recycle Bin)"
                      >
                        <Trash2 className="w-3 h-3" /> Delete Profile
                      </button>
                    </div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-3 md:w-4/12 text-xs">
                  <div className="flex flex-col bg-[#faf8ff] dark:bg-[#131b2e] p-2.5 rounded-xl border border-[#bec9c8]/20">
                    <span className="text-[10px] font-bold text-[#6e7979] uppercase">Qualifying</span>
                    <span className="font-bold text-sm text-[#131b2e] dark:text-[#faf8ff] mt-0.5">
                      {qualifiedInMonth.length} Clients
                    </span>
                  </div>
                  <div className="flex flex-col bg-[#faf8ff] dark:bg-[#131b2e] p-2.5 rounded-xl border border-[#bec9c8]/20">
                    <span className="text-[10px] font-bold text-[#6e7979] uppercase">Revenue</span>
                    <span className="font-bold text-sm text-[#131b2e] dark:text-[#faf8ff] mt-0.5">
                      ৳{monthlyQualifyingRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col bg-[#e6f4ea] dark:bg-[#131b2e] p-2.5 rounded-xl border border-[#137333]/20">
                    <span className="text-[10px] font-bold text-[#137333] dark:text-[#84d4d5] uppercase">Commission</span>
                    <span className="font-bold text-sm text-[#137333] dark:text-[#84d4d5] mt-0.5">
                      ৳{monthlyCommissionDue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Qualified Clients Accordion / Quick List */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-[#6e7979] uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#137333]" />
                    Commission Qualified Clients ({qualifiedInMonth.length})
                  </span>
                  {onGenerateIndividualPhysioPdf && (
                    <button
                      onClick={() => onGenerateIndividualPhysioPdf(physio)}
                      className="text-xs font-semibold text-[#005052] dark:text-[#84d4d5] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Individual A4 PDF
                    </button>
                  )}
                </div>

                {qualifiedInMonth.length === 0 ? (
                  <div className="p-3 rounded-xl bg-[#faf8ff] dark:bg-[#131b2e] text-xs text-[#6e7979] text-center border border-dashed border-[#bec9c8]/30">
                    No clients finalized 100% full payment during {meta.qualifyingMonthName}.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {qualifiedInMonth.map((c) => {
                      const comm = Math.round((c.finalAmount * (physio.commissionRate || 25)) / 100);
                      return (
                        <div
                          key={c.id}
                          className="p-2.5 rounded-xl bg-[#faf8ff] dark:bg-[#131b2e] border border-[#bec9c8]/30 text-xs flex justify-between items-center"
                        >
                          <div>
                            <span className="font-bold text-[#131b2e] dark:text-[#faf8ff] block truncate max-w-[140px]">
                              {c.name}
                            </span>
                            <span className="text-[11px] text-[#6e7979]">{c.packageName}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-[#137333] dark:text-[#84d4d5] block">
                              +৳{comm.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-[#6e7979]">on ৳{c.finalAmount.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Staff Confirmation Modal */}
      {physioToDelete && (
        <ConfirmDeleteModal
          isOpen={true}
          onClose={() => setPhysioToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Physiotherapist Profile"
          itemName={`${physioToDelete.name} (${physioToDelete.title})`}
          itemType="staff"
          isPermanent={false}
          confirmText="Delete & Move to Recycle Bin"
        />
      )}
    </div>
  );
};
