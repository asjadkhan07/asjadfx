import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getAllTasks,
  getPlatforms,
  submitTaskProof,
  getUserSubmissions,
} from '../services/storage';
import { Task, PlatformConfig, TaskSubmission, PlatformKey } from '../types';
import {
  Target,
  ExternalLink,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Camera,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  X,
  Send,
  Sparkles,
} from 'lucide-react';

export const TasksPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [platforms, setPlatforms] = useState<PlatformConfig[]>([]);
  const [userSubmissions, setUserSubmissions] = useState<TaskSubmission[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'tasks' | 'history'>('tasks');

  // Submit Modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [commentProof, setCommentProof] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = () => {
    setTasks(getAllTasks());
    setPlatforms(getPlatforms());
    if (user) {
      setUserSubmissions(getUserSubmissions(user.id));
    }
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
  }, [user]);

  // Active platforms only
  const activePlatforms = platforms.filter(p => p.status === 'active');
  const activePlatformKeys = activePlatforms.map(p => p.key);

  // Filter tasks to only active platforms and active tasks
  const visibleTasks = tasks.filter(t => {
    if (t.status !== 'active') return false;
    if (!activePlatformKeys.includes(t.platform)) return false;
    if (selectedPlatform !== 'all' && t.platform !== selectedPlatform) return false;
    return true;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setNotice({ type: 'error', message: 'Please upload a valid image file (PNG, JPG, JPEG).' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setNotice({ type: 'error', message: 'Image size must be under 5MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProofImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleOpenSubmitModal = (task: Task) => {
    if (!user) return;
    if (user.isRestricted || user.isBanned) {
      setNotice({
        type: 'error',
        message: 'Your account is restricted from submitting tasks due to a policy violation.',
      });
      return;
    }
    setSelectedTask(task);
    setProofImage(null);
    setCommentProof('');
  };

  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTask) return;

    if (selectedTask.proofRequired && !proofImage) {
      setNotice({ type: 'error', message: 'Please upload a clear screenshot of your task completion.' });
      return;
    }

    setIsSubmitting(true);
    const res = submitTaskProof(
      user,
      selectedTask,
      proofImage || '',
      commentProof || undefined
    );
    setIsSubmitting(false);

    if (res.success) {
      loadData();
      refreshUser();
      setSelectedTask(null);
      setProofImage(null);
      setCommentProof('');
      setNotice({
        type: 'success',
        message: 'Task proof submitted! Our team will review your proof. Coins are credited upon approval.',
      });
      setTimeout(() => setNotice(null), 4500);
    } else {
      setNotice({ type: 'error', message: res.error || 'Failed to submit proof.' });
      setTimeout(() => setNotice(null), 4000);
    }
  };

  return (
    <div id="asjadfx-tasks-page" className="min-h-[calc(100vh-4rem)] pb-24 pt-6 sm:pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2A900]/10 border border-[#F2A900]/20 text-[#F2A900] text-xs font-bold uppercase tracking-wider mb-2 font-mono">
              <Target className="w-3.5 h-3.5" />
              <span>Verified Earning Tasks</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-['Space_Grotesk'] tracking-tight">
              Complete Tasks. Earn Coins.
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Select platform tasks below, follow required actions, and submit screenshot evidence for admin verification.
            </p>
          </div>

          {/* Toggle Tasks / Submissions History */}
          <div className="flex items-center gap-2 bg-[#0F131C] p-1.5 rounded-2xl border border-white/5">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-wider cursor-pointer transition-all ${
                activeTab === 'tasks'
                  ? 'bg-[#F2A900] text-black font-extrabold shadow-[0_0_15px_rgba(242,169,0,0.2)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Active Tasks ({visibleTasks.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-[#F2A900] text-black font-extrabold shadow-[0_0_15px_rgba(242,169,0,0.2)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>My Submissions</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-[10px]">
                {userSubmissions.length}
              </span>
            </button>
          </div>
        </div>

        {notice && (
          <div
            className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center gap-3 font-semibold ${
              notice.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{notice.message}</span>
          </div>
        )}

        {user?.isRestricted && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <strong className="block font-bold">Account Submission Privileges Restricted:</strong>
              Your account currently has a temporary submission restriction. Please review policy guidelines in the Rules tab.
            </div>
          </div>
        )}

        {activeTab === 'tasks' ? (
          <div className="space-y-6">
            {/* Platform Filter Tabs (Instagram, YouTube, Facebook, Telegram, TikTok, X) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedPlatform('all')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider whitespace-nowrap cursor-pointer transition-all ${
                  selectedPlatform === 'all'
                    ? 'bg-white text-black font-extrabold shadow-lg'
                    : 'bg-[#0F131C] text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                All Platforms
              </button>

              {activePlatforms.map(plt => (
                <button
                  key={plt.key}
                  onClick={() => setSelectedPlatform(plt.key)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider whitespace-nowrap cursor-pointer transition-all flex items-center gap-2 ${
                    selectedPlatform === plt.key
                      ? 'bg-gradient-to-r from-[#F2A900] to-amber-500 text-black font-extrabold shadow-[0_0_15px_rgba(242,169,0,0.25)]'
                      : 'bg-[#0F131C] text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  <span className="text-base">{plt.icon}</span>
                  <span>{plt.name}</span>
                </button>
              ))}
            </div>

            {/* Tasks Cards Grid */}
            {visibleTasks.length === 0 ? (
              <div className="text-center py-20 rounded-3xl bg-[#0F131C] border border-dashed border-white/10 space-y-3">
                <Target className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                <h3 className="text-base font-bold text-white">No active tasks available right now.</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  New verified platform tasks are added daily by our trading desk. Check back shortly!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {visibleTasks.map(task => {
                  const platformConfig = platforms.find(p => p.key === task.platform);
                  const isSubmitted = userSubmissions.some(s => s.taskId === task.id);
                  const submissionStatus = userSubmissions.find(s => s.taskId === task.id)?.status;

                  return (
                    <div
                      key={task.id}
                      className="rounded-3xl bg-[#0F131C] border border-white/5 p-6 flex flex-col justify-between space-y-5 hover:border-[#F2A900]/30 transition-all duration-300 shadow-xl group"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{platformConfig?.icon || '📱'}</span>
                            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase font-mono bg-white/5 text-slate-300 border border-white/5">
                              {platformConfig?.name || task.platform}
                            </span>
                          </div>

                          <div className="px-3 py-1 rounded-full bg-[#F2A900]/10 border border-[#F2A900]/25 text-[#F2A900] font-black text-xs font-mono">
                            🪙 +{task.reward} Coins
                          </div>
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-white group-hover:text-[#F2A900] transition-colors line-clamp-2">
                            {task.title}
                          </h3>
                          <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        </div>

                        {/* Action badges */}
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-bold uppercase font-mono text-slate-500">
                            Required Actions:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {task.requiredActions?.map(act => (
                              <span
                                key={act}
                                className="px-2 py-0.5 rounded-md bg-[#0A0D14] border border-white/5 text-slate-300 text-[10px] font-mono font-semibold"
                              >
                                ✓ {act}
                              </span>
                            ))}
                          </div>
                        </div>

                        {task.commentRequirement && task.requiredActions?.includes('comment') && (
                          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 space-y-1 text-xs">
                            <div className="flex items-center gap-1.5 text-[#F2A900] text-[10px] font-bold uppercase font-mono">
                              <MessageSquare className="w-3 h-3" />
                              <span>Comment Rule</span>
                            </div>
                            <p className="text-slate-400 text-[11px] leading-relaxed">
                              {task.commentRequirement}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                        <a
                          href={task.contentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2 rounded-xl bg-[#161B24] border border-white/10 hover:bg-[#1C232E] text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span>Open Task</span>
                          <ExternalLink className="w-3.5 h-3.5 text-[#F2A900]" />
                        </a>

                        {isSubmitted ? (
                          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span className="capitalize text-slate-300 font-bold">{submissionStatus}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenSubmitModal(task)}
                            disabled={user?.isRestricted || user?.isBanned}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#F2A900] to-amber-500 hover:opacity-90 text-[#05070A] font-extrabold text-xs uppercase tracking-wider font-mono shadow-[0_0_15px_rgba(242,169,0,0.2)] transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>SUBMIT PROOF</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* User Submissions History */
          <div className="space-y-4">
            {userSubmissions.length === 0 ? (
              <div className="text-center py-20 rounded-3xl bg-[#0F131C] border border-dashed border-white/10 space-y-3">
                <Camera className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                <h3 className="text-base font-bold text-white">No submissions recorded yet.</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Complete tasks from the active tasks list and upload screenshot proof to start earning coins.
                </p>
              </div>
            ) : (
              <div className="rounded-3xl bg-[#0F131C] border border-white/5 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/5 bg-[#0A0D14]/60 text-slate-400 uppercase font-mono text-[11px]">
                        <th className="py-3.5 px-4">Task Title</th>
                        <th className="py-3.5 px-4">Platform</th>
                        <th className="py-3.5 px-4">Reward</th>
                        <th className="py-3.5 px-4">Submitted At</th>
                        <th className="py-3.5 px-4">Review Status</th>
                        <th className="py-3.5 px-4">Details / Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {userSubmissions.map(sub => (
                        <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 px-4 font-bold text-white max-w-xs">{sub.taskTitle}</td>

                          <td className="py-4 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-white/5 text-slate-300">
                              {sub.platform}
                            </span>
                          </td>

                          <td className="py-4 px-4 font-black text-[#F2A900] font-mono">
                            🪙 +{sub.rewardCoins}
                          </td>

                          <td className="py-4 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                            {new Date(sub.submittedAt).toLocaleString()}
                          </td>

                          <td className="py-4 px-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase font-mono ${
                                sub.status === 'approved'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : sub.status === 'rejected'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {sub.status}
                            </span>
                          </td>

                          <td className="py-4 px-4 text-xs">
                            {sub.status === 'approved' ? (
                              <span className="text-emerald-400 font-mono flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Coins credited to your balance</span>
                              </span>
                            ) : sub.status === 'rejected' ? (
                              <div className="text-rose-300 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20 max-w-sm">
                                <span className="font-bold block font-mono text-[10px] uppercase">
                                  Rejection Reason:
                                </span>
                                <span>{sub.rejectionReason || 'Proof does not satisfy task guidelines.'}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-mono flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-amber-400" />
                                <span>Awaiting admin verification</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit Proof Modal */}
        {selectedTask && (
          <div
            id="modal-submit-proof-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedTask(null);
            }}
          >
            <div
              id="modal-submit-proof-frame"
              className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl bg-[#0F131C] border border-[#F2A900]/30 shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden my-auto"
            >
              {/* Sticky Header with Close Button */}
              <div className="sticky top-0 z-20 bg-[#0F131C] px-5 py-4 sm:px-6 sm:py-5 border-b border-white/10 flex items-center justify-between shadow-sm">
                <div>
                  <div className="text-[10px] font-mono font-bold uppercase text-[#F2A900] tracking-wider">
                    Submit Completion Evidence
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white mt-0.5 line-clamp-1">
                    {selectedTask.title}
                  </h3>
                </div>
                <button
                  id="btn-close-submit-modal"
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Close</span>
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form onSubmit={handleSubmitProof} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1 overscroll-contain">
                  <div className="p-3.5 rounded-2xl bg-[#0A0D14] border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-slate-400">Reward Upon Verification:</span>
                      <span className="font-extrabold text-[#F2A900] text-sm">🪙 {selectedTask.reward} Coins</span>
                    </div>
                    <div className="text-slate-400 text-[11px] leading-relaxed">
                      {selectedTask.instructions}
                    </div>
                  </div>

                  {/* Screenshot Upload Dropzone */}
                  <div className="space-y-2">
                    <label className="block font-bold text-slate-300 uppercase font-mono">
                      Upload Screenshot Proof (PNG, JPG, JPEG)
                    </label>

                    {proofImage ? (
                      <div className="relative rounded-2xl bg-black border border-white/10 p-2 overflow-hidden group">
                        <img
                          src={proofImage}
                          alt="Proof preview"
                          className="max-h-48 w-full object-contain rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => setProofImage(null)}
                          className="absolute top-4 right-4 p-2 rounded-full bg-black/80 text-rose-400 hover:bg-black cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-white/10 hover:border-[#F2A900]/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-[#0A0D14] transition-colors">
                        <Camera className="w-8 h-8 text-slate-500" />
                        <div className="text-center">
                          <span className="font-bold text-white">Click or drag & drop</span>
                          <p className="text-[11px] text-slate-500 mt-0.5">Maximum file size 5MB</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Comment proof input if task requires comment */}
                  {selectedTask.requiredActions?.includes('comment') && (
                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-300 uppercase font-mono">
                        Your Comment / Question (Must be meaningful):
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={commentProof}
                        onChange={e => setCommentProof(e.target.value)}
                        placeholder="Type the exact question or comment you posted on the content..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900]"
                      />
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-200/90 text-[11px] flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#F2A900] shrink-0 mt-0.5" />
                    <span>
                      Coins are only credited after manual admin review. Make sure your username/account matches the registered ASJADFX profile.
                    </span>
                  </div>
                </div>

                {/* Sticky Footer */}
                <div className="sticky bottom-0 z-20 bg-[#0F131C] px-5 py-4 sm:px-6 sm:py-4 border-t border-white/10 flex items-center justify-end gap-3 shadow-md">
                  <button
                    type="button"
                    onClick={() => setSelectedTask(null)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#F2A900] via-[#FFD700] to-[#F2A900] hover:opacity-90 text-[#05070A] font-extrabold uppercase font-mono tracking-wider text-xs shadow-[0_0_15px_rgba(242,169,0,0.2)] cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Uploading...' : 'Submit For Review'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
