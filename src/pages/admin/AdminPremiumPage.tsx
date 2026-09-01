import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getAllPremiumRequests,
  getPremiumSettings,
  updatePremiumSettings,
  approvePremiumPaymentRequest,
  rejectPremiumPaymentRequest,
  getAllUsers,
  manuallySetUserPremium,
  extendUserPremium,
  findUserById,
} from '../../services/storage';
import {
  PremiumPaymentRequest,
  PremiumSettings,
  User,
} from '../../types';
import {
  Crown,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Filter,
  Eye,
  Check,
  X,
  AlertCircle,
  Upload,
  Calendar,
  UserCheck,
  UserX,
  Plus,
  RefreshCw,
  Sparkles,
  QrCode,
  ShieldCheck,
  Coins,
  ExternalLink,
  ChevronRight,
  Save,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AdminPremiumPage: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [requests, setRequests] = useState<PremiumPaymentRequest[]>([]);
  const [settings, setSettings] = useState<PremiumSettings>(getPremiumSettings());
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<
    'pending' | 'all' | 'approved' | 'rejected' | 'users' | 'settings'
  >('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [viewScreenshotUrl, setViewScreenshotUrl] = useState<string | null>(null);
  const [approveModalReq, setApproveModalReq] = useState<PremiumPaymentRequest | null>(null);
  const [approveDurationDays, setApproveDurationDays] = useState<number>(120);
  const [rejectModalReq, setRejectModalReq] = useState<PremiumPaymentRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // Manual Grant Modal
  const [isManualGrantOpen, setIsManualGrantOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [manualDurationDays, setManualDurationDays] = useState<number>(120);

  // Extend Modal
  const [extendModalUser, setExtendModalUser] = useState<User | null>(null);
  const [extendDays, setExtendDays] = useState<number>(30);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<PremiumSettings>(getPremiumSettings());
  const [qrFilePreview, setQrFilePreview] = useState<string | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const loadData = () => {
    setRequests(getAllPremiumRequests());
    const s = getPremiumSettings();
    setSettings(s);
    setSettingsForm(s);
    setQrFilePreview(s.qrCodeUrl || null);
    setUsers(getAllUsers());
  };

  useEffect(() => {
    loadData();

    const handleSync = () => {
      loadData();
    };

    window.addEventListener('asjadfx_data_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('asjadfx_data_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const pendingRequests = requests.filter((r) => r.payment_status === 'pending');
  const approvedRequests = requests.filter((r) => r.payment_status === 'approved');
  const rejectedRequests = requests.filter((r) => r.payment_status === 'rejected');

  const activePremiumUsers = users.filter(
    (u) => u.membership_type === 'premium' && u.premium_status === 'active'
  );

  const filteredRequests = requests.filter((r) => {
    if (activeTab === 'pending' && r.payment_status !== 'pending') return false;
    if (activeTab === 'approved' && r.payment_status !== 'approved') return false;
    if (activeTab === 'rejected' && r.payment_status !== 'rejected') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchUser =
        r.username.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.transaction_id.toLowerCase().includes(q) ||
        (r.fullName && r.fullName.toLowerCase().includes(q));
      if (!matchUser) return false;
    }

    return true;
  });

  const filteredUsers = users.filter((u) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.fullName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Handle Approve Request
  const handleOpenApproveModal = (req: PremiumPaymentRequest) => {
    setApproveModalReq(req);
    setApproveDurationDays(settings.durationDays || 120);
  };

  const handleConfirmApprove = () => {
    if (!approveModalReq || !currentAdmin) return;
    const res = approvePremiumPaymentRequest(
      approveModalReq.id,
      currentAdmin,
      approveDurationDays
    );
    if (res.success) {
      setNotice({
        type: 'success',
        message: `Approved Premium for @${approveModalReq.username} for ${approveDurationDays} days!`,
      });
      setApproveModalReq(null);
      loadData();
    } else {
      setNotice({ type: 'error', message: res.error || 'Failed to approve request.' });
    }
  };

  // Handle Reject Request
  const handleOpenRejectModal = (req: PremiumPaymentRequest) => {
    setRejectModalReq(req);
    setRejectionReason('Payment reference / UTR not found in official bank records.');
  };

  const handleConfirmReject = () => {
    if (!rejectModalReq || !currentAdmin) return;
    if (!rejectionReason.trim()) {
      setNotice({ type: 'error', message: 'Rejection reason is required.' });
      return;
    }
    const res = rejectPremiumPaymentRequest(rejectModalReq.id, rejectionReason, currentAdmin);
    if (res.success) {
      setNotice({
        type: 'success',
        message: `Rejected payment request from @${rejectModalReq.username}. User has been notified.`,
      });
      setRejectModalReq(null);
      loadData();
    } else {
      setNotice({ type: 'error', message: res.error || 'Failed to reject request.' });
    }
  };

  // Handle Manual Set User Premium
  const handleManualGrant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !currentAdmin) return;
    const res = manuallySetUserPremium(selectedUserId, true, manualDurationDays, currentAdmin);
    if (res.success) {
      setNotice({
        type: 'success',
        message: `Successfully granted Premium membership for ${manualDurationDays} days!`,
      });
      setIsManualGrantOpen(false);
      setSelectedUserId('');
      loadData();
    } else {
      setNotice({ type: 'error', message: res.error || 'Failed to grant Premium.' });
    }
  };

  // Handle Revoke Premium
  const handleRevokePremium = (u: User) => {
    if (!currentAdmin) return;
    if (window.confirm(`Revoke Premium status for @${u.username}?`)) {
      const res = manuallySetUserPremium(u.id, false, 0, currentAdmin);
      if (res.success) {
        setNotice({ type: 'success', message: `Revoked Premium for @${u.username}.` });
        loadData();
      }
    }
  };

  // Handle Extend User Premium
  const handleConfirmExtend = () => {
    if (!extendModalUser || !currentAdmin) return;
    const res = extendUserPremium(extendModalUser.id, extendDays, currentAdmin);
    if (res.success) {
      setNotice({
        type: 'success',
        message: `Extended @${extendModalUser.username}'s Premium by +${extendDays} days!`,
      });
      setExtendModalUser(null);
      loadData();
    } else {
      setNotice({ type: 'error', message: res.error || 'Failed to extend subscription.' });
    }
  };

  // Handle QR Upload in Settings
  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setQrFilePreview(dataUrl);
      setSettingsForm((prev) => ({ ...prev, qrCodeUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  // Handle Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    updatePremiumSettings({
      planName: settingsForm.planName,
      price: Number(settingsForm.price),
      durationDays: Number(settingsForm.durationDays),
      extraCoinsPercentage: Number(settingsForm.extraCoinsPercentage || 25),
      receiverName: settingsForm.receiverName,
      upiId: settingsForm.upiId,
      qrCodeUrl: settingsForm.qrCodeUrl,
      instructions: settingsForm.instructions,
      enabled: settingsForm.enabled,
    });
    setIsSavingSettings(false);
    setNotice({ type: 'success', message: 'Premium plan & QR settings updated successfully!' });
    loadData();
  };

  return (
    <div id="admin-premium-page" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700] text-xs font-bold uppercase tracking-wider font-mono mb-2">
            <Crown className="w-3.5 h-3.5 fill-[#FFD700]" />
            <span>VIP Management Center</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-['Space_Grotesk'] tracking-tight">
            Premium Subscriptions
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review manual QR payment requests, approve/reject VIP memberships, and configure payment QR details.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsManualGrantOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FFD700] to-amber-500 text-black font-extrabold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(255,215,0,0.3)] hover:scale-105 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>GRANT PREMIUM MANUALLY</span>
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center justify-between gap-3 font-semibold ${
            notice.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-3">
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{notice.message}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0F131C] border border-amber-500/30 space-y-1">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Pending Verification</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">{pendingRequests.length}</div>
          <div className="text-[10px] text-slate-400">Awaiting Admin Approval</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0F131C] border border-[#FFD700]/30 space-y-1">
          <div className="flex items-center justify-between text-[#FFD700]">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Active Premium</span>
            <Crown className="w-4 h-4 fill-[#FFD700]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#FFD700] font-mono">
            {activePremiumUsers.length}
          </div>
          <div className="text-[10px] text-slate-400">Users with Active VIP</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0F131C] border border-emerald-500/20 space-y-1">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Approved Requests</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {approvedRequests.length}
          </div>
          <div className="text-[10px] text-slate-400">Total Activated</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0F131C] border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Plan Price</span>
            <Coins className="w-4 h-4 text-[#FFD700]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">₹{settings.price}</div>
          <div className="text-[10px] text-slate-400">{settings.durationDays} Days (4 Months)</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Requests</span>
            {pendingRequests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black font-black text-[10px] font-mono">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/40'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>All Requests ({requests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('approved')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'approved'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Approved ({approvedRequests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'rejected'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Rejected ({rejectedRequests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/40'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Active VIP Users ({activePremiumUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Payment & QR Settings</span>
          </button>
        </div>

        {/* Search */}
        {activeTab !== 'settings' && (
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by user or UTR ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-[#FFD700]"
            />
          </div>
        )}
      </div>

      {/* TAB CONTENT 1: Requests Lists (Pending, All, Approved, Rejected) */}
      {activeTab !== 'users' && activeTab !== 'settings' && (
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#0F131C] border border-white/5 space-y-2">
              <Crown className="w-8 h-8 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-400">No payment requests found</h3>
              <p className="text-xs text-slate-600">
                {activeTab === 'pending'
                  ? 'All payment requests have been reviewed!'
                  : 'No payment submissions match the current filter.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredRequests.map((req) => (
                <div
                  key={req.id}
                  className={`p-5 rounded-3xl bg-[#0F131C] border transition-all ${
                    req.payment_status === 'pending'
                      ? 'border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                      : req.payment_status === 'approved'
                      ? 'border-emerald-500/30'
                      : 'border-rose-500/20 opacity-80'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* User & Request Info */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#161B24] border border-white/10 flex items-center justify-center font-black text-base text-[#FFD700] shrink-0">
                        {req.avatarUrl ? (
                          <span>{req.avatarUrl}</span>
                        ) : (
                          req.username.charAt(0).toUpperCase()
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-extrabold text-white text-base">@{req.username}</h3>
                          {req.fullName && (
                            <span className="text-xs text-slate-400">({req.fullName})</span>
                          )}
                          {req.payment_status === 'pending' ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-black uppercase">
                              ⏳ PENDING VERIFICATION
                            </span>
                          ) : req.payment_status === 'approved' ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-black uppercase">
                              ✓ APPROVED & ACTIVE
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono font-black uppercase">
                              ✕ REJECTED
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono">
                          <span>
                            Plan: <strong className="text-white">{req.plan_name}</strong>
                          </span>
                          <span>
                            Amount: <strong className="text-[#FFD700]">₹{req.amount}</strong>
                          </span>
                          <span>
                            UTR / TxID:{' '}
                            <strong className="text-[#00FF66] bg-black/40 px-1.5 py-0.5 rounded">
                              {req.transaction_id}
                            </strong>
                          </span>
                          <span>{new Date(req.request_created_at).toLocaleString()}</span>
                        </div>

                        {req.rejection_reason && (
                          <div className="text-xs text-rose-400 font-mono pt-1">
                            Rejection Reason: "{req.rejection_reason}"
                          </div>
                        )}

                        {req.reviewed_by && (
                          <div className="text-[11px] text-slate-500 font-mono">
                            Reviewed by: {req.reviewed_by} on{' '}
                            {req.reviewed_at ? new Date(req.reviewed_at).toLocaleDateString() : ''}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Screenshot Preview & Actions */}
                    <div className="flex flex-wrap items-center gap-3 self-end lg:self-center">
                      {req.payment_screenshot_url && (
                        <button
                          onClick={() => setViewScreenshotUrl(req.payment_screenshot_url || null)}
                          className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-4 h-4 text-[#FFD700]" />
                          <span>View Screenshot</span>
                        </button>
                      )}

                      {req.payment_status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleOpenRejectModal(req)}
                            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <X className="w-4 h-4" />
                            <span>Reject</span>
                          </button>

                          <button
                            onClick={() => handleOpenApproveModal(req)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00FF66] to-emerald-400 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,255,102,0.3)] hover:scale-105 transition-all cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>Approve & Activate</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: Active VIP Users Table */}
      {activeTab === 'users' && (
        <div className="rounded-3xl bg-[#0F131C] border border-white/5 overflow-hidden shadow-xl">
          <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-white">Active Premium Members</h2>
              <p className="text-xs text-slate-400">
                All registered users with active VIP status & expiration dates
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#FFD700]/20 text-[#FFD700] font-mono font-bold text-xs">
              {activePremiumUsers.length} Active VIPs
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 bg-[#0A0D14]/80 text-slate-400 uppercase font-mono text-[11px]">
                  <th className="py-4 px-6">User</th>
                  <th className="py-4 px-6">Email</th>
                  <th className="py-4 px-6">Coins Balance</th>
                  <th className="py-4 px-6">VIP Started</th>
                  <th className="py-4 px-6">Expires On</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {activePremiumUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 font-mono">
                      No active premium members yet.
                    </td>
                  </tr>
                ) : (
                  activePremiumUsers.map((u) => {
                    const daysLeft = u.premium_expires_at
                      ? Math.max(
                          0,
                          Math.ceil(
                            (new Date(u.premium_expires_at).getTime() - Date.now()) /
                              (1000 * 60 * 60 * 24)
                          )
                        )
                      : 0;

                    return (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#FFD700]/20 border border-[#FFD700]/40 flex items-center justify-center font-bold text-[#FFD700] text-xs">
                              {u.avatarUrl || u.username[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>@{u.username}</span>
                                <span className="text-[#FFD700]">👑</span>
                              </div>
                              <div className="text-[11px] text-slate-400">{u.fullName}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6 font-mono text-slate-300">{u.email}</td>

                        <td className="py-4 px-6 font-mono font-bold text-[#FFD700]">
                          🪙 {u.coins ?? 0}
                        </td>

                        <td className="py-4 px-6 font-mono text-slate-400">
                          {u.premium_started_at
                            ? new Date(u.premium_started_at).toLocaleDateString()
                            : '—'}
                        </td>

                        <td className="py-4 px-6 font-mono">
                          <div className="text-white font-bold">
                            {u.premium_expires_at
                              ? new Date(u.premium_expires_at).toLocaleDateString()
                              : 'Never'}
                          </div>
                          <div className="text-[10px] text-[#00FF66] font-bold">
                            {daysLeft} Days Remaining
                          </div>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setExtendModalUser(u);
                                setExtendDays(30);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold text-[11px] cursor-pointer"
                            >
                              + Extend
                            </button>
                            <button
                              onClick={() => handleRevokePremium(u)}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-[11px] cursor-pointer"
                            >
                              Revoke
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: Payment & QR Settings Form */}
      {activeTab === 'settings' && (
        <form
          onSubmit={handleSaveSettings}
          className="p-6 sm:p-8 rounded-3xl bg-[#0F131C] border border-white/5 space-y-6 max-w-4xl"
        >
          <div className="flex items-center gap-3 pb-4 border-b border-white/5">
            <div className="p-2.5 rounded-xl bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700]">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Manual QR Payment & Plan Settings</h2>
              <p className="text-xs text-slate-400">
                Configure your official UPI ID, custom QR code image, price, and instructions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-slate-300">Plan Display Name</label>
              <input
                type="text"
                required
                value={settingsForm.planName}
                onChange={(e) => setSettingsForm({ ...settingsForm, planName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#FFD700]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-slate-300">Price in ₹ (INR)</label>
              <input
                type="number"
                required
                min={1}
                value={settingsForm.price}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, price: Number(e.target.value) })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#FFD700] font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-slate-300">
                Duration in Days (e.g. 120 for 4 Months)
              </label>
              <input
                type="number"
                required
                min={1}
                value={settingsForm.durationDays}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, durationDays: Number(e.target.value) })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#FFD700] font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-slate-300">
                Extra Coins Bonus Percentage (% on tasks)
              </label>
              <input
                type="number"
                required
                min={0}
                max={100}
                value={settingsForm.extraCoinsPercentage || 25}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    extraCoinsPercentage: Number(e.target.value),
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#FFD700] font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-slate-300">Receiver Name</label>
              <input
                type="text"
                required
                value={settingsForm.receiverName}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, receiverName: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#FFD700]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-slate-300">Official UPI ID</label>
              <input
                type="text"
                required
                value={settingsForm.upiId}
                onChange={(e) => setSettingsForm({ ...settingsForm, upiId: e.target.value })}
                placeholder="asjadfx@upi"
                className="w-full px-4 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#FFD700] font-mono"
              />
            </div>
          </div>

          {/* QR Code Upload & Preview */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-mono text-slate-300">Official UPI QR Code</label>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 rounded-2xl bg-[#0A0D14] border border-white/5">
              {qrFilePreview ? (
                <div className="relative p-2 bg-white rounded-2xl shadow-lg">
                  <img
                    src={qrFilePreview}
                    alt="Custom QR Code"
                    className="w-36 h-36 object-contain rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setQrFilePreview(null);
                      setSettingsForm({ ...settingsForm, qrCodeUrl: '' });
                    }}
                    title="Remove custom QR"
                    className="absolute -top-2 -right-2 p-1.5 rounded-full bg-rose-500 text-white shadow-md hover:scale-110"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-36 h-36 rounded-2xl bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center text-center p-3 text-slate-400">
                  <QrCode className="w-8 h-8 text-slate-600 mb-1" />
                  <span className="text-[10px]">Using Dynamic QR Generator Fallback</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors w-fit">
                  <Upload className="w-4 h-4 text-[#FFD700]" />
                  <span>Upload QR Code Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQrUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-400">
                  Upload an image of your PhonePe, Google Pay, or Paytm merchant QR. If no custom image
                  is provided, a dynamic UPI QR code is automatically generated.
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-1.5 pt-2">
            <label className="block text-xs font-mono text-slate-300">
              Payment Instructions (Shown to Users)
            </label>
            <textarea
              rows={4}
              value={settingsForm.instructions}
              onChange={(e) =>
                setSettingsForm({ ...settingsForm, instructions: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#FFD700] font-mono leading-relaxed"
            />
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center justify-end">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FFD700] to-amber-500 text-black font-extrabold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingSettings ? 'Saving...' : 'SAVE SETTINGS'}</span>
            </button>
          </div>
        </form>
      )}

      {/* MODAL 1: Screenshot Full View */}
      <AnimatePresence>
        {viewScreenshotUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            onClick={() => setViewScreenshotUrl(null)}
          >
            <div className="relative max-w-2xl max-h-[90vh] p-2 bg-[#0F131C] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <button
                onClick={() => setViewScreenshotUrl(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/70 text-white hover:scale-110 z-10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={viewScreenshotUrl}
                alt="Payment Receipt Full"
                className="max-h-[85vh] w-auto object-contain rounded-2xl"
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Approve Confirmation Modal */}
      <AnimatePresence>
        {approveModalReq && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            onClick={(e) => {
              if (e.target === e.currentTarget) setApproveModalReq(null);
            }}
          >
            <div className="relative max-w-md w-full rounded-3xl bg-[#0F131C] border border-emerald-500/40 p-6 space-y-5 shadow-2xl text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Approve Premium Payment</h3>
                  <p className="text-slate-400">Activate VIP subscription for user</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0A0D14] border border-white/5 space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">User:</span>
                  <span className="text-white font-bold">@{approveModalReq.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="text-slate-300">{approveModalReq.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount Paid:</span>
                  <span className="text-[#FFD700] font-bold">₹{approveModalReq.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">UTR / Ref ID:</span>
                  <span className="text-[#00FF66] font-bold">{approveModalReq.transaction_id}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-slate-300">
                  Subscription Duration (Days)
                </label>
                <input
                  type="number"
                  min={1}
                  value={approveDurationDays}
                  onChange={(e) => setApproveDurationDays(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-xl bg-[#0A0D14] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setApproveModalReq(null)}
                  className="px-4 py-2 rounded-xl bg-[#0A0D14] text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApprove}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#00FF66] to-emerald-400 text-black font-extrabold cursor-pointer shadow-lg"
                >
                  Confirm & Activate VIP
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Reject Modal with Reason */}
      <AnimatePresence>
        {rejectModalReq && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            onClick={(e) => {
              if (e.target === e.currentTarget) setRejectModalReq(null);
            }}
          >
            <div className="relative max-w-md w-full rounded-3xl bg-[#0F131C] border border-rose-500/40 p-6 space-y-5 shadow-2xl text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Reject Payment Request</h3>
                  <p className="text-slate-400">Specify why the payment was not verified</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-slate-300">
                  Rejection Reason <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Payment not received in bank account / Invalid UTR..."
                  className="w-full px-4 py-2 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalReq(null)}
                  className="px-4 py-2 rounded-xl bg-[#0A0D14] text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  className="px-5 py-2 rounded-xl bg-rose-500 text-white font-extrabold cursor-pointer hover:bg-rose-600"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: Manual Grant Modal */}
      <AnimatePresence>
        {isManualGrantOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsManualGrantOpen(false);
            }}
          >
            <form
              onSubmit={handleManualGrant}
              className="relative max-w-md w-full rounded-3xl bg-[#0F131C] border border-[#FFD700]/40 p-6 space-y-5 shadow-2xl text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#FFD700]/20 text-[#FFD700]">
                  <Crown className="w-6 h-6 fill-[#FFD700]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Manual VIP Grant</h3>
                  <p className="text-slate-400">Grant Premium access directly to any user</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-slate-300">Select User</label>
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#FFD700]"
                >
                  <option value="">-- Choose User --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      @{u.username} ({u.fullName}) - {u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-slate-300">Duration in Days</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={manualDurationDays}
                  onChange={(e) => setManualDurationDays(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#FFD700] font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManualGrantOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#0A0D14] text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FFD700] to-amber-500 text-black font-extrabold cursor-pointer"
                >
                  Grant Premium
                </button>
              </div>
            </form>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 5: Extend Days Modal */}
      <AnimatePresence>
        {extendModalUser && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            onClick={(e) => {
              if (e.target === e.currentTarget) setExtendModalUser(null);
            }}
          >
            <div className="relative max-w-md w-full rounded-3xl bg-[#0F131C] border border-[#FFD700]/40 p-6 space-y-5 shadow-2xl text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#FFD700]/20 text-[#FFD700]">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Extend Subscription</h3>
                  <p className="text-slate-400">Add more days to @{extendModalUser.username}'s VIP</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-slate-300">Days to Add</label>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 60, 120].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setExtendDays(d)}
                      className={`py-2 rounded-xl border text-xs font-bold font-mono transition-all ${
                        extendDays === d
                          ? 'bg-[#FFD700]/20 border-[#FFD700] text-[#FFD700]'
                          : 'bg-[#0A0D14] border-white/10 text-slate-300'
                      }`}
                    >
                      +{d} Days
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={1}
                  value={extendDays}
                  onChange={(e) => setExtendDays(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-xl bg-[#0A0D14] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-[#FFD700] mt-2"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setExtendModalUser(null)}
                  className="px-4 py-2 rounded-xl bg-[#0A0D14] text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmExtend}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FFD700] to-amber-500 text-black font-extrabold cursor-pointer"
                >
                  Confirm Extension
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
