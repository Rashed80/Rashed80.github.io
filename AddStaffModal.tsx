import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Percent,
  Trash2,
  CheckCircle2,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Physiotherapist } from '../../types';
import { Avatar } from '../common/Avatar';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (physio: Physiotherapist) => void;
  onDelete?: (physioId: string) => void;
  editingStaff?: Physiotherapist | null;
}

// Preset professional physiotherapist avatars
const PRESET_AVATARS = [
  {
    label: 'Portrait 1 (Female)',
    url: 'https://images.unsplash.com/photo-1594824813566-78a933f38f15?w=300&auto=format&fit=crop&q=80',
  },
  {
    label: 'Portrait 2 (Male)',
    url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
  },
  {
    label: 'Portrait 3 (Female)',
    url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80',
  },
  {
    label: 'Portrait 4 (Male)',
    url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&auto=format&fit=crop&q=80',
  },
  {
    label: 'Portrait 5 (Female)',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
  },
  {
    label: 'Portrait 6 (Male)',
    url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&auto=format&fit=crop&q=80',
  },
];

// Helper to normalize and fix common image URL issues (e.g. Google Drive, Dropbox, missing protocol)
const sanitizeImageUrl = (rawUrl: string): string => {
  let url = rawUrl.trim();
  if (!url) return '';

  // Handle Google Drive links
  // https://drive.google.com/file/d/FILE_ID/view?usp=sharing -> https://drive.google.com/uc?export=view&id=FILE_ID
  const gDriveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (gDriveMatch && gDriveMatch[1]) {
    return `https://drive.google.com/uc?export=view&id=${gDriveMatch[1]}`;
  }

  // Handle Dropbox links
  if (url.includes('dropbox.com')) {
    url = url.replace('dl=0', 'raw=1');
    if (!url.includes('raw=1')) {
      url = url + (url.includes('?') ? '&raw=1' : '?raw=1');
    }
    return url;
  }

  // Handle missing protocol if it looks like a web URL
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:image/')) {
    if (url.includes('.') && !url.startsWith('/')) {
      url = `https://${url}`;
    }
  }

  return url;
};

export const AddStaffModal: React.FC<AddStaffModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingStaff,
}) => {
  if (!isOpen) return null;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(editingStaff?.name || '');
  const [title, setTitle] = useState(editingStaff?.title || 'Senior Physiotherapist');
  const [phone, setPhone] = useState(editingStaff?.phone || '01711223344');
  const [email, setEmail] = useState(editingStaff?.email || '');
  const [commissionRate, setCommissionRate] = useState<number>(
    editingStaff?.commissionRate || 25
  );
  const [avatarUrl, setAvatarUrl] = useState(
    editingStaff?.avatarUrl || PRESET_AVATARS[0].url
  );
  const [notes, setNotes] = useState(editingStaff?.notes || '');
  const [showPresets, setShowPresets] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image is too large. Please select a photo under 5MB.');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setAvatarUrl(result);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setAvatarUrl(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalAvatar = sanitizeImageUrl(avatarUrl) || PRESET_AVATARS[0].url;

    const staff: Physiotherapist = {
      id: editingStaff?.id || `physio-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      title: title.trim(),
      phone: phone.trim(),
      email: email.trim(),
      avatarUrl: finalAvatar,
      commissionRate,
      status: editingStaff?.status || 'ACTIVE',
      dateJoined: editingStaff?.dateJoined || new Date().toISOString().split('T')[0],
      notes,
    };

    onSave(staff);
    onClose();
  };

  const handleDelete = () => {
    if (editingStaff && onDelete) {
      onDelete(editingStaff.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#283044] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-[#bec9c8]/30 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-[#f2f3ff] dark:bg-[#131b2e] border-b border-[#bec9c8]/20 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#005052] text-white flex items-center justify-center font-bold">
              {editingStaff ? 'E' : '+'}
            </div>
            <div>
              <h3 className="font-bold text-base text-[#131b2e] dark:text-[#faf8ff]">
                {editingStaff ? 'Edit Staff Member & Commission' : 'Add Physiotherapist'}
              </h3>
              <p className="text-[11px] text-[#6e7979] dark:text-[#bec9c8]">
                Configure specialist credentials, commission rate & profile photo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#6e7979] hover:bg-[#eaedff] dark:hover:bg-[#283044] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {/* Profile Photo Section with Live Preview & File Upload */}
          <div className="p-3.5 bg-[#f8fafc] dark:bg-[#1e293b]/50 rounded-xl border border-[#bec9c8]/30 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-[#131b2e] dark:text-[#faf8ff] flex items-center gap-1.5 text-xs">
                <ImageIcon className="w-4 h-4 text-[#005052] dark:text-[#84d4d5]" />
                Profile Photo
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowPresets(!showPresets)}
                  className="text-[11px] text-[#005052] dark:text-[#84d4d5] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {showPresets ? 'Hide Presets' : 'Choose Preset'}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Avatar Preview */}
              <div className="relative group shrink-0">
                <Avatar
                  src={avatarUrl}
                  name={name || 'Staff Member'}
                  sizeClassName="w-16 h-16"
                  className="border-2 border-[#005052]/30 shadow-xs text-lg"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[9px] font-bold transition-opacity cursor-pointer"
                  title="Upload new image"
                >
                  <Upload className="w-4 h-4 mb-0.5" />
                  Upload
                </button>
              </div>

              {/* Upload Controls & URL Input */}
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-[#005052] hover:bg-[#006a6c] text-white rounded-lg font-semibold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload from Device
                  </button>

                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="px-2.5 py-1.5 border border-[#bec9c8]/40 hover:bg-[#ffdad6]/40 text-[#ba1a1a] rounded-lg font-medium text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                      title="Clear photo"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </button>
                  )}
                </div>

                {/* Direct Image URL input */}
                <div>
                  <input
                    type="text"
                    placeholder="Or paste image URL (https://..., Google Drive, Unsplash)..."
                    value={avatarUrl.startsWith('data:image') ? '[Uploaded Image File from Device]' : avatarUrl}
                    onChange={handleUrlChange}
                    disabled={avatarUrl.startsWith('data:image')}
                    className="w-full h-8 px-2.5 rounded-lg border border-[#bec9c8]/40 bg-white dark:bg-[#131b2e] text-[#131b2e] dark:text-[#faf8ff] focus:outline-none focus:border-[#005052] text-[11px]"
                  />
                </div>
              </div>
            </div>

            {/* Error notice if upload or URL fails */}
            {uploadError && (
              <div className="text-[11px] text-[#ba1a1a] flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Preset Avatars Grid */}
            {showPresets && (
              <div className="pt-2 border-t border-[#bec9c8]/20">
                <p className="text-[11px] text-[#6e7979] dark:text-[#bec9c8] mb-2 font-medium">
                  Select a professional portrait:
                </p>
                <div className="grid grid-cols-6 gap-2">
                  {PRESET_AVATARS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setAvatarUrl(preset.url);
                        setShowPresets(false);
                      }}
                      className={`relative rounded-full p-0.5 border-2 transition-all cursor-pointer hover:scale-105 ${
                        avatarUrl === preset.url
                          ? 'border-[#005052] ring-2 ring-[#005052]/30'
                          : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                      title={preset.label}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Name & Title */}
          <div>
            <label className="font-semibold text-[#131b2e] dark:text-[#faf8ff] block mb-1">
              Physiotherapist Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Farhana Jahan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-[#bec9c8]/40 bg-white dark:bg-[#131b2e] text-[#131b2e] dark:text-[#faf8ff] focus:outline-none focus:border-[#005052]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[#131b2e] dark:text-[#faf8ff] block mb-1">
                Professional Title *
              </label>
              <input
                type="text"
                required
                placeholder="Senior Physiotherapist"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-[#bec9c8]/40 bg-white dark:bg-[#131b2e] text-[#131b2e] dark:text-[#faf8ff] focus:outline-none focus:border-[#005052]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#005052] dark:text-[#84d4d5] block mb-1">
                Commission Rate (%) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min={0}
                  max={100}
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                  className="w-full h-9 pl-3 pr-8 rounded-xl border-2 border-[#005052]/40 bg-white dark:bg-[#131b2e] text-[#131b2e] dark:text-[#faf8ff] font-bold text-sm focus:outline-none focus:border-[#005052]"
                />
                <Percent className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#005052] dark:text-[#84d4d5]" />
              </div>
            </div>
          </div>

          {/* Standard 15th-of-Month Rule Notice */}
          <div className="p-3 bg-[#f2f3ff] dark:bg-[#131b2e] rounded-xl border border-[#005052]/20 space-y-1">
            <div className="flex items-center gap-1.5 text-[#005052] dark:text-[#84d4d5] font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-[#005052] dark:text-[#84d4d5] shrink-0" />
              <span>Standard 15th-of-the-Month Commission Cycle</span>
            </div>
            <p className="text-[11px] text-[#6e7979] dark:text-[#bec9c8] leading-relaxed">
              Commission is calculated automatically on total package values and disbursed on the <strong>15th of every month</strong> for clients who completed full payment during the previous calendar month.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[#131b2e] dark:text-[#faf8ff] block mb-1">
                Phone
              </label>
              <input
                type="tel"
                placeholder="017XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-[#bec9c8]/40 bg-white dark:bg-[#131b2e] text-[#131b2e] dark:text-[#faf8ff] focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-[#131b2e] dark:text-[#faf8ff] block mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="physio@fitbackreset.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-[#bec9c8]/40 bg-white dark:bg-[#131b2e] text-[#131b2e] dark:text-[#faf8ff] focus:outline-none"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 flex items-center justify-between gap-2 border-t border-[#bec9c8]/20 shrink-0">
            {editingStaff && onDelete ? (
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(true)}
                className="px-3 py-2 rounded-xl bg-[#ffdad6] hover:bg-[#ba1a1a] text-[#ba1a1a] hover:text-white font-semibold transition-colors flex items-center gap-1 text-xs cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Delete Staff
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[#bec9c8]/40 text-[#6e7979] font-semibold hover:bg-[#f2f3ff] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#005052] text-white font-semibold hover:bg-[#006a6c] active:scale-95 shadow-xs transition-transform cursor-pointer"
              >
                Save Staff Profile
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      {editingStaff && (
        <ConfirmDeleteModal
          isOpen={isConfirmDeleteOpen}
          onClose={() => setIsConfirmDeleteOpen(false)}
          onConfirm={() => {
            if (onDelete) {
              onDelete(editingStaff.id);
              setIsConfirmDeleteOpen(false);
              onClose();
            }
          }}
          title="Delete Physiotherapist Profile"
          itemName={`${editingStaff.name} (${editingStaff.title})`}
          itemType="staff"
          isPermanent={false}
          confirmText="Delete & Move to Recycle Bin"
        />
      )}
    </div>
  );
};
