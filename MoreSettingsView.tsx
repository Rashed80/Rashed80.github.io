import React, { useState } from 'react';
import {
  Cloud,
  HardDriveUpload,
  HardDriveDownload,
  ShieldCheck,
  Package,
  Calendar,
  History,
  Moon,
  Sun,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import { AuditLog, CloudBackupConfig, Package as PackageType } from '../types';
import { CloudSyncService } from '../lib/cloudSync';
import { AppStorage } from '../lib/storage';

interface MoreSettingsViewProps {
  cloudConfig: CloudBackupConfig;
  packages: PackageType[];
  auditLogs: AuditLog[];
  onCloudConfigChange: (config: CloudBackupConfig) => void;
  onRefreshData: () => void;
  onOpenAddPackageModal: () => void;
  onOpenRecycleBin?: () => void;
}

export const MoreSettingsView: React.FC<MoreSettingsViewProps> = ({
  cloudConfig,
  packages,
  auditLogs,
  onCloudConfigChange,
  onRefreshData,
  onOpenAddPackageModal,
  onOpenRecycleBin,
}) => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const binItems = AppStorage.getRecycleBin();

  // Toggle Google Drive
  const handleToggleGoogleDrive = async () => {
    if (cloudConfig.googleDriveConnected) {
      const updated = await CloudSyncService.disconnectGoogleDrive();
      onCloudConfigChange(updated);
    } else {
      const updated = await CloudSyncService.connectGoogleDrive();
      onCloudConfigChange(updated);
      setMsg({ text: 'Google Drive connected successfully!', type: 'success' });
    }
  };

  // Toggle Dropbox
  const handleToggleDropbox = async () => {
    if (cloudConfig.dropboxConnected) {
      const updated = await CloudSyncService.disconnectDropbox();
      onCloudConfigChange(updated);
    } else {
      const updated = await CloudSyncService.connectDropbox();
      onCloudConfigChange(updated);
      setMsg({ text: 'Dropbox connected successfully!', type: 'success' });
    }
  };

  // Trigger Manual Backup
  const handleBackupNow = async () => {
    setIsBackingUp(true);
    const res = await CloudSyncService.triggerBackupNow();
    setIsBackingUp(false);
    if (res.success) {
      onRefreshData();
      setMsg({ text: 'Cloud database backup completed!', type: 'success' });
    }
  };

  // Restore
  const handleRestore = async () => {
    if (!window.confirm('Are you sure you want to restore from the latest cloud backup? Current unbacked data will be replaced.')) {
      return;
    }
    setIsRestoring(true);
    const success = await CloudSyncService.restoreFromCloud();
    setIsRestoring(false);
    if (success) {
      onRefreshData();
      setMsg({ text: 'Database restored from backup successfully!', type: 'success' });
    } else {
      setMsg({ text: 'No backup snapshot found to restore.', type: 'error' });
    }
  };

  // Download JSON file
  const handleDownloadJson = () => {
    const jsonStr = AppStorage.exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FitbackReset_Database_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Upload JSON file
  const handleUploadJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = AppStorage.importDatabaseJSON(content);
        if (ok) {
          onRefreshData();
          setMsg({ text: 'JSON Database imported successfully!', type: 'success' });
        } else {
          setMsg({ text: 'Failed to import JSON data. Format invalid.', type: 'error' });
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#131b2e] dark:text-[#faf8ff]">
          Settings & Data Management
        </h1>
        <p className="text-sm text-[#6e7979] dark:text-[#bec9c8] mt-0.5">
          Cloud storage sync, recycle bin recovery, packages, and audit history
        </p>
      </div>

      {msg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            msg.type === 'success'
              ? 'bg-[#e6f4ea] text-[#137333] border border-[#137333]/20'
              : 'bg-[#ffdad6] text-[#ba1a1a] border border-[#ba1a1a]/20'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          {msg.text}
        </div>
      )}

      {/* 1. Recycle Bin & Accidental Deletion Protection */}
      <section className="bg-white dark:bg-[#283044] rounded-2xl p-5 shadow-xs border border-[#bec9c8]/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-[#131b2e] dark:text-[#faf8ff]">
            <RotateCcw className="w-5 h-5 text-[#005052] dark:text-[#84d4d5]" />
            Recycle Bin & Data Protection
          </div>

          {onOpenRecycleBin && (
            <button
              onClick={onOpenRecycleBin}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#005052] text-white text-xs font-semibold hover:bg-[#006a6c] active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Manage Recycle Bin ({binItems.length})
            </button>
          )}
        </div>

        <div className="p-4 rounded-xl bg-[#faf8ff] dark:bg-[#131b2e] border border-[#bec9c8]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <h4 className="font-bold text-[#131b2e] dark:text-[#faf8ff] flex items-center gap-2">
              <span>Automatic Safety Preservation</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e6f4ea] text-[#137333]">
                Active
              </span>
            </h4>
            <p className="text-[#6e7979] dark:text-[#bec9c8] mt-1 leading-relaxed max-w-xl">
              Whenever a client, staff specialist, or payment record is deleted, it is safely stored in the Recycle Bin with full linked records preserved. You can inspect or restore items at any time with 1-click.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="text-[11px] text-[#6e7979] block">Deleted Items</span>
              <span className="text-base font-bold text-[#005052] dark:text-[#84d4d5]">
                {binItems.length} Record{binItems.length !== 1 ? 's' : ''}
              </span>
            </div>
            {onOpenRecycleBin && (
              <button
                onClick={onOpenRecycleBin}
                className="px-3 py-2 rounded-xl border border-[#005052]/30 text-[#005052] dark:text-[#84d4d5] font-semibold text-xs hover:bg-[#f2f3ff] transition-colors cursor-pointer"
              >
                View & Restore
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. Cloud Storage & Online Database Sync Section */}
      <section className="bg-white dark:bg-[#283044] rounded-2xl p-5 shadow-xs border border-[#bec9c8]/30 space-y-5">
        <div className="flex items-center gap-2 text-sm font-bold text-[#131b2e] dark:text-[#faf8ff]">
          <Cloud className="w-5 h-5 text-[#005052] dark:text-[#84d4d5]" />
          Cloud Storage & Database Synchronization
        </div>

        {/* Cloud Providers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Google Drive */}
          <div className="p-4 rounded-xl bg-[#faf8ff] dark:bg-[#131b2e] border border-[#bec9c8]/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#eaedff] flex items-center justify-center text-[#005052] font-bold text-base">
                G
              </div>
              <div>
                <h4 className="font-bold text-xs text-[#131b2e] dark:text-[#faf8ff]">Google Drive</h4>
                <p className="text-[11px] text-[#6e7979]">
                  {cloudConfig.googleDriveConnected
                    ? cloudConfig.googleDriveAccount
                    : 'Not connected'}
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleGoogleDrive}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                cloudConfig.googleDriveConnected
                  ? 'bg-[#e6f4ea] text-[#137333] hover:bg-[#ffdad6] hover:text-[#ba1a1a]'
                  : 'bg-[#005052] text-white hover:bg-[#006a6c]'
              }`}
            >
              {cloudConfig.googleDriveConnected ? 'Connected' : 'Connect'}
            </button>
          </div>

          {/* Dropbox */}
          <div className="p-4 rounded-xl bg-[#faf8ff] dark:bg-[#131b2e] border border-[#bec9c8]/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#eaedff] flex items-center justify-center text-[#005052] font-bold text-base">
                D
              </div>
              <div>
                <h4 className="font-bold text-xs text-[#131b2e] dark:text-[#faf8ff]">Dropbox</h4>
                <p className="text-[11px] text-[#6e7979]">
                  {cloudConfig.dropboxConnected ? cloudConfig.dropboxAccount : 'Not connected'}
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleDropbox}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                cloudConfig.dropboxConnected
                  ? 'bg-[#e6f4ea] text-[#137333] hover:bg-[#ffdad6] hover:text-[#ba1a1a]'
                  : 'bg-[#005052] text-white hover:bg-[#006a6c]'
              }`}
            >
              {cloudConfig.dropboxConnected ? 'Connected' : 'Connect'}
            </button>
          </div>
        </div>

        {/* Quick Sync & Restore Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleBackupNow}
            disabled={isBackingUp}
            className="flex-1 min-w-[140px] py-2.5 rounded-xl bg-[#005052] text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#006a6c] active:scale-95 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <HardDriveUpload className={`w-4 h-4 ${isBackingUp ? 'animate-bounce' : ''}`} />
            {isBackingUp ? 'Backing up...' : 'Backup Now'}
          </button>

          <button
            onClick={handleRestore}
            disabled={isRestoring}
            className="flex-1 min-w-[140px] py-2.5 rounded-xl border border-[#bec9c8]/40 bg-white dark:bg-[#131b2e] text-[#131b2e] dark:text-[#faf8ff] text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#f2f3ff] transition-all cursor-pointer"
          >
            <HardDriveDownload className="w-4 h-4" />
            Restore Backup
          </button>

          <button
            onClick={handleDownloadJson}
            className="py-2.5 px-4 rounded-xl border border-[#bec9c8]/40 bg-white dark:bg-[#131b2e] text-[#3e4949] dark:text-[#eef0ff] text-xs font-semibold hover:bg-[#f2f3ff] transition-all cursor-pointer"
          >
            Export JSON
          </button>

          <label className="py-2.5 px-4 rounded-xl border border-[#bec9c8]/40 bg-white dark:bg-[#131b2e] text-[#3e4949] dark:text-[#eef0ff] text-xs font-semibold cursor-pointer hover:bg-[#f2f3ff] transition-all">
            Import JSON
            <input type="file" accept=".json" onChange={handleUploadJson} className="hidden" />
          </label>
        </div>
      </section>

      {/* 3. Packages Management */}
      <section className="bg-white dark:bg-[#283044] rounded-2xl p-5 shadow-xs border border-[#bec9c8]/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-[#131b2e] dark:text-[#faf8ff]">
            <Package className="w-5 h-5 text-[#005052] dark:text-[#84d4d5]" />
            Physiotherapy Packages & Rates
          </div>

          <button
            onClick={onOpenAddPackageModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#005052] text-white text-xs font-semibold hover:bg-[#006a6c] active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Custom Package
          </button>
        </div>

        <div className="divide-y divide-[#bec9c8]/20 border border-[#bec9c8]/30 rounded-xl overflow-hidden">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="p-3.5 bg-[#faf8ff] dark:bg-[#131b2e] flex items-center justify-between text-xs"
            >
              <div>
                <h4 className="font-bold text-[#131b2e] dark:text-[#faf8ff]">{pkg.name}</h4>
                <p className="text-[#6e7979] mt-0.5">{pkg.sessionCount} Sessions • {pkg.description}</p>
              </div>
              <span className="font-bold text-sm text-[#005052] dark:text-[#84d4d5]">
                ৳{pkg.price.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Audit Logs Viewer */}
      <section className="bg-white dark:bg-[#283044] rounded-2xl p-5 shadow-xs border border-[#bec9c8]/30 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#131b2e] dark:text-[#faf8ff]">
          <History className="w-5 h-5 text-[#005052] dark:text-[#84d4d5]" />
          Audit Trail & System Logs
        </div>

        <div className="max-h-56 overflow-y-auto space-y-2 border border-[#bec9c8]/30 rounded-xl p-2 bg-[#faf8ff] dark:bg-[#131b2e]">
          {auditLogs.map((log, index) => (
            <div key={`${log.id}-${index}`} className="p-2.5 rounded-lg bg-white dark:bg-[#283044] text-xs space-y-0.5">
              <div className="flex justify-between font-semibold text-[#131b2e] dark:text-[#faf8ff]">
                <span>{log.action}</span>
                <span className="text-[10px] text-[#6e7979]">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-[#6e7979] text-[11px]">{log.details}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
