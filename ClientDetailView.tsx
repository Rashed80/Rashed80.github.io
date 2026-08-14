import React, { useState } from 'react';
import {
  ArrowLeft,
  FileText,
  Edit2,
  Plus,
  Wallet,
  History,
  Phone,
  Mail,
  UserCheck,
  Trash2,
  Calendar,
  Percent,
  CheckCircle2,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { Client, Payment, Physiotherapist } from '../types';
import { evaluateClientCommission } from '../lib/commissionRules';
import { ConfirmDeleteModal } from './modals/ConfirmDeleteModal';

interface ClientDetailViewProps {
  client: Client;
  payments: Payment[];
  physiotherapist?: Physiotherapist;
  onBack: () => void;
  onEditClient: (client: Client) => void;
  onDeleteClient?: (clientId: string) => void;
  onAddPayment: (clientId: string) => void;
  onEditPayment: (payment: Payment) => void;
  onDeletePayment: (paymentId: string) => void;
  onGeneratePdf: (client: Client) => void;
  onMarkFullyPaid?: (clientId: string) => void;
}

export const ClientDetailView: React.FC<ClientDetailViewProps> = ({
  client,
  payments,
  physiotherapist,
  onBack,
  onEditClient,
  onDeleteClient,
  onAddPayment,
  onEditPayment,
  onDeletePayment,
  onGeneratePdf,
  onMarkFullyPaid,
}) => {
  const [isDeleteClientModalOpen, setIsDeleteClientModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const dueAmount = Math.max(0, client.finalAmount - totalPaid);
  const paidPercent = Math.min(100, Math.round((totalPaid / (client.finalAmount || 1)) * 100));

  const commEval = evaluateClientCommission(
    client,
    payments,
    physiotherapist ? [physiotherapist] : []
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const handleConfirmDeleteClient = () => {
    if (onDeleteClient) {
      onDeleteClient(client.id);
      setIsDeleteClientModalOpen(false);
    }
  };

  const handleConfirmDeletePayment = () => {
    if (paymentToDelete) {
      onDeletePayment(paymentToDelete.id);
      setPaymentToDelete(null);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-[#bec9c8]/20 pb-4 flex-wrap gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-[#005052] dark:text-[#84d4d5] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Clients
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onGeneratePdf(client)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#bec9c8]/40 bg-white dark:bg-[#283044] text-xs font-semibold text-[#005052] dark:text-[#84d4d5] hover:bg-[#f2f3ff] transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Generate Statement</span> PDF
          </button>

          <button
            onClick={() => onEditClient(client)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#bec9c8]/40 bg-white dark:bg-[#283044] text-xs font-semibold text-[#3e4949] dark:text-[#eef0ff] hover:bg-[#f2f3ff] transition-colors cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
            Edit Info
          </button>

          {onDeleteClient && (
            <button
              onClick={() => setIsDeleteClientModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ffdad6] hover:bg-[#ba1a1a] text-[#ba1a1a] hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              title="Delete Client Profile (Moves to Recycle Bin)"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Client Profile Hero */}
      <div className="text-center bg-white dark:bg-[#283044] rounded-2xl p-6 shadow-xs border border-[#bec9c8]/30">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#006a6c] text-[#97e7e9] text-2xl font-bold mb-3 border-2 border-white shadow-xs">
          {getInitials(client.name)}
        </div>
        <h1 className="text-2xl font-bold text-[#131b2e] dark:text-[#faf8ff]">{client.name}</h1>
        <p className="text-xs text-[#6e7979] dark:text-[#bec9c8] mt-1">ID: {client.id}</p>
        <div className="inline-block mt-2 px-3 py-1 rounded-full bg-[#f2f3ff] dark:bg-[#131b2e] text-xs font-medium text-[#3e4949] dark:text-[#eef0ff]">
          Enrolled {client.enrollmentDate}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Financial Summary Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-[#283044] rounded-2xl p-5 shadow-xs border border-[#bec9c8]/30 space-y-5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#6e7979] uppercase tracking-wider">
              <Wallet className="w-4 h-4 text-[#005052]" />
              Financial Summary
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-semibold text-sm text-[#131b2e] dark:text-[#faf8ff]">
                  {client.packageName}
                </span>
                <span className="font-bold text-lg text-[#005052] dark:text-[#84d4d5]">
                  ৳{client.finalAmount.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-[#6e7979]">Total Package Value</p>
            </div>

            <div className="space-y-3 pt-3 border-t border-[#bec9c8]/20">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#6e7979]">Total Paid</span>
                <span className="font-bold text-[#131b2e] dark:text-[#faf8ff]">
                  ৳{totalPaid.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#6e7979]">Amount Due</span>
                <span className={`font-bold ${dueAmount > 0 ? 'text-[#ba1a1a]' : 'text-[#28695c]'}`}>
                  ৳{dueAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="pt-2">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-bold text-[#005052] dark:text-[#84d4d5]">{paidPercent}% Paid</span>
                <span className="text-[#6e7979]">৳{client.finalAmount.toLocaleString()} Total</span>
              </div>
              <div className="w-full bg-[#f2f3ff] dark:bg-[#131b2e] h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#005052] h-full rounded-full transition-all duration-500"
                  style={{ width: `${paidPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              {dueAmount > 0 && onMarkFullyPaid && (
                <button
                  type="button"
                  onClick={() => onMarkFullyPaid(client.id)}
                  className="w-full py-2.5 rounded-xl bg-[#e6f4ea] hover:bg-[#137333] text-[#137333] hover:text-white text-xs font-bold flex items-center justify-center gap-2 border border-[#137333]/30 active:scale-95 transition-all shadow-2xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-current" />
                  Quick Action: Settle Due (৳{dueAmount.toLocaleString()}) & Mark Fully Paid
                </button>
              )}

              <button
                onClick={() => onAddPayment(client.id)}
                className="w-full py-2.5 rounded-xl bg-[#005052] text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#006a6c] active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Record Custom Payment
              </button>
            </div>
          </div>

          {/* Client Details Card */}
          <div className="bg-white dark:bg-[#283044] rounded-2xl p-5 shadow-xs border border-[#bec9c8]/30 space-y-4">
            <h3 className="text-xs font-bold text-[#6e7979] uppercase tracking-wider">
              Client Contact & Info
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#005052] shrink-0" />
                <span className="text-[#131b2e] dark:text-[#faf8ff] font-medium">{client.phone}</span>
              </div>

              {client.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-[#005052] shrink-0" />
                  <span className="text-[#131b2e] dark:text-[#faf8ff] truncate">{client.email}</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <UserCheck className="w-4 h-4 text-[#005052] shrink-0" />
                <span className="text-[#131b2e] dark:text-[#faf8ff]">
                  Physio: <strong className="font-semibold">{physiotherapist?.name || 'Unassigned'}</strong>
                </span>
              </div>

              {client.notes && (
                <div className="pt-2 border-t border-[#bec9c8]/20">
                  <p className="text-[#6e7979] italic">"{client.notes}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Commission Qualification Status Card */}
          <div className="bg-white dark:bg-[#283044] rounded-2xl p-5 shadow-xs border border-[#bec9c8]/30 space-y-3 text-xs">
            <h3 className="font-bold text-[#6e7979] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-[#005052] dark:text-[#84d4d5]" />
              Staff Commission Payout Rule
            </h3>

            {commEval.isFullyPaid ? (
              <div className="space-y-2 bg-[#e6f4ea] dark:bg-[#005052]/20 p-3 rounded-xl border border-[#137333]/20 dark:border-[#84d4d5]/30">
                <div className="flex items-center gap-1.5 font-bold text-[#137333] dark:text-[#84d4d5]">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Fully Paid & Qualified</span>
                </div>
                <div className="space-y-1 text-[11px] text-[#3e4949] dark:text-[#eef0ff]">
                  <div className="flex justify-between">
                    <span className="text-[#6e7979]">Paid in Full:</span>
                    <span className="font-semibold">{commEval.fullPaymentDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6e7979]">Commission Month:</span>
                    <span className="font-semibold">{commEval.commissionMonthName || commEval.commissionMonthKey}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6e7979]">Payout Date:</span>
                    <span className="font-bold text-[#005052] dark:text-[#84d4d5]">
                      {commEval.commissionPayoutFormatted || commEval.commissionPayoutDate}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[#137333]/20">
                    <span className="text-[#6e7979]">Earned Commission:</span>
                    <span className="font-bold text-[#137333] dark:text-[#84d4d5]">
                      ৳{commEval.commissionAmount.toLocaleString()} ({commEval.commissionRate}%)
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 bg-[#fff8e1] dark:bg-[#8a5a19]/20 p-3 rounded-xl border border-[#8a5a19]/30 text-[#8a5a19] dark:text-[#ffdcb4]">
                <div className="flex items-center gap-1.5 font-bold text-[11px]">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>Pending Full Payment</span>
                </div>
                <p className="text-[10px] leading-relaxed opacity-90">
                  Per clinic commission policy, staff commission qualifies only after the client has settled 100% of their package fee.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Payment History Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#283044] rounded-2xl p-6 shadow-xs border border-[#bec9c8]/30 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#005052] dark:text-[#84d4d5]" />
                <h2 className="font-bold text-lg text-[#131b2e] dark:text-[#faf8ff]">
                  Payment Records History
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#f2f3ff] dark:bg-[#131b2e] text-xs font-semibold text-[#005052] dark:text-[#84d4d5]">
                {payments.length} Installment{payments.length !== 1 ? 's' : ''}
              </span>
            </div>

            {payments.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#6e7979]">
                No payments recorded yet for this client.
              </div>
            ) : (
              <div className="relative border-l-2 border-[#f2f3ff] dark:border-[#131b2e] ml-3 space-y-6 pl-6 pb-2">
                {payments.map((p, idx) => (
                  <div key={`${p.id}-${idx}`} className="relative group">
                    {/* Timeline Node */}
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-[#acecdc] border-2 border-white dark:border-[#283044] flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#005052]"></div>
                    </div>

                    <div className="bg-[#faf8ff] dark:bg-[#131b2e] p-3.5 rounded-xl border border-[#bec9c8]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-[#131b2e] dark:text-[#faf8ff]">
                            ৳{p.amount.toLocaleString()}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-[#eaedff] dark:bg-[#283044] text-[#005052] dark:text-[#84d4d5] text-[11px] font-semibold">
                            {p.paymentMethod}
                          </span>
                        </div>

                        {p.notes && (
                          <p className="text-xs text-[#3e4949] dark:text-[#eef0ff] mt-1">{p.notes}</p>
                        )}
                        {p.reference && (
                          <p className="text-[11px] text-[#6e7979] mt-0.5">Ref: {p.reference}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#bec9c8]/20">
                        <span className="text-xs text-[#6e7979]">{p.paymentDate}</span>

                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEditPayment(p)}
                            title="Edit Payment"
                            className="p-1 rounded-lg text-[#3e4949] hover:bg-[#eaedff] transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setPaymentToDelete(p)}
                            title="Delete Payment (Moves to Recycle Bin)"
                            className="p-1 rounded-lg text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Client Deletion */}
      <ConfirmDeleteModal
        isOpen={isDeleteClientModalOpen}
        onClose={() => setIsDeleteClientModalOpen(false)}
        onConfirm={handleConfirmDeleteClient}
        title="Delete Client Profile"
        itemName={`${client.name} (${client.id})`}
        itemType="client"
        isPermanent={false}
        confirmText="Delete & Move to Recycle Bin"
      />

      {/* Confirmation Modal for Payment Deletion */}
      {paymentToDelete && (
        <ConfirmDeleteModal
          isOpen={true}
          onClose={() => setPaymentToDelete(null)}
          onConfirm={handleConfirmDeletePayment}
          title="Delete Payment Record"
          itemName={`৳${paymentToDelete.amount.toLocaleString()} on ${paymentToDelete.paymentDate} (${paymentToDelete.paymentMethod})`}
          itemType="payment"
          isPermanent={false}
          confirmText="Delete & Move to Recycle Bin"
        />
      )}
    </div>
  );
};
