import React from 'react';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  BarChart3,
  MoreHorizontal,
  CreditCard,
  Building2,
  FileText,
  Settings,
} from 'lucide-react';
import { ViewTab } from '../types';
import { Avatar } from './common/Avatar';

interface BottomNavBarProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentTab, onTabChange }) => {
  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-[#ffffff] dark:bg-[#131b2e] border-t border-[#bec9c8]/30 shadow-[0px_-4px_12px_rgba(0,0,0,0.05)] flex justify-around items-center px-2 pb-safe">
        {/* Dashboard */}
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 active:scale-90 ${
            currentTab === 'dashboard'
              ? 'bg-[#acecdc] text-[#2d6d60] font-bold'
              : 'text-[#6e7979] dark:text-[#bec9c8]'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">Dashboard</span>
        </button>

        {/* Clients */}
        <button
          onClick={() => onTabChange('clients')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 active:scale-90 ${
            currentTab === 'clients'
              ? 'bg-[#acecdc] text-[#2d6d60] font-bold'
              : 'text-[#6e7979] dark:text-[#bec9c8]'
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">Clients</span>
        </button>

        {/* Staff & Commissions */}
        <button
          onClick={() => onTabChange('staff')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 active:scale-90 ${
            currentTab === 'staff'
              ? 'bg-[#acecdc] text-[#2d6d60] font-bold'
              : 'text-[#6e7979] dark:text-[#bec9c8]'
          }`}
        >
          <UserCheck className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">Staff</span>
        </button>

        {/* Reports */}
        <button
          onClick={() => onTabChange('reports')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 active:scale-90 ${
            currentTab === 'reports'
              ? 'bg-[#acecdc] text-[#2d6d60] font-bold'
              : 'text-[#6e7979] dark:text-[#bec9c8]'
          }`}
        >
          <BarChart3 className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">Reports</span>
        </button>

        {/* More / Settings */}
        <button
          onClick={() => onTabChange('more')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 active:scale-90 ${
            currentTab === 'more'
              ? 'bg-[#acecdc] text-[#2d6d60] font-bold'
              : 'text-[#6e7979] dark:text-[#bec9c8]'
          }`}
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">More</span>
        </button>
      </nav>

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 bg-[#ffffff] dark:bg-[#131b2e] border-r border-[#bec9c8]/30 h-screen sticky top-0 shrink-0 p-4 space-y-6">
        <div className="flex items-center gap-3 px-2 py-3 border-b border-[#bec9c8]/20">
          <div className="w-10 h-10 rounded-xl bg-[#005052] text-white flex items-center justify-center font-bold text-lg">
            FR
          </div>
          <div>
            <h1 className="font-bold text-base text-[#005052] dark:text-[#84d4d5]">
              Fitback Reset
            </h1>
            <p className="text-xs text-[#6e7979]">Practice Management</p>
          </div>
        </div>

        <div className="space-y-1.5 flex-1">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              currentTab === 'dashboard'
                ? 'bg-[#acecdc] text-[#2d6d60] font-semibold'
                : 'text-[#3e4949] dark:text-[#eef0ff] hover:bg-[#f2f3ff] dark:hover:bg-[#283044]'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>

          <button
            onClick={() => onTabChange('clients')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              currentTab === 'clients'
                ? 'bg-[#acecdc] text-[#2d6d60] font-semibold'
                : 'text-[#3e4949] dark:text-[#eef0ff] hover:bg-[#f2f3ff] dark:hover:bg-[#283044]'
            }`}
          >
            <Users className="w-5 h-5" />
            Clients & Payments
          </button>

          <button
            onClick={() => onTabChange('staff')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              currentTab === 'staff'
                ? 'bg-[#acecdc] text-[#2d6d60] font-semibold'
                : 'text-[#3e4949] dark:text-[#eef0ff] hover:bg-[#f2f3ff] dark:hover:bg-[#283044]'
            }`}
          >
            <UserCheck className="w-5 h-5" />
            Staff & Commissions
          </button>

          <button
            onClick={() => onTabChange('reports')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              currentTab === 'reports'
                ? 'bg-[#acecdc] text-[#2d6d60] font-semibold'
                : 'text-[#3e4949] dark:text-[#eef0ff] hover:bg-[#f2f3ff] dark:hover:bg-[#283044]'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Financial Reports
          </button>

          <button
            onClick={() => onTabChange('more')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              currentTab === 'more'
                ? 'bg-[#acecdc] text-[#2d6d60] font-semibold'
                : 'text-[#3e4949] dark:text-[#eef0ff] hover:bg-[#f2f3ff] dark:hover:bg-[#283044]'
            }`}
          >
            <Settings className="w-5 h-5" />
            Cloud & Settings
          </button>
        </div>

        {/* Practice Admin Profile Badge */}
        <div className="p-3 bg-[#f2f3ff] dark:bg-[#283044] rounded-xl flex items-center gap-3">
          <Avatar
            src="https://images.unsplash.com/photo-1594824813566-78a933f38f15?w=100&auto=format&fit=crop&q=80"
            name="Farhana Jahan"
            sizeClassName="w-10 h-10"
            className="border border-[#bec9c8]"
          />
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-[#131b2e] dark:text-[#faf8ff] truncate">
              Farhana Jahan
            </p>
            <p className="text-[11px] text-[#6e7979] truncate">Senior Physiotherapist</p>
          </div>
        </div>
      </aside>
    </>
  );
};
