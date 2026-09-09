import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, History } from 'lucide-react';
import { paymentService } from '../services/payment.service';
import { billService } from '../services/bill.service';
import { Bill } from '../types/bill';
import { PaymentOccurrence } from '../types/payment';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/date';
import { Badge } from '../components/common/Badge';
import { Spinner } from '../components/common/Spinner';

export const PaymentHistory: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [bill, setBill] = useState<Bill | null>(null);
  const [payments, setPayments] = useState<PaymentOccurrence[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [billData, historyData] = await Promise.all([
        billService.getBillById(id),
        paymentService.getPaymentHistoryByBill(id, page, 20),
      ]);
      setBill(billData);
      setPayments(historyData.data);
      setTotalPages(historyData.pagination.totalPages);
    } catch (err: any) {
      showToast('Failed to load payment history', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [id, page, showToast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to={`/bills/${id}`}
          className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Payment History: {bill?.name}
          </h1>
          <p className="text-sm text-slate-500">
            Historical list of all past and pending payment cycles
          </p>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        {payments.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-4">Due Date</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Paid At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {payments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-4 font-semibold text-slate-900">
                        {formatDate(payment.dueDate)}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-900">
                        {formatCurrency(payment.amount, bill?.currency)}
                      </td>
                      <td className="py-4 px-4">
                        <Badge status={payment.status} />
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-500">
                        {payment.paidAt ? formatDate(payment.paidAt) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg"
                >
                  Previous
                </button>
                <span className="text-xs text-slate-500 font-medium">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center text-slate-400">
            <History className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-medium">No payment history found</p>
          </div>
        )}
      </div>
    </div>
  );
};
