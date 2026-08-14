import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import {
  ViewTab,
  Client,
  Payment,
  Physiotherapist,
  Package,
  CommissionSettlement,
  ReportingPeriod,
  AuditLog,
  CloudBackupConfig,
} from './types';
import { AppStorage } from './lib/storage';
import { PdfReportGenerator } from './lib/pdfGenerator';
import { TopAppBar } from './components/TopAppBar';
import { BottomNavBar } from './components/BottomNavBar';
import { DashboardView } from './components/DashboardView';
import { ClientsView } from './components/ClientsView';
import { ClientDetailView } from './components/ClientDetailView';
import { StaffView } from './components/StaffView';
import { ReportsView } from './components/ReportsView';
import { MoreSettingsView } from './components/MoreSettingsView';

import { AddClientModal } from './components/modals/AddClientModal';
import { AddPaymentModal } from './components/modals/AddPaymentModal';
import { AddStaffModal } from './components/modals/AddStaffModal';
import { SettleCommissionModal } from './components/modals/SettleCommissionModal';
import { AddPackageModal } from './components/modals/AddPackageModal';
import { QuickAddMenu } from './components/modals/QuickAddMenu';
import { PdfPreviewModal } from './components/modals/PdfPreviewModal';
import { RecycleBinModal } from './components/modals/RecycleBinModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // App Data State
  const [physiotherapists, setPhysiotherapists] = useState<Physiotherapist[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [settlements, setSettlements] = useState<CommissionSettlement[]>([]);
  const [periods, setPeriods] = useState<ReportingPeriod[]>(() => AppStorage.getPeriods());
  const [currentPeriod, setCurrentPeriod] = useState<ReportingPeriod>(() => AppStorage.getCurrentPeriod());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [cloudConfig, setCloudConfig] = useState<CloudBackupConfig>({
    googleDriveConnected: false,
    dropboxConnected: false,
    autoBackup: true,
  });

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Modals state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [paymentClientId, setPaymentClientId] = useState<string | undefined>();

  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Physiotherapist | null>(null);

  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [settlePhysio, setSettlePhysio] = useState<Physiotherapist | null>(null);

  const [isAddPackageOpen, setIsAddPackageOpen] = useState(false);
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);

  // PDF Preview State
  const [pdfPreview, setPdfPreview] = useState<{
    isOpen: boolean;
    pdfDoc: jsPDF | null;
    title: string;
  }>({
    isOpen: false,
    pdfDoc: null,
    title: '',
  });

  // Load state from local storage on mount
  const refreshData = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setPhysiotherapists(AppStorage.getPhysiotherapists());
      setClients(AppStorage.getClients());
      setPackages(AppStorage.getPackages());
      setPayments(AppStorage.getPayments());
      setSettlements(AppStorage.getSettlements());
      setPeriods(AppStorage.getPeriods());
      setCurrentPeriod(AppStorage.getCurrentPeriod());
      setAuditLogs(AppStorage.getAuditLogs());
      setCloudConfig(AppStorage.getCloudConfig());
      setIsSyncing(false);
    }, 200);
  };

  useEffect(() => {
    refreshData();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handlers for data updates
  const handleSaveClient = (client: Client, initialPayment?: Payment) => {
    AppStorage.saveClient(client);
    if (initialPayment) {
      AppStorage.addPayment(initialPayment);
    } else {
      AppStorage.recalculateClientStatus(client.id);
    }
    refreshData();
  };

  const handleDeleteClient = (clientId: string) => {
    AppStorage.deleteClient(clientId, true);
    if (selectedClientId === clientId) {
      setSelectedClientId(null);
    }
    refreshData();
  };

  const handleMarkFullyPaid = (clientId: string) => {
    AppStorage.markClientFullyPaid(clientId);
    refreshData();
  };

  const handleSavePayment = (payment: Payment) => {
    if (editingPayment) {
      AppStorage.updatePayment(payment);
    } else {
      AppStorage.addPayment(payment);
    }
    refreshData();
  };

  const handleDeletePayment = (paymentId: string) => {
    AppStorage.deletePayment(paymentId, true);
    refreshData();
  };

  const handleSaveStaff = (staff: Physiotherapist) => {
    AppStorage.savePhysiotherapist(staff);
    refreshData();
  };

  const handleDeleteStaff = (physioId: string) => {
    AppStorage.deletePhysiotherapist(physioId, true);
    refreshData();
  };

  const handleSaveSettlement = (settlement: CommissionSettlement) => {
    AppStorage.addSettlement(settlement);
    refreshData();
  };

  const handleSavePackage = (pkg: Package) => {
    AppStorage.savePackage(pkg);
    refreshData();
  };

  const handleSelectPeriod = (periodId: string) => {
    AppStorage.setCurrentPeriod(periodId);
    refreshData();
  };

  // PDF Generation Triggers
  const handleGenerateClientPdf = (client: Client) => {
    const clientPayments = AppStorage.getPaymentsByClient(client.id);
    const physio = physiotherapists.find((p) => p.id === client.physiotherapistId);
    const pdf = PdfReportGenerator.generateClientStatementPDF(
      client,
      clientPayments,
      physio,
      currentPeriod
    );

    setPdfPreview({
      isOpen: true,
      pdfDoc: pdf,
      title: `Client Payment Statement - ${client.name} (${client.id})`,
    });
  };

  const handleGenerateStaffPdf = () => {
    const pdf = PdfReportGenerator.generateStaffPerformancePDF(
      physiotherapists,
      clients,
      payments,
      settlements,
      currentPeriod
    );

    setPdfPreview({
      isOpen: true,
      pdfDoc: pdf,
      title: `Master Staff Performance & Commission Report - ${currentPeriod.name}`,
    });
  };

  const handleGenerateIndividualPhysioPdf = (physio: Physiotherapist) => {
    const pdf = PdfReportGenerator.generateIndividualPhysioReportPDF(
      physio,
      clients,
      payments,
      settlements,
      currentPeriod
    );

    setPdfPreview({
      isOpen: true,
      pdfDoc: pdf,
      title: `Physiotherapist Report - ${physio.name} (A4 PDF)`,
    });
  };

  // Export Outstanding CSV
  const handleExportCsv = () => {
    const pendingClients = clients.filter((c) => {
      const cPayments = payments.filter((p) => p.clientId === c.id);
      const paid = cPayments.reduce((pSum, p) => pSum + p.amount, 0);
      return c.finalAmount > paid;
    });

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Client ID,Name,Phone,Enrollment Date,Physiotherapist,Package,Total Price,Paid,Due Amount\n';

    pendingClients.forEach((c) => {
      const cPayments = payments.filter((p) => p.clientId === c.id);
      const paid = cPayments.reduce((pSum, p) => pSum + p.amount, 0);
      const due = c.finalAmount - paid;
      const physio = physiotherapists.find((p) => p.id === c.physiotherapistId)?.name || 'Unassigned';

      csvContent += `"${c.id}","${c.name}","${c.phone}","${c.enrollmentDate}","${physio}","${c.packageName}",${c.finalAmount},${paid},${due}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FitbackReset_Outstanding_Clients_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeClientDetail = selectedClientId
    ? clients.find((c) => c.id === selectedClientId)
    : null;

  return (
    <div className="min-h-screen bg-[#faf8ff] dark:bg-[#131b2e] text-[#131b2e] dark:text-[#faf8ff] flex flex-col md:flex-row antialiased font-sans">
      {/* Sidebar Navigation for Desktop & Bottom Bar for Mobile */}
      <BottomNavBar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setSelectedClientId(null);
          setCurrentTab(tab);
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopAppBar
          currentTab={currentTab}
          onOpenQuickAdd={() => setIsQuickAddOpen(true)}
          isOnline={isOnline}
          isSyncing={isSyncing}
          onRefreshData={refreshData}
        />

        <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 min-w-0">
          {/* Render Active View or Client Detail */}
          {activeClientDetail ? (
            <ClientDetailView
              client={activeClientDetail}
              payments={payments.filter((p) => p.clientId === activeClientDetail.id)}
              physiotherapist={physiotherapists.find(
                (p) => p.id === activeClientDetail.physiotherapistId
              )}
              onBack={() => setSelectedClientId(null)}
              onEditClient={(client) => {
                setEditingClient(client);
                setIsAddClientOpen(true);
              }}
              onDeleteClient={handleDeleteClient}
              onAddPayment={(clientId) => {
                setEditingPayment(null);
                setPaymentClientId(clientId);
                setIsAddPaymentOpen(true);
              }}
              onEditPayment={(payment) => {
                setEditingPayment(payment);
                setPaymentClientId(payment.clientId);
                setIsAddPaymentOpen(true);
              }}
              onDeletePayment={handleDeletePayment}
              onGeneratePdf={handleGenerateClientPdf}
              onMarkFullyPaid={handleMarkFullyPaid}
            />
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardView
                  periods={periods}
                  currentPeriod={currentPeriod}
                  onSelectPeriod={handleSelectPeriod}
                  clients={clients}
                  payments={payments}
                  physiotherapists={physiotherapists}
                  onNavigateTab={setCurrentTab}
                  onSelectClient={(id) => {
                    setSelectedClientId(id);
                    setCurrentTab('clients');
                  }}
                  onEditStaff={(physio) => {
                    setEditingStaff(physio);
                    setIsAddStaffOpen(true);
                  }}
                  onGenerateIndividualPhysioPdf={handleGenerateIndividualPhysioPdf}
                  onGenerateMasterStaffPdf={handleGenerateStaffPdf}
                />
              )}

              {currentTab === 'clients' && (
                <ClientsView
                  clients={clients}
                  payments={payments}
                  physiotherapists={physiotherapists}
                  onSelectClient={(id) => setSelectedClientId(id)}
                  onOpenAddClient={() => {
                    setEditingClient(null);
                    setIsAddClientOpen(true);
                  }}
                  onEditClient={(client) => {
                    setEditingClient(client);
                    setIsAddClientOpen(true);
                  }}
                  onDeleteClient={handleDeleteClient}
                  onMarkFullyPaid={handleMarkFullyPaid}
                  onOpenRecycleBin={() => setIsRecycleBinOpen(true)}
                />
              )}

              {currentTab === 'staff' && (
                <StaffView
                  physiotherapists={physiotherapists}
                  clients={clients}
                  payments={payments}
                  periods={periods}
                  currentPeriod={currentPeriod}
                  onSelectPeriod={handleSelectPeriod}
                  onOpenAddStaffModal={() => {
                    setEditingStaff(null);
                    setIsAddStaffOpen(true);
                  }}
                  onEditStaff={(physio) => {
                    setEditingStaff(physio);
                    setIsAddStaffOpen(true);
                  }}
                  onDeleteStaff={handleDeleteStaff}
                  onGenerateIndividualPhysioPdf={handleGenerateIndividualPhysioPdf}
                  onGenerateMasterStaffPdf={handleGenerateStaffPdf}
                  onOpenRecycleBin={() => setIsRecycleBinOpen(true)}
                />
              )}

              {currentTab === 'reports' && (
                <ReportsView
                  periods={periods}
                  currentPeriod={currentPeriod}
                  onSelectPeriod={handleSelectPeriod}
                  clients={clients}
                  payments={payments}
                  physiotherapists={physiotherapists}
                  onGenerateClientPdf={handleGenerateClientPdf}
                  onGenerateStaffPdf={handleGenerateStaffPdf}
                  onGenerateIndividualPhysioPdf={handleGenerateIndividualPhysioPdf}
                  onExportCsv={handleExportCsv}
                />
              )}

              {currentTab === 'more' && (
                <MoreSettingsView
                  cloudConfig={cloudConfig}
                  packages={packages}
                  auditLogs={auditLogs}
                  onCloudConfigChange={(cfg) => {
                    AppStorage.saveCloudConfig(cfg);
                    refreshData();
                  }}
                  onRefreshData={refreshData}
                  onOpenAddPackageModal={() => setIsAddPackageOpen(true)}
                  onOpenRecycleBin={() => setIsRecycleBinOpen(true)}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      <QuickAddMenu
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onAddPayment={() => {
          setEditingPayment(null);
          setPaymentClientId(undefined);
          setIsAddPaymentOpen(true);
        }}
        onAddClient={() => {
          setEditingClient(null);
          setIsAddClientOpen(true);
        }}
        onAddStaff={() => {
          setEditingStaff(null);
          setIsAddStaffOpen(true);
        }}
      />

      <AddClientModal
        isOpen={isAddClientOpen}
        onClose={() => setIsAddClientOpen(false)}
        onSave={handleSaveClient}
        onDelete={handleDeleteClient}
        packages={packages}
        physiotherapists={physiotherapists}
        payments={payments}
        editingClient={editingClient}
        nextClientId={AppStorage.generateNextClientId()}
      />

      <AddPaymentModal
        isOpen={isAddPaymentOpen}
        onClose={() => setIsAddPaymentOpen(false)}
        onSave={handleSavePayment}
        clients={clients}
        payments={payments}
        physiotherapists={physiotherapists}
        preSelectedClientId={paymentClientId}
        editingPayment={editingPayment}
      />

      <AddStaffModal
        isOpen={isAddStaffOpen}
        onClose={() => setIsAddStaffOpen(false)}
        onSave={handleSaveStaff}
        onDelete={handleDeleteStaff}
        editingStaff={editingStaff}
      />

      {settlePhysio && (
        <SettleCommissionModal
          isOpen={isSettleOpen}
          onClose={() => setIsSettleOpen(false)}
          physiotherapist={settlePhysio}
          outstandingAmount={(() => {
            const pPayments = payments.filter((p) => p.physiotherapistId === settlePhysio.id);
            const pSettlements = settlements.filter((s) => s.physiotherapistId === settlePhysio.id);
            const earned = pPayments.reduce((sum, p) => sum + p.commissionAmount, 0);
            const settled = pSettlements.reduce((sum, s) => sum + s.amount, 0);
            return Math.max(0, earned - settled);
          })()}
          onSave={handleSaveSettlement}
        />
      )}

      <AddPackageModal
        isOpen={isAddPackageOpen}
        onClose={() => setIsAddPackageOpen(false)}
        onSave={handleSavePackage}
      />

      <PdfPreviewModal
        isOpen={pdfPreview.isOpen}
        onClose={() => setPdfPreview({ isOpen: false, pdfDoc: null, title: '' })}
        pdfDoc={pdfPreview.pdfDoc}
        title={pdfPreview.title}
      />

      <RecycleBinModal
        isOpen={isRecycleBinOpen}
        onClose={() => setIsRecycleBinOpen(false)}
        onDataChanged={refreshData}
      />
    </div>
  );
}
