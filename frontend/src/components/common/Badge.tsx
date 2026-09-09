import React from 'react';

export type BadgeVariant =
  | 'ACTIVE'
  | 'PAUSED'
  | 'CANCELLED'
  | 'PENDING'
  | 'PAID'
  | 'MISSED'
  | 'SKIPPED'
  | 'SENT'
  | 'FAILED';

export const Badge: React.FC<{ status: string; className?: string }> = ({ status, className = '' }) => {
  const normalized = status.toUpperCase() as BadgeVariant;

  const styles: Record<BadgeVariant, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    SENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    PAUSED: 'bg-amber-50 text-amber-700 border-amber-200',
    PENDING: 'bg-blue-50 text-blue-700 border-blue-200',
    SKIPPED: 'bg-slate-100 text-slate-700 border-slate-200',
    CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
    MISSED: 'bg-rose-50 text-rose-700 border-rose-200',
    FAILED: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const defaultStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  const badgeStyle = styles[normalized] || defaultStyle;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle} ${className}`}
    >
      {normalized}
    </span>
  );
};
