import React from 'react';
import { Plus, CloudCheck, WifiOff, RefreshCw } from 'lucide-react';
import { ViewTab } from '../types';
import { FitbackLogo } from '../assets/FitbackLogo';

interface TopAppBarProps {
  currentTab: ViewTab;
  onOpenQuickAdd: () => void;
  isOnline: boolean;
  isSyncing: boolean;
  onRefreshData: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  onOpenQuickAdd,
  isOnline,
  isSyncing,
  onRefreshData,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full h-14 md:h-16 bg-[#faf8ff] dark:bg-[#131b2e] border-b border-[#bec9c8]/30 px-4 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        {/* Practice Logo */}
        <FitbackLogo className="h-9 md:h-10 shrink-0" showTagline={false} />
      </div>

      <div className="flex items-center gap-2">
        {/* Sync Status Badge */}
        <button
          onClick={onRefreshData}
          title="Click to sync data"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#f2f3ff] dark:bg-[#283044] text-[#3e4949] dark:text-[#eef0ff] border border-[#bec9c8]/40 hover:bg-[#eaedff] transition-colors"
        >
          {isSyncing ? (
            <RefreshCw className="w-3.5 h-3.5 text-[#005052] animate-spin" />
          ) : isOnline ? (
            <CloudCheck className="w-3.5 h-3.5 text-[#28695c]" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-[#ba1a1a]" />
          )}
          <span className="hidden sm:inline">
            {isSyncing ? 'Syncing...' : isOnline ? 'Synced' : 'Offline'}
          </span>
        </button>

        {/* Floating Quick Add Button */}
        <button
          onClick={onOpenQuickAdd}
          aria-label="Add new record"
          className="w-9 h-9 rounded-full bg-[#005052] text-white flex items-center justify-center shadow-sm hover:bg-[#006a6c] active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
