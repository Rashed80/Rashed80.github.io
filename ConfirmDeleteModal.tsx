import React from 'react';
import { AlertTriangle, Trash2, X, RotateCcw, ShieldAlert } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  itemName?: string;
  itemType?: 'client' | 'staff' | 'payment' | 'package' | 'recycle_bin' | 'generic';
  isPermanent?: boolean;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  itemName,
  itemType = 'generic',
  isPermanent = false,
  confirmText,
  cancelText = 'Cancel',
}) => {
  if (!isOpen) return null;

  const defaultConfirmText = isPermanent ? 'Delete Permanently' : 'Delete & Move to Recycle Bin';
  const buttonText = confirmText || defaultConfirmText;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#283044] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-[#bec9c8]/30 flex flex-col scale-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#ffdad6]/40 dark:bg-[#ba1a1a]/20 border-b border-[#bec9c8]/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0 shadow-xs">
              {isPermanent ? <ShieldAlert className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-[#131b2e] dark:text-[#faf8ff]">{title}</h2>
              <span className="text-[11px] font-semibold text-[#ba1a1a]">Action requires confirmation</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#6e7979] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-sm">
          {itemName && (
            <div className="p-3 rounded-xl bg-[#faf8ff] dark:bg-[#131b2e] border border-[#bec9c8]/30">
              <span className="text-[11px] font-semibold text-[#6e7979] dark:text-[#bec9c8] uppercase tracking-wider block mb-0.5">
                Target Record:
              </span>
              <p className="font-bold text-[#131b2e] dark:text-[#faf8ff] text-sm break-words">{itemName}</p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-[#3e4949] dark:text-[#eef0ff] leading-relaxed">
              {isPermanent
                ? 'Are you sure you want to permanently delete this item? This action is irreversible and the record cannot be recovered.'
                : 'Are you sure you want to delete this record?'}
            </p>

            {!isPermanent && (
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-[#e6f4ea] dark:bg-[#137333]/15 text-[#137333] dark:text-[#84d4d5] text-xs font-medium border border-[#137333]/20">
                <RotateCcw className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Safety guarantee:</strong> This record will be safely stored in the{' '}
                  <strong>Recycle Bin</strong> where you can restore it anytime in case of accidental deletion.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-[#f2f3ff] dark:bg-[#131b2e] border-t border-[#bec9c8]/20 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#bec9c8]/40 text-[#3e4949] dark:text-[#bec9c8] font-semibold text-xs hover:bg-white dark:hover:bg-[#283044] transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-[#ba1a1a] text-white font-semibold text-xs hover:bg-red-800 active:scale-95 transition-all shadow-xs flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};
