import React, { useEffect, useState, useCallback } from 'react';
import { Bell, Mail } from 'lucide-react';
import { notificationService } from '../services/notification.service';
import { Notification } from '../types/notification';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/date';
import { Badge } from '../components/common/Badge';
import { Spinner } from '../components/common/Spinner';

export const Notifications: React.FC = () => {
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch {
      showToast('Failed to load notifications', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Notification Alerts Log</h1>
        <p className="text-sm text-slate-500 mt-1">
          Audit history of all background email reminders generated and dispatched via BullMQ.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : notifications.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <div
                key={n._id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl flex-shrink-0 mt-0.5">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      {n.billId?.name || 'Bill Reminder'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Scheduled Date: {formatDate(n.scheduledAt)}
                    </p>
                    {n.errorMessage && (
                      <p className="text-xs text-rose-600 mt-1 font-medium">
                        Error: {n.errorMessage}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center">
                  <div className="text-right">
                    <Badge status={n.status} />
                    <p className="text-xs text-slate-400 mt-1">
                      {n.sentAt ? `Sent: ${formatDate(n.sentAt)}` : 'Pending dispatch'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-8">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No notifications yet</h3>
          <p className="text-sm text-slate-500 mt-1">
            Automated email reminder logs will appear here as your bill due dates approach.
          </p>
        </div>
      )}
    </div>
  );
};
