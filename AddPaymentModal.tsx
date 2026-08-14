import React, { useState } from 'react';
import { X, CreditCard, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Client, Payment, PaymentMethod, Physiotherapist } from '../../types';

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payment: Payment) => void;
  clients: Client[];
  payments: Payment[];
  physiotherapists: Physiotherapist[];
  preSelectedClientId?: string;
  editingPayment?: Payment | null;
}

export const AddPaymentModal: React.FC<AddPaymentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  clients,
  payments,
  physiotherapists,
  preSelectedClientId,
  editingPayment,
}) => {
  if (!isOpen) return null;

  const activeClients = clients.filter((c) => !c.archived);
  const defaultClientId =
    editingPayment?.clientId || preSelectedClientId || activeClients[0]?.id || '';

  const [clientId, setClientId] = useState<string>(defaultClientId);
  const selectedClient = clients.find((c) => c.id === clientId) || activeClients[0];

  // Calculate current client balance
  const clientPayments = payments.filter((p) => p.clientId === selectedClient?.id);
  const existingPaid = clientPayments
    .filter((p) => p.id !== editingPayment?.id)
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPackageAmount = selectedClient?.finalAmount || 0;
  const remainingDue = Math.max(0, totalPackageAmount - existingPaid);

  const [amount, setAmount] = useState<number>(editingPayment?.amount || remainingDue || 5000);
  const [paymentDate, setPaymentDate] = useState<string>(
    editingPayment?.paymentDate || new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    editingPayment?.paymentMethod || 'bKash'
  );
  const [reference, setReference] = useState<string>(editingPayment?.reference || '');
  const [notes, setNotes] = useState<string>(editingPayment?.notes || '');

  // Overpayment check
  const overpaymentDifference = amount - remainingDue;
  const isOverpaying = overpaymentDifference > 0;

  const assignedPhysio = physiotherapists.find(
    (p) => p.id === selectedClient?.physiotherapistId
  );
  const commRate = assignedPhysio?.commissionRate || 25;
  const calculatedCommission = Math.round((amount * commRate) / 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || amount <= 0) return;

    const newPayment: Payment = {
      id: editingPayment?.id || `pay-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      clientId,
      physiotherapistId: selectedClient?.physiotherapistId || 'physio-1',
      amount,
      paymentDate,
      paymentMethod,
      reference,
      notes,
      commissionRateSnapshot: commRate,
      commissionAmount: calculatedCommission,
      createdAt: editingPayment?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newPayment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#283044] rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-[#bec9c8]/30">
        {/* Header */}
        <div className="px-5 py-4 bg-[#f2f3ff] dark:bg-[#131b2e] border-b border-[#bec9c8]/20 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-base text-[#131b2e] dark:text-[#faf8ff]">
              {editingPayment ? 'Edit Payment Record' : 'Record Client Payment'}
            </h3>
            <p className="text-xs text-[#6e7979]">
              Physio Commission Rate: <strong className="font-bold">{commRate}%</strong>
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-[#6e7979] hover:bg-[#eaedff]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Client Selector */}
          <div>
            <label className="font-semibold text-[#131b2e] dark:text-[#faf8ff] block mb-1">
              Select Client *
            </label>
            <select
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value);
                const c = clients.find((x) => x.id === e.target.value);
                if (c) {
                  const cPays = payments.filter((p) => p.clientId === c.id);
                  const paid = cPays.reduce((sum, p) => sum + p.amount, 0);
                  setAmount(Math.max(0, c.finalAmount - paid));
                }
              }}
              className="w-full h-10 px-3 rounded-xl border border-[#bec9c8]/40 bg-white dark:bg-[#131b2e] text-[#131b2e] dark:text-[#faf8ff] font-medium focus:outline-none"
            >
              {activeClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.id}) — Enrolled {c.enrollmentDate}
                </option>
              ))}
            </select>
          </div>

          {/* Balance Context Summary */}
          {selectedClient && (
            <div className="p-3 rounded-xl bg-[#eaedff] dark:bg-[#131b2e] flex justify-between items-center text-xs">
              <div>
                <span className="text-[#6e7979] block">Package Value</span>
                <span className="font-bold text-[#131b2e] dark:text-[#faf8ff]">
                  ৳{selectedClient.finalAmount.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[#6e7979] block">Paid So Far</span>
                <span className="font-bold text-[#28695c]">৳{existingPaid.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[#6e7979] block">Current Due</span>
                <span className="font-bold text-[#ba1a1a]">৳{remainingDue.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[#131b2e] dark:text-[#faf8ff] block mb-1">
                Payment Amount (৳) *
              </label>
              <input
                type="number"
                required
                min={1}
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full h-10 px-3 rounded-xl border border-[#bec9c8]/40 bg-white dark:bg-[#131b2e] text-[#131b2e] dark:text-[#faf8ff] font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#005052]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#131b2e] dark:text-[#faf8ff] block mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[#bec9c8]/40 bg-white dark:bg-[#131b2e] text-[#131b2e] dark:text-[#faf8ff] focus:outline-none"
              />
            </div>
          </div>

          {/* Overpayment Alert */}
          {isOverpaying && (
            <div className="p-3 rounded-xl bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#93000a] text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#ba1a1a]" />
                Overpayment Warning
              </div>
              <p>
                Payment of <strong>৳{amount.toLocaleString()}</strong> exceeds the remaining due (৳
                {remainingDue.toLocaleString()}) by <strong>৳{overpaymentDifference.toLocaleString()}</strong>.
              </p>
              <button
                type="button"
                onClick={() => setAmount(remainingDue)}
                className="mt-1 text-[11px] font-bold underline"
              >
                Set exact due amount (৳{remainingDue.toLocaleString()})
              </button>
            </div>
          )}

          {/* Payment Method */}
          <div>
            <label className="font-semibold text-[#131b2e] dark:text-[#faf8ff] block mb-1">
              Payment Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full h-10 px-3 rounded-xl border border-[#bec9c8]/40 bg-white dark:bg-[#131b2e] text-[#131b2e] dark:text-[#faf8ff] font-semibold focus:outline-none"
            >
              <option value="bKash">bKash (Mobile Banking)</option>
              <option value="Cash">Cash Handover</option>
              <option value="Bank Transfer">Bank Transfer (EFT)</option>
              <option value="Nagad">Nagad (Mobile Banking)</option>
              <option value="Card">POS Credit/Debit Card</option>
              <option value="Other">Other Method</option>
            </select>
          </div>

          {/* Reference & Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[#131b2e] dark:text-[#faf8ff] block mb-1">
                Transaction Ref / TrxID
              </label>
              <input
                type="text"
                placeholder="e.g. BK8923108"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-[#bec9c8]/40 bg-white dark:bg-[#131b2e] text-[#131b2e] dark:text-[#faf8ff] focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-[#131b2e] dark:text-[#faf8ff] block mb-1">
                Installment Note
              </label>
              <input
                type="text"
                placeholder="e.g. 2nd Installment"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-[#bec9c8]/40 bg-white dark:bg-[#131b2e] text-[#131b2e] dark:text-[#faf8ff] focus:outline-none"
              />
            </div>
          </div>

          {/* Commission Calculation Preview */}
          <div className="p-2.5 rounded-xl bg-[#faf8ff] dark:bg-[#131b2e] border border-[#bec9c8]/20 flex justify-between items-center text-xs">
            <span className="text-[#6e7979]">Calculated Physio Commission ({commRate}%):</span>
            <span className="font-bold text-[#005052] dark:text-[#84d4d5]">
              ৳{calculatedCommission.toLocaleString()}
            </span>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#bec9c8]/40 text-[#6e7979] font-semibold hover:bg-[#f2f3ff]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#005052] text-white font-semibold hover:bg-[#006a6c] active:scale-95 shadow-xs"
            >
              Save Payment Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
