import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getAllSubmissions,
  approveSubmission,
  rejectSubmission,
  flagSubmission,
} from '../../services/storage';
import { TaskSubmission, SubmissionStatus } from '../../types';
import {
  Camera,
  CheckCircle2,
  XCircle,
  Flag,
  ExternalLink,
  Eye,
  X,
  AlertCircle,
  Clock,
  Send,
  MessageSquare,
} from 'lucide-react';

const REJECTION_PRESETS = [
  'Incomplete proof: Liked/Followed state is not visible in the screenshot.',
  'Account mismatch: The profile visible in screenshot does not match your registered Instagram/Username.',
  'Invalid/Spam comment: Generic one-word or emoji comment detected.',
  'Duplicate/Reused screenshot: This image was previously submitted.',
  'Video watch duration requirement was not satisfied.',
];

export const AdminSubmissionsPage: React.FC = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [rejectingSub, setRejectingSub] = useState<TaskSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = () => {
    setSubmissions(getAllSubmissions());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = (submission: TaskSubmission) => {
    if (!user) return;
    const res = approveSubmission(submission.id, user);
    if (res.success) {
      loadData();
      setActionNotice({
        type: 'success',
        message: `Approved submission for ${submission.fullName}. 🪙 ${submission.rewardCoins} coins credited.`,
      });
      setTimeout(() => setActionNotice(null), 3500);
    } else {
      setActionNotice({ type: 'error', message: res.error || 'Approval failed.' });
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const openRejectModal = (submission: TaskSubmission) => {
    setRejectingSub(submission);
    setRejectionReason(REJECTION_PRESETS[0]);
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingSub || !user) return;

    const res = rejectSubmission(rejectingSub.id, rejectionReason, user);
    if (res.success) {
      loadData();
      setRejectingSub(null);
      setRejectionReason('');
      setActionNotice({
        type: 'success',
        message: `Submission for ${rejectingSub.fullName} was rejected with reason sent to user.`,
      });
      setTimeout(() => setActionNotice(null), 3500);
    } else {
      setActionNotice({ type: 'error', message: res.error || 'Rejection failed.' });
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const handleFlag = (submission: TaskSubmission) => {
    if (!user) return;
    const res = flagSubmission(submission.id, user);
    if (res.success) {
      loadData();
      setActionNotice({ type: 'success', message: `Submission for ${submission.fullName} flagged.` });
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  const filtered = submissions.filter(s => {
    if (activeTab === 'all') return true;
    return s.status === activeTab;
  });

  const counts = {
    all: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
    flagged: submissions.filter(s => s.status === 'flagged').length,
  };

  return (
    <div id="admin-submissions-page" className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="border-b border-white/5 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2A900]/10 border border-[#F2A900]/20 text-[#F2A900] text-xs font-bold uppercase tracking-wider mb-2 font-mono">
            <Camera className="w-3.5 h-3.5" />
            <span>Verification Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Proof Submissions Review
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Carefully verify user screenshots, comments, and task criteria before crediting coins. Double approvals are automatically prevented.
          </p>
        </div>
      </div>

      {actionNotice && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2 font-semibold ${
            actionNotice.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {actionNotice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{actionNotice.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: 'pending', label: 'Pending Review', count: counts.pending, color: 'text-amber-400' },
          { key: 'approved', label: 'Approved', count: counts.approved, color: 'text-emerald-400' },
          { key: 'rejected', label: 'Rejected', count: counts.rejected, color: 'text-rose-400' },
          { key: 'flagged', label: 'Flagged', count: counts.flagged, color: 'text-purple-400' },
          { key: 'all', label: 'All Submissions', count: counts.all, color: 'text-slate-300' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-wider whitespace-nowrap cursor-pointer transition-all flex items-center gap-2 ${
              activeTab === tab.key
                ? 'bg-[#F2A900] text-black font-extrabold shadow-[0_0_15px_rgba(242,169,0,0.2)]'
                : 'bg-[#0F131C] text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === tab.key ? 'bg-black/20 text-black' : 'bg-white/5 text-slate-400'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Submissions Table / Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-[#0F131C] border border-dashed border-white/10 space-y-2">
          <Clock className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <h3 className="text-sm font-bold text-slate-300">No submissions found in this category.</h3>
          <p className="text-xs text-slate-500">
            {activeTab === 'pending'
              ? 'All caught up! No pending submissions require attention.'
              : 'Submissions matching this filter will appear here.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#0F131C] border border-white/5 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 bg-[#0A0D14]/60 text-slate-400 uppercase font-mono text-[11px]">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Instagram</th>
                  <th className="py-3.5 px-4">Task & Platform</th>
                  <th className="py-3.5 px-4">Proof Evidence</th>
                  <th className="py-3.5 px-4">Reward</th>
                  <th className="py-3.5 px-4">Submitted</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(sub => (
                  <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* User */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{sub.fullName}</div>
                      <div className="text-[11px] text-[#F2A900] font-mono">@{sub.username}</div>
                    </td>

                    {/* Instagram */}
                    <td className="py-3.5 px-4 font-mono text-purple-300">
                      @{sub.instagramUsername}
                    </td>

                    {/* Task Title & Platform */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-slate-200 line-clamp-1">{sub.taskTitle}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-mono font-bold bg-white/5 text-slate-400">
                          {sub.platform}
                        </span>
                        {sub.taskUrl && (
                          <a
                            href={sub.taskUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#F2A900] hover:underline flex items-center gap-0.5 text-[10px] font-mono"
                          >
                            <span>Link</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Proof Evidence */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {sub.proofImageUrl ? (
                          <button
                            onClick={() => setPreviewImage(sub.proofImageUrl || null)}
                            className="relative group w-12 h-12 rounded-lg bg-black border border-white/10 overflow-hidden shrink-0 cursor-pointer"
                          >
                            <img
                              src={sub.proofImageUrl}
                              alt="Proof screenshot"
                              className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 transition-opacity">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-mono">No Image</span>
                        )}

                        {sub.commentProof && (
                          <div
                            title={sub.commentProof}
                            className="text-[11px] text-slate-300 max-w-[140px] truncate bg-[#0A0D14] p-1.5 rounded-lg border border-white/5"
                          >
                            <span className="text-slate-500 font-mono text-[9px] block">Comment:</span>
                            &quot;{sub.commentProof}&quot;
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Reward */}
                    <td className="py-3.5 px-4 font-bold text-[#F2A900] font-mono whitespace-nowrap">
                      🪙 +{sub.rewardCoins}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(sub.submittedAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase font-mono ${
                          sub.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : sub.status === 'rejected'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : sub.status === 'flagged'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {sub.status}
                      </span>
                      {sub.rejectionReason && (
                        <div className="text-[10px] text-rose-300 mt-1 max-w-[180px] line-clamp-1 font-mono">
                          Reason: {sub.rejectionReason}
                        </div>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {sub.status === 'pending' || sub.status === 'flagged' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleApprove(sub)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.2)] transition-all flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>APPROVE</span>
                          </button>
                          <button
                            onClick={() => openRejectModal(sub)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 font-bold text-xs uppercase cursor-pointer transition-all flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>REJECT</span>
                          </button>
                          <button
                            onClick={() => handleFlag(sub)}
                            title="Flag for audit"
                            className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 cursor-pointer"
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : sub.status === 'approved' ? (
                        <span className="text-[11px] text-emerald-400 font-mono">Approved by Admin</span>
                      ) : (
                        <span className="text-[11px] text-rose-400 font-mono">Rejected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Proof Screenshot Zoom Modal */}
      {previewImage && (
        <div
          id="modal-proof-zoom-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewImage(null);
          }}
        >
          <div
            id="modal-proof-zoom-frame"
            className="relative max-w-4xl w-full max-h-[92vh] flex flex-col bg-[#0F131C] border border-white/15 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="sticky top-0 z-10 bg-[#0F131C] px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase">Screenshot Evidence</span>
              <button
                id="btn-close-proof-zoom"
                onClick={() => setPreviewImage(null)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-black/40">
              <img
                src={previewImage}
                alt="Full size proof"
                className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal with Reason Selection */}
      {rejectingSub && (
        <div
          id="modal-reject-submission-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setRejectingSub(null);
          }}
        >
          <div
            id="modal-reject-submission-frame"
            className="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl bg-[#0F131C] border border-rose-500/30 shadow-[0_10px_40px_rgba(225,29,72,0.25)] overflow-hidden my-auto"
          >
            {/* Sticky Header with Close Button */}
            <div className="sticky top-0 z-20 bg-[#0F131C] px-5 py-4 sm:px-6 sm:py-5 border-b border-white/10 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white">Reject Submission</h3>
                  <p className="text-[11px] text-slate-400">Provide feedback to user</p>
                </div>
              </div>
              <button
                id="btn-close-reject-modal"
                type="button"
                onClick={() => setRejectingSub(null)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleRejectSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1 overscroll-contain">
                <div className="p-3.5 rounded-2xl bg-[#0A0D14] border border-white/5 space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-400">User: </span>
                    <span className="text-white font-bold">{rejectingSub.fullName}</span>{' '}
                    <span className="text-[#F2A900] font-mono">(@{rejectingSub.username})</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Task: </span>
                    <span className="text-slate-200 font-semibold">{rejectingSub.taskTitle}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block font-bold text-slate-300 uppercase font-mono">
                    Select Quick Preset Reason:
                  </label>
                  <div className="space-y-1.5">
                    {REJECTION_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setRejectionReason(preset)}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                          rejectionReason === preset
                            ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                            : 'bg-[#0A0D14] border-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-300 uppercase font-mono">
                    Custom Rejection Explanation (Visible to user):
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="Explain why this proof does not meet the guidelines..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="sticky bottom-0 z-20 bg-[#0F131C] px-5 py-4 sm:px-6 sm:py-4 border-t border-white/10 flex items-center justify-end gap-3 shadow-md">
                <button
                  type="button"
                  onClick={() => setRejectingSub(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold uppercase tracking-wider cursor-pointer shadow-[0_0_15px_rgba(225,29,72,0.3)] flex items-center gap-1.5 text-xs"
                >
                  <Send className="w-4 h-4" />
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
