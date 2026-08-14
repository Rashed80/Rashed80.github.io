import React, { useState } from 'react';
import { X, CheckCircle2, DollarSign } from 'lucide-react';
import { CommissionSettlement, PaymentMethod, Physiotherapist } from '../../types';

interface SettleCommissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  physiotherapist: Physiotherapist | null;
  outstandingAmount: number;
  onSave: (settlement: CommissionSettlement) => void;
}

export const SettleCommissionModal: React.FC<SettleCommissionModalProps> = ({
  isOpen,
  onClose,
  physiotherapist,
  outstandingAmount,
  onSave,
}) => {
  if (!isOpen || !physiotherapist) return null;

  const [amount, setAmount] = useState<number>(outstandingAmount);
  const [settlementDate, setSettlementDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('Commission payout settlement');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    const settlement: CommissionSettlement = {
      id: `stl-${Date.now()}`,
      physiotherapistId: physiotherapist.id,
      amount,
      settlementDate,
      paymentMethod,
      reference,
      notes,
      createdAt: new Date().toISOString(),
    };

    onSave(settlement);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#283044] rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-[#bec9c8]/30">
        <div className="px-5 py-4 bg-[#f2f3ff] dark:bg-[#131b2e] border-b border-[#bec9c8]/20 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-base text-[#131b2e] dark:text-[#faf8ff]">
              Settle Commission Payout
            </h3>
            <p className="text-xs text-[#6e7979]">Physiotherapist: {physiotherapist.name}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-[#6e7979] hover:bg-[#eaedff]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="p-3 bg-[#eaedff] dark:bg-[#131b2e] rounded-xl flex justify-between items-center">
            <span className="text-[#6e7979]">Total Outstanding Payout:</span>
            <span className="font-bold text-base text-[#ba1a1a]">
              ৳{outstandingAmount.toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[#131b2e] dark:text-[#faf8ff] block mb-1">
                Payout Amount (৳) *
              </label>
              <input
                type="number"
                required
                min={1}
                max={outstandingAmount}
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full h-10 px-3 rounded-xl border border-[#bec9c8]/40 bg-white dark:bg-[#131b2e] text-[#131b2e] dark:text-[#faf8ff] font-bold text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-[#131b2e] dark:text-[#faf8ff] block mb-1">
                Payout Date *
              </label>
              <input
                type="date"
                required
                value={settlementDate}
                onChange={(e) => setSettlementDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[#bec9c8]/40 bg-white dark:bg-[#131b2e] text-[#131b2e] dark:text-[#faf8ff] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-[#131b2e] dark:text-[#faf8ff] block mb-1">
              Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full h-10 px-3 rounded-xl border border-[#bec9c8]/40 bg-white dark:bg-[#131b2e] text-[#131b2e] dark:text-[#faf8ff] focus:outline-none"
            >
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="bKash">bKash</option>
              <option value="Cash">Cash</option>
              <option value="Nagad">Nagad</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-[#131b2e] dark:text-[#faf8ff] block mb-1">
              Reference / Ref Code
            </label>
            <input
              type="text"
              placeholder="e.g. PAYROLL-AUG-01"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-[#bec9c8]/40 bg-white dark:bg-[#131b2e] text-[#131b2e] dark:text-[#faf8ff] focus:outline-none"
            />
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
              className="px-5 py-2 rounded-xl bg-[#005052] text-white font-semibold hover:bg-[#006a6c] active:scale-95 shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm Payout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
