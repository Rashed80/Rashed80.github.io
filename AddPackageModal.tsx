import React, { useState } from 'react';
import { X, Package as PackageIcon } from 'lucide-react';
import { Package } from '../../types';

interface AddPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pkg: Package) => void;
}

export const AddPackageModal: React.FC<AddPackageModalProps> = ({ isOpen, onClose, onSave }) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sessionCount, setSessionCount] = useState(10);
  const [price, setPrice] = useState(10000);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || price <= 0) return;

    const pkg: Package = {
      id: `pkg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name,
      description,
      sessionCount,
      price,
      isActive: true,
    };

    onSave(pkg);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#283044] rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-[#bec9c8]/30">
        <div className="px-5 py-4 bg-[#f2f3ff] dark:bg-[#131b2e] border-b border-[#bec9c8]/20 flex justify-between items-center">
          <h3 className="font-bold text-base text-[#131b2e] dark:text-[#faf8ff]">
            Add Custom Therapy Package
          </h3>
          <button onClick={onClose} className="p-1 rounded-full text-[#6e7979] hover:bg-[#eaedff]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div>
            <label className="font-semibold text-[#131b2e] dark:text-[#faf8ff] block mb-1">
              Package Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Postural Correction 8 Sessions"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-[#bec9c8]/40 bg-white dark:bg-[#131b2e] text-[#131b2e] dark:text-[#faf8ff] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[#131b2e] dark:text-[#faf8ff] block mb-1">
                Session Count *
              </label>
              <input
                type="number"
                required
                min={1}
                value={sessionCount}
                onChange={(e) => setSessionCount(parseInt(e.target.value, 10) || 1)}
                className="w-full h-10 px-3 rounded-xl border border-[#bec9c8]/40 bg-white dark:bg-[#131b2e] text-[#131b2e] dark:text-[#faf8ff] focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-[#131b2e] dark:text-[#faf8ff] block mb-1">
                Price (BDT ৳) *
              </label>
              <input
                type="number"
                required
                min={1}
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="w-full h-10 px-3 rounded-xl border border-[#bec9c8]/40 bg-white dark:bg-[#131b2e] text-[#131b2e] dark:text-[#faf8ff] focus:outline-none font-bold"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-[#131b2e] dark:text-[#faf8ff] block mb-1">
              Description
            </label>
            <input
              type="text"
              placeholder="e.g. Targeted spinal alignment plan"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              className="px-5 py-2 rounded-xl bg-[#005052] text-white font-semibold hover:bg-[#006a6c] active:scale-95 shadow-xs"
            >
              Save Package
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
