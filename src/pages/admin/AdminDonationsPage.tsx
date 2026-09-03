import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Heart,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Check,
  X,
  Settings,
  AlertCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  QrCode,
  UserCheck,
  UserX,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  getAllDonations,
  getDonationConfig,
  updateDonationConfig,
  approveDonation,
  rejectDonation,
} from '../../services/storage';
import { Donation, DonationConfig } from '../../types';

export const AdminDonationsPage: React.FC = () => {
  const { user } = useAuth();

  const [donations, setDonations] = useState<Donation[]>([]);
  const [config, setConfig] = useState<DonationConfig>(getDonationConfig());

  // Filter & Search
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [configModalOpen, setConfigModalOpen] = useState<boolean>(false);
  const [rejectModalDonation, setRejectModalDonation] = useState<Donation | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // Action status messages
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  // Config Form State
  const [formConfig, setFormConfig] = useState<DonationConfig>(getDonationConfig());

  const reloadData = () => {
    setDonations(getAllDonations());
    setConfig(getDonationConfig());
  };

  useEffect(() => {
    reloadData();
    const handleDataChanged = () => reloadData();
    window.addEventListener('asjadfx_data_changed', handleDataChanged);
    return () => window.removeEventListener('asjadfx_data_changed', handleDataChanged);
  }, []);

  const handleCopyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const handleApprove = (donation: Donation) => {
    if (!user) return;
    if (
      !window.confirm(
        `Approve donation of ₹${donation.amount} from ${
          donation.isAnonymous ? 'Anonymous' : donation.userFullName || donation.username
        }? This will feature them on the official Leaderboard.`
      )
    ) {
      return;
    }

    const res = approveDonation(donation.id, user);
    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Successfully approved donation of ₹${donation.amount}. Donor will receive a verified badge and thank-you celebration.`,
      });
      reloadData();
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to approve donation.' });
    }
  };

  const handleConfirmReject = () => {
    if (!user || !rejectModalDonation) return;
    const cleanReason = rejectionReason.trim();
    if (!cleanReason) {
      alert('Please enter a rejection reason.');
      return;
    }

    const res = rejectDonation(rejectModalDonation.id, user, cleanReason);
    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Donation (Ref: ${rejectModalDonation.referenceId}) was rejected. Reason logged and notified to user.`,
      });
      setRejectModalDonation(null);
      setRejectionReason('');
      reloadData();
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to reject donation.' });
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateDonationConfig(formConfig);
    setConfig(getDonationConfig());
    setConfigModalOpen(false);
    setFeedback({
      type: 'success',
      message: 'Donation cause & UPI receiver settings updated successfully.',
    });
  };

  // Filtered donations
  const filteredDonations = donations.filter((d) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchRef = d.referenceId?.toLowerCase().includes(term);
      const matchName = d.userFullName?.toLowerCase().includes(term);
      const matchUsername = d.username?.toLowerCase().includes(term);
      const matchEmail = d.userEmail?.toLowerCase().includes(term);
      const matchAmount = d.amount?.toString().includes(term);
      return matchRef || matchName || matchUsername || matchEmail || matchAmount;
    }
    return true;
  });

  const pendingCount = donations.filter((d) => d.status === 'pending').length;
  const approvedCount = donations.filter((d) => d.status === 'approved').length;
  const totalApprovedAmount = donations
    .filter((d) => d.status === 'approved')
    .reduce((acc, d) => acc + d.amount, 0);

  return (
    <div className="space-y-6 pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Heart className="w-5 h-5 fill-rose-500" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Donation Requests & Wall Management
            </h1>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                {pendingCount} Pending Review
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Audit voluntary community contributions (₹1+), verify bank UTRs with payment receipts, and manage public Leaderboard honors.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => {
              setFormConfig(getDonationConfig());
              setConfigModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 hover:text-white flex items-center gap-2 transition-all cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-rose-400" />
            <span>Configure Cause & UPI</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0A0D14] border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 font-mono mt-2">{pendingCount}</p>
          <span className="text-[11px] text-slate-500">Requires UTR verification</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0A0D14] border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Approved Donors</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-2">{approvedCount}</p>
          <span className="text-[11px] text-slate-500">Displayed on public Leaderboard</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0A0D14] border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Donated</span>
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
          </div>
          <p className="text-2xl font-black text-[#00FF66] font-mono mt-2">
            ₹{totalApprovedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-500">Community funds verified</span>
        </div>
      </div>

      {/* Feedback Message */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl border flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0A0D14] p-3 rounded-2xl border border-white/10">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {st} {st === 'pending' && pendingCount > 0 ? `(${pendingCount})` : ''}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by UTR, Name, Email, or Amount..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#0F131C] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {/* Donations Table */}
      <div className="rounded-3xl bg-[#0A0D14] border border-white/10 overflow-hidden shadow-2xl">
        {filteredDonations.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Heart className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">No donations found</h3>
            <p className="text-xs text-slate-400">
              No records match your selected filter ({statusFilter}).
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0F131C] text-[11px] uppercase tracking-wider font-extrabold text-slate-400 border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4">Donor / User</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">UTR / Ref ID</th>
                  <th className="py-3.5 px-4">Receipt Proof</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredDonations.map((don) => {
                  const donDate = new Date(don.date);
                  const formattedDate = !isNaN(donDate.getTime())
                    ? donDate.toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : don.date;

                  return (
                    <tr key={don.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Donor */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-slate-300">
                            {don.isAnonymous ? (
                              <UserX className="w-4 h-4 text-rose-400" />
                            ) : (
                              (don.userFullName?.[0] || don.username?.[0] || 'U').toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white">
                                {don.isAnonymous ? 'Anonymous' : don.userFullName || don.username}
                              </span>
                              {don.isAnonymous && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-slate-400">
                                  Anon
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {don.userEmail || `@${don.username}`}
                            </div>
                            {don.message && (
                              <div className="text-[11px] text-rose-300/80 italic mt-0.5 max-w-xs truncate">
                                "{don.message}"
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4">
                        <span className="text-sm font-black text-[#00FF66] font-mono">
                          ₹{don.amount.toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* UTR Ref */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-200 font-semibold">{don.referenceId}</span>
                          <button
                            onClick={() => handleCopyUtr(don.referenceId)}
                            className="p-1 text-slate-400 hover:text-white rounded"
                            title="Copy UTR"
                          >
                            {copiedUtr === don.referenceId ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Receipt */}
                      <td className="py-3.5 px-4">
                        {don.screenshotUrl ? (
                          <button
                            onClick={() => setSelectedProofUrl(don.screenshotUrl!)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View Slip</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">No receipt</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            don.status === 'approved'
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                              : don.status === 'pending'
                              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 animate-pulse'
                              : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                          }`}
                        >
                          {don.status}
                        </span>
                        {don.status === 'rejected' && don.rejectionReason && (
                          <span className="block text-[10px] text-slate-400 mt-1 max-w-[150px] truncate" title={don.rejectionReason}>
                            {don.rejectionReason}
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {formattedDate}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {don.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(don)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => {
                                setRejectModalDonation(don);
                                setRejectionReason('');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">
                            {don.status === 'approved' ? `By ${don.reviewedByAdminName || 'Admin'}` : 'Closed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Proof Modal */}
      <AnimatePresence>
        {selectedProofUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedProofUrl(null)}
          >
            <div
              className="bg-[#0D111A] border border-white/20 rounded-3xl max-w-xl w-full p-5 relative shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Donor Payment Receipt Proof
                </h4>
                <button
                  onClick={() => setSelectedProofUrl(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-[75vh] overflow-auto flex items-center justify-center">
                <img
                  src={selectedProofUrl}
                  alt="Receipt"
                  className="max-w-full rounded-xl object-contain border border-white/10"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rejection Modal */}
      <AnimatePresence>
        {rejectModalDonation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setRejectModalDonation(null)}
          >
            <div
              className="bg-[#0D111A] border border-rose-500/30 rounded-3xl max-w-md w-full p-6 relative shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span>Reject Donation Submission</span>
                </h3>
                <button
                  onClick={() => setRejectModalDonation(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-slate-300">
                    <span className="font-bold">Donor:</span>{' '}
                    {rejectModalDonation.userFullName || rejectModalDonation.username}
                  </p>
                  <p className="text-slate-300">
                    <span className="font-bold">Amount:</span> ₹{rejectModalDonation.amount}
                  </p>
                  <p className="text-slate-300 font-mono">
                    <span className="font-bold font-sans">UTR:</span> {rejectModalDonation.referenceId}
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1.5">
                    Reason for Rejection (Required)
                  </label>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. UTR not reflected in bank account / invalid screenshot"
                    className="w-full p-3 bg-[#0F131C] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 text-xs"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    This reason will be displayed to the user in their donation ledger.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRejectModalDonation(null)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmReject}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Configuration Modal */}
      <AnimatePresence>
        {configModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setConfigModalOpen(false)}
          >
            <div
              className="bg-[#0D111A] border border-white/20 rounded-3xl max-w-xl w-full p-6 relative shadow-2xl my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
                    <span>Configure Beneficiary Cause & UPI Receiver</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Customize the cause title, verified beneficiary name, and official UPI handle.
                  </p>
                </div>
                <button
                  onClick={() => setConfigModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Cause Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formConfig.causeTitle}
                    onChange={(e) => setFormConfig({ ...formConfig, causeTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#0F131C] border border-white/10 rounded-xl text-white focus:outline-none focus:border-rose-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Beneficiary Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formConfig.beneficiaryName}
                    onChange={(e) =>
                      setFormConfig({ ...formConfig, beneficiaryName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#0F131C] border border-white/10 rounded-xl text-white focus:outline-none focus:border-rose-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Cause Description
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formConfig.causeDescription}
                    onChange={(e) =>
                      setFormConfig({ ...formConfig, causeDescription: e.target.value })
                    }
                    className="w-full p-3 bg-[#0F131C] border border-white/10 rounded-xl text-white focus:outline-none focus:border-rose-500 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                      UPI ID
                    </label>
                    <input
                      type="text"
                      required
                      value={formConfig.upiId}
                      onChange={(e) => setFormConfig({ ...formConfig, upiId: e.target.value })}
                      placeholder="e.g. asjadfx@upi"
                      className="w-full px-3.5 py-2.5 bg-[#0F131C] border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:border-rose-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Receiver Display Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formConfig.receiverName}
                      onChange={(e) =>
                        setFormConfig({ ...formConfig, receiverName: e.target.value })
                      }
                      placeholder="e.g. ASJADFX Foundation"
                      className="w-full px-3.5 py-2.5 bg-[#0F131C] border border-white/10 rounded-xl text-white focus:outline-none focus:border-rose-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                    UPI QR Code Image URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={formConfig.qrCodeUrl || ''}
                    onChange={(e) => setFormConfig({ ...formConfig, qrCodeUrl: e.target.value })}
                    placeholder="https://... or data:image/png;base64,..."
                    className="w-full px-3.5 py-2.5 bg-[#0F131C] border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:border-rose-500 text-xs"
                  />
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <input
                    type="checkbox"
                    id="enableDonations"
                    checked={formConfig.enabled}
                    onChange={(e) => setFormConfig({ ...formConfig, enabled: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-500 focus:ring-rose-400"
                  />
                  <label htmlFor="enableDonations" className="text-xs text-slate-300 font-semibold cursor-pointer">
                    Enable voluntary community donations on ASJADFX
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setConfigModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold cursor-pointer shadow-lg"
                  >
                    Save Configuration
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
