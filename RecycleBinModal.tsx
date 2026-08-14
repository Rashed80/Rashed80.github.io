import React, { useState } from 'react';
import {
  Trash2,
  X,
  RotateCcw,
  User,
  UserCheck,
  CreditCard,
  Package as PackageIcon,
  Search,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { RecycleBinItem, RecycleBinType } from '../../types';
import { AppStorage } from '../../lib/storage';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface RecycleBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

export const RecycleBinModal: React.FC<RecycleBinModalProps> = ({
  isOpen,
  onClose,
  onDataChanged,
}) => {
  if (!isOpen) return null;

  const [activeFilter, setActiveFilter] = useState<'all' | RecycleBinType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Confirmation modal state for permanent delete
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
    type: string;
    all?: boolean;
  } | null>(null);

  const binItems = AppStorage.getRecycleBin();

  const filteredItems = binItems.filter((item) => {
    const matchesType = activeFilter === 'all' || item.type === activeFilter;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const countByType = {
    all: binItems.length,
    client: binItems.filter((i) => i.type === 'client').length,
    staff: binItems.filter((i) => i.type === 'staff').length,
    payment: binItems.filter((i) => i.type === 'payment').length,
    package: binItems.filter((i) => i.type === 'package').length,
  };

  const handleRestore = (item: RecycleBinItem) => {
    const res = AppStorage.restoreFromRecycleBin(item.id);
    if (res.success) {
      setToastMessage(res.message);
      onDataChanged();
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handlePermanentDeleteConfirm = () => {
    if (!deleteTarget) return;

    if (deleteTarget.all) {
      AppStorage.emptyRecycleBin();
      setToastMessage('Recycle Bin has been completely emptied.');
    } else {
      AppStorage.permanentlyDeleteFromRecycleBin(deleteTarget.id);
      setToastMessage(`Permanently deleted "${deleteTarget.name}".`);
    }

    setDeleteTarget(null);
    onDataChanged();
    setTimeout(() => setToastMessage(null), 4000);
  };

  const getItemIcon = (type: RecycleBinType) => {
    switch (type) {
      case 'client':
        return <User className="w-4 h-4 text-[#005052] dark:text-[#84d4d5]" />;
      case 'staff':
        return <UserCheck className="w-4 h-4 text-[#8a5a19] dark:text-[#ffdcb4]" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-[#137333] dark:text-[#8ce99a]" />;
      case 'package':
        return <PackageIcon className="w-4 h-4 text-[#7b1fa2] dark:text-[#e1bee7]" />;
      default:
        return <Trash2 className="w-4 h-4 text-[#6e7979]" />;
    }
  };

  const formatDeletedDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-[#283044] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-[#bec9c8]/30 max-h-[90vh] flex flex-col scale-100 animate-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 py-4 bg-[#f2f3ff] dark:bg-[#131b2e] border-b border-[#bec9c8]/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#005052] text-white flex items-center justify-center font-bold shadow-xs">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#131b2e] dark:text-[#faf8ff]">Recycle Bin & Recovery</h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#005052] text-white">
                    {binItems.length}
                  </span>
                </div>
                <p className="text-xs text-[#6e7979] dark:text-[#bec9c8] mt-0.5">
                  Accidentally deleted clients, staff, or payments can be restored here safely.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {binItems.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setDeleteTarget({
                      id: 'all',
                      name: 'all items in the Recycle Bin',
                      type: 'all',
                      all: true,
                    })
                  }
                  className="px-3 py-1.5 rounded-xl border border-[#ba1a1a]/30 text-[#ba1a1a] hover:bg-[#ffdad6]/30 text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Empty Bin
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-[#6e7979] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {toastMessage && (
            <div className="mx-5 mt-4 p-3 rounded-xl bg-[#e6f4ea] text-[#137333] border border-[#137333]/20 text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Filter Bar & Search */}
          <div className="p-4 border-b border-[#bec9c8]/20 space-y-3 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6e7979]" />
              <input
                type="text"
                placeholder="Search deleted records by name, ID, or package..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-[#bec9c8]/40 bg-white dark:bg-[#131b2e] text-xs text-[#131b2e] dark:text-[#faf8ff] placeholder-[#6e7979] focus:outline-none focus:ring-2 focus:ring-[#005052]"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 rounded-full font-semibold transition-colors ${
                  activeFilter === 'all'
                    ? 'bg-[#005052] text-white'
                    : 'bg-[#f2f3ff] dark:bg-[#131b2e] text-[#3e4949] dark:text-[#bec9c8]'
                }`}
              >
                All ({countByType.all})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('client')}
                className={`px-3 py-1 rounded-full font-semibold transition-colors ${
                  activeFilter === 'client'
                    ? 'bg-[#005052] text-white'
                    : 'bg-[#f2f3ff] dark:bg-[#131b2e] text-[#3e4949] dark:text-[#bec9c8]'
                }`}
              >
                Clients ({countByType.client})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('staff')}
                className={`px-3 py-1 rounded-full font-semibold transition-colors ${
                  activeFilter === 'staff'
                    ? 'bg-[#005052] text-white'
                    : 'bg-[#f2f3ff] dark:bg-[#131b2e] text-[#3e4949] dark:text-[#bec9c8]'
                }`}
              >
                Physiotherapists ({countByType.staff})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('payment')}
                className={`px-3 py-1 rounded-full font-semibold transition-colors ${
                  activeFilter === 'payment'
                    ? 'bg-[#005052] text-white'
                    : 'bg-[#f2f3ff] dark:bg-[#131b2e] text-[#3e4949] dark:text-[#bec9c8]'
                }`}
              >
                Payments ({countByType.payment})
              </button>
            </div>
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[220px]">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-[#eaedff] dark:bg-[#131b2e] text-[#005052] dark:text-[#84d4d5] flex items-center justify-center mx-auto">
                  <RotateCcw className="w-7 h-7 opacity-70" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#131b2e] dark:text-[#faf8ff]">Recycle Bin is Empty</h4>
                  <p className="text-xs text-[#6e7979] dark:text-[#bec9c8] mt-1 max-w-sm mx-auto">
                    {searchQuery
                      ? 'No deleted records matched your search query.'
                      : 'Deleted clients, staff members, and payments will safely appear here for instant 1-click recovery.'}
                  </p>
                </div>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-white dark:bg-[#131b2e] border border-[#bec9c8]/30 hover:border-[#005052] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#f2f3ff] dark:bg-[#283044] border border-[#bec9c8]/30 flex items-center justify-center shrink-0 mt-0.5">
                      {getItemIcon(item.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#131b2e] dark:text-[#faf8ff] truncate">
                          {item.title}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#eaedff] dark:bg-[#283044] text-[#005052] dark:text-[#84d4d5]">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-xs text-[#6e7979] dark:text-[#bec9c8] mt-0.5 truncate">{item.subtitle}</p>
                      <div className="flex items-center gap-2 text-[11px] text-[#6e7979] mt-1">
                        <Calendar className="w-3 h-3 text-[#005052]" />
                        <span>Deleted: {formatDeletedDate(item.deletedAt)}</span>
                        {item.relatedPayments && item.relatedPayments.length > 0 && (
                          <span className="text-[#137333] font-medium">
                            • {item.relatedPayments.length} linked payments preserved
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-[#bec9c8]/20 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => handleRestore(item)}
                      className="px-3 py-1.5 rounded-xl bg-[#005052] text-white hover:bg-[#006a6c] active:scale-95 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
                      title="Restore back to active database"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restore
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteTarget({
                          id: item.id,
                          name: item.title,
                          type: item.type,
                        })
                      }
                      className="p-1.5 rounded-xl border border-[#ba1a1a]/30 text-[#ba1a1a] hover:bg-[#ffdad6]/30 text-xs font-semibold transition-colors"
                      title="Permanently remove forever"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-[#f2f3ff] dark:bg-[#131b2e] border-t border-[#bec9c8]/20 flex items-center justify-between text-xs text-[#6e7979] shrink-0">
            <span>Deleted records are preserved locally in browser storage.</span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl border border-[#bec9c8]/40 text-[#3e4949] dark:text-[#bec9c8] font-semibold hover:bg-white dark:hover:bg-[#283044]"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Permanent Delete */}
      {deleteTarget && (
        <ConfirmDeleteModal
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handlePermanentDeleteConfirm}
          title={deleteTarget.all ? 'Empty Recycle Bin?' : 'Permanently Delete Record?'}
          itemName={deleteTarget.name}
          isPermanent={true}
          confirmText={deleteTarget.all ? 'Empty Bin Forever' : 'Delete Permanently'}
        />
      )}
    </>
  );
};
