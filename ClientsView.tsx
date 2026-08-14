import React, { useState } from 'react';
import {
  Search,
  Plus,
  UserPlus,
  Edit2,
  Trash2,
  Calendar,
  CheckCircle2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Client, Payment, Physiotherapist } from '../types';
import { AppStorage } from '../lib/storage';
import { ConfirmDeleteModal } from './modals/ConfirmDeleteModal';

interface ClientsViewProps {
  clients: Client[];
  payments: Payment[];
  physiotherapists: Physiotherapist[];
  onSelectClient: (clientId: string) => void;
  onOpenAddClient: () => void;
  onEditClient?: (client: Client) => void;
  onDeleteClient?: (clientId: string) => void;
  onMarkFullyPaid?: (clientId: string) => void;
  onOpenRecycleBin?: () => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  payments,
  physiotherapists,
  onSelectClient,
  onOpenAddClient,
  onEditClient,
  onDeleteClient,
  onMarkFullyPaid,
  onOpenRecycleBin,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PARTIALLY PAID' | 'OVERDUE'>('ALL');
  const [selectedPhysioId, setSelectedPhysioId] = useState<string>('ALL');
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const recycleBinCount = AppStorage.getRecycleBin().length;

  // Filter clients
  const filteredClients = clients.filter((client) => {
    if (client.archived) return false;

    // Search query
    const matchSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm) ||
      client.packageName.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchStatus = statusFilter === 'ALL' || client.status === statusFilter;

    // Physio filter
    const matchPhysio = selectedPhysioId === 'ALL' || client.physiotherapistId === selectedPhysioId;

    return matchSearch && matchStatus && matchPhysio;
  });

  // Calculate paid & due for client
  const getClientTotals = (client: Client) => {
    const clientPayments = payments.filter((p) => p.clientId === client.id);
    const totalPaid = clientPayments.reduce((sum, p) => sum + p.amount, 0);
    const dueAmount = Math.max(0, client.finalAmount - totalPaid);
    return { totalPaid, dueAmount };
  };

  // Get Initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const handleConfirmDelete = () => {
    if (clientToDelete && onDeleteClient) {
      onDeleteClient(clientToDelete.id);
      setClientToDelete(null);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#131b2e] dark:text-[#faf8ff]">
            Clients Directory
          </h1>
          <p className="text-sm text-[#6e7979] dark:text-[#bec9c8] mt-0.5">
            {filteredClients.length} enrolled clients tracked
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenRecycleBin && (
            <button
              type="button"
              onClick={onOpenRecycleBin}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#bec9c8]/40 bg-white dark:bg-[#283044] text-[#3e4949] dark:text-[#eef0ff] text-xs font-semibold hover:bg-[#f2f3ff] transition-all cursor-pointer shadow-2xs"
              title="Open Recycle Bin to restore deleted clients or staff"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#005052] dark:text-[#84d4d5]" />
              <span>Recycle Bin</span>
              {recycleBinCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#005052] text-white">
                  {recycleBinCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={onOpenAddClient}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#005052] text-white text-sm font-semibold hover:bg-[#006a6c] active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6e7979]" />
            <input
              type="text"
              placeholder="Search by name, phone, ID, or package..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-white dark:bg-[#283044] rounded-xl border border-[#bec9c8]/40 text-sm text-[#131b2e] dark:text-[#faf8ff] placeholder-[#6e7979] focus:outline-none focus:ring-2 focus:ring-[#005052]"
            />
          </div>

          {/* Physio Selector */}
          <select
            value={selectedPhysioId}
            onChange={(e) => setSelectedPhysioId(e.target.value)}
            className="h-11 px-3 bg-white dark:bg-[#283044] rounded-xl border border-[#bec9c8]/40 text-xs text-[#131b2e] dark:text-[#faf8ff] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Physios</option>
            {physiotherapists.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-[#005052] text-white'
                : 'bg-white dark:bg-[#283044] text-[#3e4949] dark:text-[#bec9c8] border border-[#bec9c8]/30'
            }`}
          >
            All Statuses
          </button>
          <button
            onClick={() => setStatusFilter('PARTIALLY PAID')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === 'PARTIALLY PAID'
                ? 'bg-[#8a5a19] text-white'
                : 'bg-white dark:bg-[#283044] text-[#8a5a19] border border-[#bec9c8]/30'
            }`}
          >
            Partially Paid
          </button>
          <button
            onClick={() => setStatusFilter('PAID')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === 'PAID'
                ? 'bg-[#137333] text-white'
                : 'bg-white dark:bg-[#283044] text-[#137333] border border-[#bec9c8]/30'
            }`}
          >
            Paid
          </button>
          <button
            onClick={() => setStatusFilter('OVERDUE')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === 'OVERDUE'
                ? 'bg-[#ba1a1a] text-white'
                : 'bg-white dark:bg-[#283044] text-[#ba1a1a] border border-[#bec9c8]/30'
            }`}
          >
            Overdue
          </button>
        </div>
      </div>

      {/* Client List Cards */}
      <div className="space-y-3">
        {filteredClients.length === 0 ? (
          <div className="bg-white dark:bg-[#283044] rounded-2xl p-8 text-center space-y-3 border border-[#bec9c8]/30">
            <p className="text-sm text-[#6e7979]">No clients found matching criteria.</p>
            <button
              onClick={onOpenAddClient}
              className="px-4 py-2 rounded-xl bg-[#005052] text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add First Client
            </button>
          </div>
        ) : (
          filteredClients.map((client) => {
            const { totalPaid, dueAmount } = getClientTotals(client);
            const isFullyPaid = dueAmount === 0 && client.status === 'PAID';

            return (
              <div
                key={client.id}
                onClick={() => onSelectClient(client.id)}
                className="bg-white dark:bg-[#283044] rounded-2xl p-4 shadow-xs border border-[#bec9c8]/30 hover:border-[#005052] transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                {/* Client Profile Header */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-[#eaedff] dark:bg-[#131b2e] text-[#005052] dark:text-[#84d4d5] font-bold text-base flex items-center justify-center shrink-0 border border-[#bec9c8]/40">
                    {getInitials(client.name)}
                  </div>
                  <div className="min-w-0">
                    <h3
                      className="font-bold text-base text-[#131b2e] dark:text-[#faf8ff] group-hover:text-[#005052] truncate"
                      title={client.name}
                    >
                      {client.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#6e7979] dark:text-[#bec9c8] mt-1">
                      <span className="font-mono">{client.id}</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 font-medium bg-[#f2f3ff] dark:bg-[#131b2e] px-2 py-0.5 rounded-md border border-[#bec9c8]/30 text-[#131b2e] dark:text-[#faf8ff]">
                        <Calendar className="w-3 h-3 text-[#005052] dark:text-[#84d4d5]" />
                        Enrolled: {client.enrollmentDate}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-[#3e4949] dark:text-[#eef0ff] mt-1 truncate">
                      {client.packageName}
                    </p>
                  </div>
                </div>

                {/* Status & Financial Details */}
                <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 border-[#bec9c8]/20 pt-2.5 md:pt-0">
                  <div className="text-left md:text-right text-xs">
                    <span className="text-[#6e7979] dark:text-[#bec9c8]">
                      Paid ৳{totalPaid.toLocaleString()} | Due ৳{dueAmount.toLocaleString()}
                    </span>
                  </div>

                  {/* Status Badges & Quick Actions */}
                  <div className="mt-1.5 flex items-center justify-between md:justify-end gap-2 w-full md:w-auto flex-wrap">
                    {/* Status Badge */}
                    <div>
                      {client.status === 'PAID' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#e6f4ea] text-[#137333]">
                          PAID
                        </span>
                      )}
                      {client.status === 'PARTIALLY PAID' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ffebd2] text-[#8a5a19]">
                          PARTIALLY PAID
                        </span>
                      )}
                      {client.status === 'OVERDUE' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ffdad6] text-[#ba1a1a]">
                          OVERDUE
                        </span>
                      )}
                      {client.status === 'UNPAID' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#f2f3ff] text-[#3e4949]">
                          UNPAID
                        </span>
                      )}
                    </div>

                    {/* Quick "Fully Paid" Action Button */}
                    {!isFullyPaid && onMarkFullyPaid && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkFullyPaid(client.id);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-[#e6f4ea] hover:bg-[#137333] text-[#137333] hover:text-white font-bold text-[11px] border border-[#137333]/30 transition-all flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
                        title={`Quick Action: Settle remaining ৳${dueAmount.toLocaleString()} due and mark as Fully Paid`}
                      >
                        <CheckCircle2 className="w-3 h-3 text-current" />
                        <span>Fully Paid</span>
                      </button>
                    )}

                    {/* Action icons */}
                    <div className="flex items-center gap-1">
                      {onEditClient && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditClient(client);
                          }}
                          className="p-1 rounded-lg hover:bg-[#eaedff] text-[#3e4949] dark:text-[#bec9c8] transition-colors cursor-pointer"
                          title="Edit Client Information"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDeleteClient && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setClientToDelete(client);
                          }}
                          className="p-1 rounded-lg hover:bg-[#ffdad6] text-[#ba1a1a] transition-colors cursor-pointer"
                          title="Delete Client Profile (Moves to Recycle Bin)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Modal before Deleting */}
      {clientToDelete && (
        <ConfirmDeleteModal
          isOpen={true}
          onClose={() => setClientToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Client Record"
          itemName={`${clientToDelete.name} (${clientToDelete.id})`}
          itemType="client"
          isPermanent={false}
          confirmText="Delete & Move to Recycle Bin"
        />
      )}

      {/* Floating Action Button for Mobile */}
      <button
        onClick={onOpenAddClient}
        className="md:hidden fixed bottom-20 right-4 z-40 w-14 h-14 bg-[#005052] text-white rounded-2xl shadow-lg flex items-center justify-center active:scale-95 transition-all cursor-pointer"
      >
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );
};
