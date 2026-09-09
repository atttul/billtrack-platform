import React from 'react';
import { User as UserIcon, Mail, Globe, DollarSign, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Settings: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          View your profile preferences and system configuration.
        </p>
      </div>

      {/* User Profile Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-full bg-brand-600 text-white font-bold text-2xl flex items-center justify-center shadow-md">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full mt-2 border border-emerald-200">
              <Shield className="w-3.5 h-3.5" />
              <span>Verified Account</span>
            </span>
          </div>
        </div>

        {/* Profile Details List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 px-4 bg-slate-50/70 rounded-xl">
            <div className="flex items-center gap-3">
              <UserIcon className="w-5 h-5 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Display Name</span>
            </div>
            <span className="text-sm font-bold text-slate-900">{user?.name}</span>
          </div>

          <div className="flex items-center justify-between py-3 px-4 bg-slate-50/70 rounded-xl">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Email Address</span>
            </div>
            <span className="text-sm font-bold text-slate-900">{user?.email}</span>
          </div>

          <div className="flex items-center justify-between py-3 px-4 bg-slate-50/70 rounded-xl">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Primary Currency</span>
            </div>
            <span className="text-sm font-bold text-slate-900">{user?.currency || 'INR'}</span>
          </div>

          <div className="flex items-center justify-between py-3 px-4 bg-slate-50/70 rounded-xl">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Timezone</span>
            </div>
            <span className="text-sm font-bold text-slate-900">{user?.timezone || 'UTC'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
