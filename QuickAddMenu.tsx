import React from 'react';
import { X, CreditCard, UserPlus, UserCheck, Package } from 'lucide-react';

interface QuickAddMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPayment: () => void;
  onAddClient: () => void;
  onAddStaff: () => void;
}

export const QuickAddMenu: React.FC<QuickAddMenuProps> = ({
  isOpen,
  onClose,
  onAddPayment,
  onAddClient,
  onAddStaff,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
      <div className="bg-white dark:bg-[#283044] rounded-2xl w-full max-w-sm shadow-xl p-5 border border-[#bec9c8]/30 space-y-4 animate-in fade-in slide-in-from-bottom-5">
        <div className="flex justify-between items-center pb-2 border-b border-[#bec9c8]/20">
          <h3 className="font-bold text-base text-[#131b2e] dark:text-[#faf8ff]">
            Quick Action
          </h3>
          <button onClick={onClose} className="p-1 rounded-full text-[#6e7979] hover:bg-[#eaedff]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <button
            onClick={() => {
              onClose();
              onAddPayment();
            }}
            className="w-full p-3 rounded-xl bg-[#faf8ff] dark:bg-[#131b2e] border border-[#bec9c8]/30 flex items-center gap-3 font-semibold text-[#005052] dark:text-[#84d4d5] hover:bg-[#eaedff] transition-all text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-[#005052]/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[#005052]" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#131b2e] dark:text-[#faf8ff]">Record Payment</div>
              <div className="text-[#6e7979] text-[11px]">Log new installment for client</div>
            </div>
          </button>

          <button
            onClick={() => {
              onClose();
              onAddClient();
            }}
            className="w-full p-3 rounded-xl bg-[#faf8ff] dark:bg-[#131b2e] border border-[#bec9c8]/30 flex items-center gap-3 font-semibold text-[#005052] dark:text-[#84d4d5] hover:bg-[#eaedff] transition-all text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-[#005052]/10 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-[#005052]" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#131b2e] dark:text-[#faf8ff]">Enroll New Client</div>
              <div className="text-[#6e7979] text-[11px]">Register client profile & package</div>
            </div>
          </button>

          <button
            onClick={() => {
              onClose();
              onAddStaff();
            }}
            className="w-full p-3 rounded-xl bg-[#faf8ff] dark:bg-[#131b2e] border border-[#bec9c8]/30 flex items-center gap-3 font-semibold text-[#005052] dark:text-[#84d4d5] hover:bg-[#eaedff] transition-all text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-[#005052]/10 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-[#005052]" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#131b2e] dark:text-[#faf8ff]">Add Staff Member</div>
              <div className="text-[#6e7979] text-[11px]">Add physiotherapist & rate</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
