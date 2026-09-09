import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  PauseCircle,
  PlayCircle,
  Trash2,
  Receipt,
  CheckCircle,
} from 'lucide-react';
import { billService } from '../services/bill.service';
import { categoryService } from '../services/category.service';
import { Bill, BillStatus } from '../types/bill';
import { Category } from '../types/category';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/date';
import { Badge } from '../components/common/Badge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { CardSkeleton } from '../components/common/Skeleton';

export const Bills: React.FC = () => {
  const { showToast } = useToast();

  const [bills, setBills] = useState<Bill[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BillStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Dialog States
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'pause' | 'resume' | 'cancel' | 'pay';
    bill: Bill | null;
  }>({
    isOpen: false,
    type: 'pause',
    bill: null,
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBills = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await billService.getBills({
        status: statusFilter || undefined,
        categoryId: categoryFilter || undefined,
        search: search || undefined,
      });
      setBills(data);
    } catch (err: any) {
      showToast('Failed to load bills', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, categoryFilter, search, showToast]);

  useEffect(() => {
    categoryService.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBills();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchBills]);

  const handleActionConfirm = async () => {
    if (!confirmDialog.bill) return;
    const { type, bill } = confirmDialog;
    setActionLoading(true);

    try {
      if (type === 'pause') {
        await billService.pauseBill(bill._id);
        showToast(`Bill "${bill.name}" paused`, 'success');
      } else if (type === 'resume') {
        await billService.resumeBill(bill._id);
        showToast(`Bill "${bill.name}" resumed`, 'success');
      } else if (type === 'cancel') {
        await billService.cancelBill(bill._id);
        showToast(`Bill "${bill.name}" cancelled`, 'success');
      } else if (type === 'pay') {
        await billService.markPaid(bill._id);
        showToast(`Payment marked as paid for "${bill.name}"`, 'success');
      }
      await fetchBills();
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setActionLoading(false);
      setConfirmDialog({ isOpen: false, type: 'pause', bill: null });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bills & Subscriptions</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage all your active, paused, and cancelled recurring payments.
          </p>
        </div>
        <Link
          to="/bills/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Bill</span>
        </Link>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bills..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <Filter className="w-4 h-4" />
            <span>Filter:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as BillStatus | '')}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PAUSED">PAUSED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bills Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : bills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bills.map((bill) => (
            <div
              key={bill._id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{bill.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {bill.categoryId?.name || 'Uncategorized'}
                    </p>
                  </div>
                  <Badge status={bill.status} />
                </div>

                <div className="mt-4 space-y-1">
                  <p className="text-2xl font-extrabold text-slate-900">
                    {formatCurrency(bill.amount, bill.currency)}
                    <span className="text-xs font-normal text-slate-500 ml-1">
                      / {bill.frequency.toLowerCase()}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    Next Due Date: <span className="font-semibold text-slate-700">{formatDate(bill.nextDueDate)}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <Link
                    to={`/bills/${bill._id}`}
                    title="View Details"
                    className="p-2 text-slate-600 hover:text-brand-600 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <Link
                    to={`/bills/${bill._id}/edit`}
                    title="Edit Bill"
                    className="p-2 text-slate-600 hover:text-brand-600 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Link>
                  {bill.status === 'ACTIVE' && (
                    <button
                      onClick={() =>
                        setConfirmDialog({ isOpen: true, type: 'pause', bill })
                      }
                      title="Pause Bill"
                      className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    >
                      <PauseCircle className="w-4 h-4" />
                    </button>
                  )}
                  {bill.status === 'PAUSED' && (
                    <button
                      onClick={() =>
                        setConfirmDialog({ isOpen: true, type: 'resume', bill })
                      }
                      title="Resume Bill"
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <PlayCircle className="w-4 h-4" />
                    </button>
                  )}
                  {bill.status !== 'CANCELLED' && (
                    <button
                      onClick={() =>
                        setConfirmDialog({ isOpen: true, type: 'cancel', bill })
                      }
                      title="Cancel Bill"
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {bill.status === 'ACTIVE' && (
                  <button
                    onClick={() =>
                      setConfirmDialog({ isOpen: true, type: 'pay', bill })
                    }
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Pay</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-8">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No bills found</h3>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            Start by adding your first recurring bill or subscription to keep track of payments.
          </p>
          <Link
            to="/bills/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First Bill</span>
          </Link>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={`${
          confirmDialog.type === 'pause'
            ? 'Pause Bill'
            : confirmDialog.type === 'resume'
            ? 'Resume Bill'
            : confirmDialog.type === 'pay'
            ? 'Mark Payment as Paid'
            : 'Cancel Bill'
        }`}
        message={`Are you sure you want to ${confirmDialog.type} "${confirmDialog.bill?.name}"?`}
        confirmText={confirmDialog.type.toUpperCase()}
        isDangerous={confirmDialog.type === 'cancel'}
        isLoading={actionLoading}
        onConfirm={handleActionConfirm}
        onClose={() => setConfirmDialog({ isOpen: false, type: 'pause', bill: null })}
      />
    </div>
  );
};
