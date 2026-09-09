import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Calendar,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  CheckCircle,
  Plus,
} from 'lucide-react';
import { dashboardService } from '../services/dashboard.service';
import { billService } from '../services/bill.service';
import { DashboardSummary } from '../types/dashboard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/currency';
import { formatDate, formatRelativeDays } from '../utils/date';
import { CardSkeleton } from '../components/common/Skeleton';
import { Badge } from '../components/common/Badge';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingBillId, setPayingBillId] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getDashboardSummary();
      setSummary(data);
    } catch (err: any) {
      setError('Unable to load dashboard metrics. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleMarkNextPaid = async (billId: string) => {
    setPayingBillId(billId);
    try {
      await billService.markPaid(billId);
      showToast('Payment marked as paid successfully!', 'success');
      await fetchDashboardData();
    } catch (err: any) {
      showToast(err.message || 'Failed to mark payment as paid', 'error');
    } finally {
      setPayingBillId(null);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8">
      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {getGreeting()}, {user?.name || 'Friend'} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Here is your financial summary and upcoming recurring payment schedule.
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

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Metric Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Monthly Recurring
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {formatCurrency(summary?.monthlyTotal || 0, user?.currency)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Estimated monthly commitment</p>
            </div>
            <div className="p-3 bg-brand-50 text-brand-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Active Bills
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {summary?.activeSubscriptions || 0}
              </p>
              <p className="text-xs text-slate-400 mt-1">Active recurring subscriptions</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Upcoming Due
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {summary?.upcomingPaymentsCount || 0}
              </p>
              <p className="text-xs text-slate-400 mt-1">Pending upcoming payments</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Next Payment Due
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {summary?.nextPayment
                  ? formatDate(summary.nextPayment.dueDate).slice(0, 6)
                  : 'None'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {summary?.nextPayment ? summary.nextPayment.name : 'No pending bills'}
              </p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard Section: Next Payment Spotlight & Upcoming List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Next Payment Highlight & Category Summary */}
        <div className="lg:col-span-2 space-y-8">
          {/* Next Payment Card */}
          {summary?.nextPayment && (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <CreditCard className="w-48 h-48" />
              </div>
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="space-y-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Next Due Payment
                  </span>
                  <h3 className="text-2xl font-bold text-white">{summary.nextPayment.name}</h3>
                  <p className="text-3xl font-extrabold text-white">
                    {formatCurrency(summary.nextPayment.amount, summary.nextPayment.currency)}
                  </p>
                  <p className="text-sm text-slate-300">
                    Due Date:{' '}
                    <span className="font-semibold text-white">
                      {formatDate(summary.nextPayment.dueDate)}
                    </span>{' '}
                    ({formatRelativeDays(summary.nextPayment.dueDate)})
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleMarkNextPaid(summary.nextPayment!.billId)}
                    disabled={payingBillId === summary.nextPayment.billId}
                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Mark as Paid</span>
                  </button>
                  <Link
                    to={`/bills/${summary.nextPayment.billId}`}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-center font-medium text-sm rounded-xl transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Category-wise Summary Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Spending by Category</h3>
            {summary?.categorySummary && summary.categorySummary.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {summary.categorySummary.map((cat) => (
                  <div
                    key={cat.categoryId}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color || '#64748b' }}
                      />
                      <span className="text-sm font-medium text-slate-700">{cat.categoryName}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      {formatCurrency(cat.monthlySpend, user?.currency)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 py-4 text-center">
                No active categories yet. Add bills to see category insights.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Upcoming Payment List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Upcoming Payments</h3>
              <Link
                to="/bills"
                className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {summary?.upcomingPayments && summary.upcomingPayments.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {summary.upcomingPayments.map((item) => (
                  <div key={item.id} className="py-3.5 flex items-center justify-between">
                    <div>
                      <Link
                        to={`/bills/${item.billId}`}
                        className="text-sm font-semibold text-slate-900 hover:text-brand-600 transition-colors"
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Due {formatDate(item.dueDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">
                        {formatCurrency(item.amount, item.currency)}
                      </p>
                      <Badge status={item.status} className="mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Calendar className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-sm">No upcoming payments</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
