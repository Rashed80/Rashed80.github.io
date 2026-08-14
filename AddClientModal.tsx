import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Calendar,
  Trash2,
  DollarSign,
  Tag,
  Info,
  Percent,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Client, Package, Payment, PaymentMethod, Physiotherapist } from '../../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Client, initialPayment?: Payment) => void;
  onDelete?: (clientId: string) => void;
  packages: Package[];
  physiotherapists: Physiotherapist[];
  payments?: Payment[];
  editingClient?: Client | null;
  nextClientId: string;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  packages,
  physiotherapists,
  payments = [],
  editingClient,
  nextClientId,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(editingClient?.name || '');
  const [phone, setPhone] = useState(editingClient?.phone || '');
  const [email, setEmail] = useState(editingClient?.email || '');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>(editingClient?.gender || 'Male');
  const [enrollmentDate, setEnrollmentDate] = useState(
    editingClient?.enrollmentDate || new Date().toISOString().split('T')[0]
  );
  const [physioId, setPhysioId] = useState(
    editingClient?.physiotherapistId || physiotherapists[0]?.id || ''
  );
  const [packageId, setPackageId] = useState(
    editingClient?.packageId || packages[0]?.id || ''
  );

  const selectedPkg = packages.find((p) => p.id === packageId) || packages[0];
  const [packagePrice, setPackagePrice] = useState<number>(
    editingClient?.packagePrice ?? selectedPkg?.price ?? 3000
  );

  // Initial discount percentage calculation
  const initialDiscountPercent =
    editingClient && editingClient.packagePrice > 0
      ? Math.round((editingClient.discount / editingClient.packagePrice) * 100)
      : 0;
  const [discountPercent, setDiscountPercent] = useState<number>(initialDiscountPercent);

  // Calculated discount in currency (৳) and final payable amount
  const discountAmount = Math.round((packagePrice * discountPercent) / 100);
  const finalAmount = Math.max(0, packagePrice - discountAmount);

  // Payments recorded previously for this client
  const clientPayments = editingClient ? payments.filter((p) => p.clientId === editingClient.id) : [];
  const existingTotalPaid = clientPayments.reduce((sum, p) => sum + p.amount, 0);

  // Initial Payment status choice
  const initialChoice = editingClient
    ? existingTotalPaid >= finalAmount && finalAmount > 0
      ? 'FULLY_PAID'
      : existingTotalPaid > 0
      ? 'PARTIALLY_PAID'
      : 'UNPAID'
    : 'UNPAID';

  const [paymentChoice, setPaymentChoice] = useState<'UNPAID' | 'PARTIALLY_PAID' | 'FULLY_PAID'>(
    initialChoice
  );
  const [initialPaidAmount, setInitialPaidAmount] = useState<number>(
    editingClient
      ? 0
      : paymentChoice === 'FULLY_PAID'
      ? finalAmount
      : paymentChoice === 'PARTIALLY_PAID'
      ? Math.round(finalAmount / 2)
      : 0
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bKash');
  const [notes, setNotes] = useState(editingClient?.notes || '');
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const handlePackageChange = (id: string) => {
    setPackageId(id);
    const pkg = packages.find((p) => p.id === id);
    if (pkg) {
      setPackagePrice(pkg.price);
      const newDiscAmount = Math.round((pkg.price * discountPercent) / 100);
      const newFinal = Math.max(0, pkg.price - newDiscAmount);
      if (paymentChoice === 'FULLY_PAID') {
        setInitialPaidAmount(newFinal);
      } else if (paymentChoice === 'PARTIALLY_PAID' && initialPaidAmount > newFinal) {
        setInitialPaidAmount(Math.round(newFinal / 2));
      }
    }
  };

  const handleDiscountPercentChange = (val: number) => {
    const clamped = Math.min(100, Math.max(0, val));
    setDiscountPercent(clamped);
    const newDiscAmount = Math.round((packagePrice * clamped) / 100);
    const newFinal = Math.max(0, packagePrice - newDiscAmount);
    if (paymentChoice === 'FULLY_PAID') {
      setInitialPaidAmount(newFinal);
    } else if (paymentChoice === 'PARTIALLY_PAID' && initialPaidAmount > newFinal) {
      setInitialPaidAmount(Math.round(newFinal / 2));
    }
  };

  const handlePaymentChoiceChange = (choice: 'UNPAID' | 'PARTIALLY_PAID' | 'FULLY_PAID') => {
    setPaymentChoice(choice);
    if (choice === 'UNPAID') {
      setInitialPaidAmount(0);
    } else if (choice === 'FULLY_PAID') {
      setInitialPaidAmount(finalAmount);
    } else if (choice === 'PARTIALLY_PAID') {
      if (initialPaidAmount <= 0 || initialPaidAmount >= finalAmount) {
        setInitialPaidAmount(Math.round(finalAmount / 2) || 1000);
      }
    }
  };

  // Live total calculation
  const newPaymentContribution = paymentChoice !== 'UNPAID' ? initialPaidAmount : 0;
  const effectiveTotalPaid = existingTotalPaid + newPaymentContribution;
  const remainingDue = Math.max(0, finalAmount - effectiveTotalPaid);

  let calculatedStatusBadge: 'PAID' | 'PARTIALLY PAID' | 'UNPAID' = 'UNPAID';
  if (effectiveTotalPaid >= finalAmount && finalAmount > 0) {
    calculatedStatusBadge = 'PAID';
  } else if (effectiveTotalPaid > 0) {
    calculatedStatusBadge = 'PARTIALLY PAID';
  } else {
    calculatedStatusBadge = 'UNPAID';
  }

  const handleDelete = () => {
    if (editingClient && onDelete) {
      onDelete(editingClient.id);
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const selectedPhysio = physiotherapists.find((p) => p.id === physioId);

    const newClient: Client = {
      id: editingClient?.id || nextClientId,
      name,
      phone,
      email,
      gender,
      enrollmentDate,
      physiotherapistId: physioId,
      packageId,
      packageName: selectedPkg?.name || 'Custom Package',
      packagePrice,
      discount: discountAmount,
      finalAmount,
      status: calculatedStatusBadge,
      notes,
      createdAt: editingClient?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let initialPaymentObj: Payment | undefined = undefined;
    if (newPaymentContribution > 0) {
      initialPaymentObj = {
        id: `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        clientId: newClient.id,
        physiotherapistId: physioId,
        amount: newPaymentContribution,
        paymentDate: enrollmentDate,
        paymentMethod,
        reference: `Enrollment (${paymentChoice === 'FULLY_PAID' ? 'Full' : 'Partial'} Payment)`,
        notes: `Initial enrollment payment`,
        commissionRateSnapshot: selectedPhysio?.commissionRate || 0,
        commissionAmount: Math.round((newPaymentContribution * (selectedPhysio?.commissionRate || 0)) / 100),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    onSave(newClient, initialPaymentObj);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#283044] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-[#bec9c8]/30 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-[#f2f3ff] dark:bg-[#131b2e] border-b border-[#bec9c8]/20 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-base text-[#131b2e] dark:text-[#faf8ff]">
              {editingClient ? 'Edit Client Record' : 'Enroll New Client'}
            </h3>
            <p className="text-xs text-[#6e7979]">
              Client ID: <strong className="font-semibold">{editingClient?.id || nextClientId}</strong>
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-[#6e7979] hover:bg-[#eaedff]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          <div>
            <label className="font-semibold text-[#131b2e] dark:text-[#faf8ff] block mb-1">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6e7979]" />
              <input
                type="text"
                required
                placeholder="e.g. Ahmed Rahman"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-[#bec9c8]/40 bg-white dark:bg-[#131b2e] text-[#131b2e] dark:text-[#faf8ff] focus:outline-none focus:ring-2 focus:ring-[#005052]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[#131b2e] dark:text-[#faf8ff] block mb-1">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6e7979]" />
                <input
                  type="tel"
                  required
                  placeholder="017XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-[#bec9c8]/40 bg-white dark:bg-[#131b2e] text-[#131b2e] dark:text-[#faf8ff] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-[#131b2e] dark:text-[#faf8ff] block mb-1">
                Enrollment Date *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6e7979]" />
                <input
                  type="date"
                  required
                  value={enrollmentDate}
                  onChange={(e) => setEnrollmentDate(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-[#bec9c8]/40 bg-white dark:bg-[#131b2e] text-[#131b2e] dark:text-[#faf8ff] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[#131b2e] dark:text-[#faf8ff] block mb-1">
                Physiotherapist *
              </label>
              <select
                value={physioId}
                onChange={(e) => setPhysioId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[#bec9c8]/40 bg-white dark:bg-[#131b2e] text-[#131b2e] dark:text-[#faf8ff] focus:outline-none"
              >
                {physiotherapists.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.commissionRate}%)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-[#131b2e] dark:text-[#faf8ff] block mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl border border-[#bec9c8]/40 bg-white dark:bg-[#131b2e] text-[#131b2e] dark:text-[#faf8ff] focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Package & Percentage Discount Selection */}
          <div className="p-3 bg-[#faf8ff] dark:bg-[#131b2e] rounded-xl border border-[#bec9c8]/30 space-y-3">
            <div>
              <label className="font-semibold text-[#131b2e] dark:text-[#faf8ff] block mb-1">
                Select Therapy Package *
              </label>
              <select
                value={packageId}
                onChange={(e) => handlePackageChange(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[#bec9c8]/40 bg-white dark:bg-[#283044] text-[#131b2e] dark:text-[#faf8ff] focus:outline-none font-medium"
              >
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} — ৳{pkg.price.toLocaleString()} ({pkg.sessionCount} Sessions)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] font-medium text-[#6e7979] block mb-1">Price (৳)</label>
                <input
                  type="number"
                  value={packagePrice}
                  onChange={(e) => setPackagePrice(parseFloat(e.target.value) || 0)}
                  className="w-full h-9 px-2 rounded-lg border border-[#bec9c8]/40 bg-white dark:bg-[#283044] text-[#131b2e] dark:text-[#faf8ff] font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#005052] dark:text-[#84d4d5] block mb-1">
                  Discount (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={discountPercent}
                    onChange={(e) => handleDiscountPercentChange(parseFloat(e.target.value) || 0)}
                    className="w-full h-9 pl-2 pr-6 rounded-lg border-2 border-[#005052]/40 bg-white dark:bg-[#283044] text-[#131b2e] dark:text-[#faf8ff] font-bold focus:outline-none focus:border-[#005052]"
                  />
                  <Percent className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-[#005052] dark:text-[#84d4d5]" />
                </div>
                {discountAmount > 0 && (
                  <span className="text-[10px] font-semibold text-[#005052] dark:text-[#84d4d5] mt-0.5 block">
                    -৳{discountAmount.toLocaleString()} off
                  </span>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#005052] dark:text-[#84d4d5] block mb-1">
                  Final Payable
                </label>
                <div className="h-9 px-2 rounded-lg bg-[#eaedff] dark:bg-[#283044] border border-[#005052]/20 flex items-center font-bold text-sm text-[#005052] dark:text-[#84d4d5]">
                  ৳{finalAmount.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status & Settlement Section */}
          <div className="p-3 bg-[#f2f3ff] dark:bg-[#131b2e] rounded-xl border border-[#bec9c8]/40 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-xs text-[#131b2e] dark:text-[#faf8ff] flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-[#005052] dark:text-[#84d4d5]" />
                Payment Settlement Status *
              </label>
              <span className="text-[11px] font-bold text-[#6e7979]">
                Status:{' '}
                <span
                  className={
                    calculatedStatusBadge === 'PAID'
                      ? 'text-[#137333]'
                      : calculatedStatusBadge === 'PARTIALLY PAID'
                      ? 'text-[#8a5a19]'
                      : 'text-[#ba1a1a]'
                  }
                >
                  {calculatedStatusBadge}
                </span>
              </span>
            </div>

            {/* Payment Choice Selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handlePaymentChoiceChange('UNPAID')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                  paymentChoice === 'UNPAID'
                    ? 'bg-[#ffdad6] text-[#ba1a1a] border-[#ba1a1a] shadow-xs'
                    : 'bg-white dark:bg-[#283044] text-[#6e7979] border-[#bec9c8]/40 hover:bg-[#eaedff]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Unpaid
              </button>

              <button
                type="button"
                onClick={() => handlePaymentChoiceChange('PARTIALLY_PAID')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                  paymentChoice === 'PARTIALLY_PAID'
                    ? 'bg-[#ffebd2] text-[#8a5a19] border-[#8a5a19] shadow-xs'
                    : 'bg-white dark:bg-[#283044] text-[#6e7979] border-[#bec9c8]/40 hover:bg-[#eaedff]'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                Partially Paid
              </button>

              <button
                type="button"
                onClick={() => handlePaymentChoiceChange('FULLY_PAID')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                  paymentChoice === 'FULLY_PAID'
                    ? 'bg-[#e6f4ea] text-[#137333] border-[#137333] shadow-xs'
                    : 'bg-white dark:bg-[#283044] text-[#6e7979] border-[#bec9c8]/40 hover:bg-[#eaedff]'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Fully Paid
              </button>
            </div>

            {/* Paid Amount and Payment Method input if Partial or Full */}
            {paymentChoice !== 'UNPAID' && (
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#bec9c8]/20">
                <div>
                  <label className="text-[11px] font-semibold text-[#131b2e] dark:text-[#faf8ff] block mb-1">
                    {editingClient ? 'New Payment Amount (৳) *' : 'Initial Paid Amount (৳) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={finalAmount}
                    value={initialPaidAmount}
                    disabled={paymentChoice === 'FULLY_PAID'}
                    onChange={(e) => setInitialPaidAmount(parseFloat(e.target.value) || 0)}
                    className="w-full h-9 px-2.5 rounded-lg border border-[#bec9c8]/40 bg-white dark:bg-[#283044] font-bold text-[#131b2e] dark:text-[#faf8ff] focus:outline-none disabled:opacity-80"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#131b2e] dark:text-[#faf8ff] block mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full h-9 px-2 rounded-lg border border-[#bec9c8]/40 bg-white dark:bg-[#283044] font-semibold text-[#131b2e] dark:text-[#faf8ff] focus:outline-none"
                  >
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Card">POS Card</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            )}

            {/* Live Auto-Calculation Breakdown */}
            <div className="p-2.5 bg-white dark:bg-[#283044] rounded-lg border border-[#bec9c8]/30 grid grid-cols-3 gap-2 text-center text-[11px]">
              <div>
                <span className="text-[#6e7979] block text-[10px]">Final Payable</span>
                <span className="font-bold text-[#131b2e] dark:text-[#faf8ff]">৳{finalAmount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[#6e7979] block text-[10px]">Total Paid</span>
                <span className="font-bold text-[#137333]">৳{effectiveTotalPaid.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[#6e7979] block text-[10px]">Remaining Due</span>
                <span className={`font-bold ${remainingDue > 0 ? 'text-[#ba1a1a]' : 'text-[#28695c]'}`}>
                  ৳{remainingDue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="font-semibold text-[#131b2e] dark:text-[#faf8ff] block mb-1">
              Clinical / Administrative Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Lumbar spine rehabilitation goals, special instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#bec9c8]/40 bg-white dark:bg-[#131b2e] text-[#131b2e] dark:text-[#faf8ff] focus:outline-none"
            ></textarea>
          </div>

          <div className="pt-3 flex items-center justify-between gap-2 border-t border-[#bec9c8]/20">
            {editingClient && onDelete ? (
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(true)}
                className="px-3 py-2 rounded-xl bg-[#ffdad6] hover:bg-[#ba1a1a] text-[#ba1a1a] hover:text-white font-semibold transition-colors flex items-center gap-1 text-xs cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Delete Profile
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[#bec9c8]/40 text-[#6e7979] font-semibold hover:bg-[#f2f3ff] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#005052] text-white font-semibold hover:bg-[#006a6c] active:scale-95 shadow-xs cursor-pointer"
              >
                Save Client Record
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      {editingClient && (
        <ConfirmDeleteModal
          isOpen={isConfirmDeleteOpen}
          onClose={() => setIsConfirmDeleteOpen(false)}
          onConfirm={() => {
            if (onDelete) {
              onDelete(editingClient.id);
              setIsConfirmDeleteOpen(false);
              onClose();
            }
          }}
          title="Delete Client Record"
          itemName={`${editingClient.name} (${editingClient.id})`}
          itemType="client"
          isPermanent={false}
          confirmText="Delete & Move to Recycle Bin"
        />
      )}
    </div>
  );
};

