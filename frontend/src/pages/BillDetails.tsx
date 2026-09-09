import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  PauseCircle,
  PlayCircle,
  Trash2,
  CheckCircle,
  SkipForward,
  History,
  Calendar,
  Bell,
  Receipt,
  AlertCircle,
} from 'lucide-react';
import { billService } from '../services/bill.service';
import { paymentService } from '../services/payment.service';
import { Bill } from '../types/bill';
import { PaymentOccurrence } from '../types/payment';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/currency';
import { formatDate, formatRelativeDays } from '../utils/date';
import { Badge } from '../components/common/Badge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Spinner } from '../components/common/Spinner';

export const BillDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [bill, setBill] = useState<Bill | null>(null);
  const [payments, setPayments] = useState<PaymentOccurrence[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog States
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'pause' | 'resume' | 'cancel' | 'pay' | 'skip';
  }>({
    isOpen: false,
    type: 'pause',
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetails = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [billData, paymentData] = await Promise.all([
        billService.getBillById(id),
        paymentService.getPaymentHistoryByBill(id, 1, 5),
      ]);
      setBill(billData);
      setPayments(paymentData.data);
    } catch (err: any) {
      showToast('Failed to load bill details', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleActionConfirm = async () => {
    if (!id || !bill) return;
    setActionLoading(true);

    try {
      if (confirmDialog.type === 'pause') {
        await billService.pauseBill(id);
        showToast('Bill paused', 'success');
      } else if (confirmDialog.type === 'resume') {
        await billService.resumeBill(id);
        showToast('Bill resumed', 'success');
      } else if (confirmDialog.type === 'cancel') {
        await billService.cancelBill(id);
        showToast('Bill cancelled', 'success');
        navigate('/bills');
        return;
      } else if (confirmDialog.type === 'pay') {
        await billService.markPaid(id);
        showToast('Payment marked as paid!', 'success');
      } else if (confirmDialog.type === 'skip') {
        await billService.skipPayment(id);
        showToast('Payment occurrence skipped', 'info');
      }
      await fetchDetails();
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    } finally {
      setActionLoading(false);
      setConfirmDialog({ isOpen: false, type: 'pause' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="text-center py-16 space-y-4">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Bill not found</h2>
        <Link
          to="/bills"
          className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Bills</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/bills"
            className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{bill.name}</h1>
              <Badge status={bill.status} />
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Category: {bill.categoryId?.name || 'Uncategorized'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to={`/bills/${bill._id}/edit`}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            <span>Edit</span>
          </Link>

          {bill.status === 'ACTIVE' && (
            <button
              onClick={() => setConfirmDialog({ isOpen: true, type: 'pause' })}
              className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              <PauseCircle className="w-4 h-4" />
              <span>Pause</span>
            </button>
          )}

          {bill.status === 'PAUSED' && (
            <button
              onClick={() => setConfirmDialog({ isOpen: true, type: 'resume' })}
              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Resume</span>
            </button>
          )}

          {bill.status !== 'CANCELLED' && (
            <button
              onClick={() => setConfirmDialog({ isOpen: true, type: 'cancel' })}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Info Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Amount & Frequency
          </p>
          <p className="text-3xl font-extrabold text-slate-900">
            {formatCurrency(bill.amount, bill.currency)}
          </p>
          <p className="text-sm font-medium text-brand-600 capitalize">
            {bill.frequency.toLowerCase()} payment
          </p>
        </div>

        <div className="pt-4 md:pt-0 md:pl-6 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Next Scheduled Due Date
          </p>
          <p className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-400" />
            <span>{formatDate(bill.nextDueDate)}</span>
          </p>
          <p className="text-xs font-medium text-amber-600">
            {formatRelativeDays(bill.nextDueDate)}
          </p>
        </div>

        <div className="pt-4 md:pt-0 md:pl-6 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Reminder Alerts
          </p>
          <p className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-slate-400" />
            <span>{bill.reminderDaysBefore} days before due</span>
          </p>
          <p className="text-xs text-slate-500">Automated email alerts via BullMQ</p>
        </div>
      </div>

      {/* Action Prompt Bar */}
      {bill.status === 'ACTIVE' && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold">Manage Current Payment Cycle</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Mark this payment as paid when completed, or skip if not applicable.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setConfirmDialog({ isOpen: true, type: 'skip' })}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <SkipForward className="w-4 h-4" />
              <span>Skip</span>
            </button>
            <button
              onClick={() => setConfirmDialog({ isOpen: true, type: 'pay' })}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Mark as Paid</span>
            </button>
          </div>
        </div>
      )}

      {/* Payment History Preview Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-500" />
            <h3 className="text-lg font-bold text-slate-900">Recent Payment History</h3>
          </div>
          <Link
            to={`/bills/${bill._id}/payments`}
            className="text-xs font-semibold text-brand-600 hover:underline"
          >
            View Full History
          </Link>
        </div>

        {payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Paid At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {formatDate(p.dueDate)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {formatCurrency(p.amount, bill.currency)}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={p.status} />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {p.paidAt ? formatDate(p.paidAt) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400">
            <Receipt className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm">No payment history recorded yet</p>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={`${confirmDialog.type.toUpperCase()} BILL`}
        message={`Are you sure you want to perform "${confirmDialog.type}" action on ${bill.name}?`}
        confirmText={confirmDialog.type.toUpperCase()}
        isDangerous={confirmDialog.type === 'cancel'}
        isLoading={actionLoading}
        onConfirm={handleActionConfirm}
        onClose={() => setConfirmDialog({ isOpen: false, type: 'pause' })}
      />
    </div>
  );
};
