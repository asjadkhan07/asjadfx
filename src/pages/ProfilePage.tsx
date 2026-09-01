import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { changeUserPassword, deleteUserAccount, getUserSubmissions, getUserRank } from '../services/storage';
import {
  User,
  Shield,
  Coins,
  Instagram,
  Mail,
  Calendar,
  Lock,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Edit3,
  Trophy,
  Clock,
  CheckCheck,
  X,
  Camera,
  Crown,
  Zap,
  ArrowRight,
} from 'lucide-react';

const AVATAR_OPTIONS = [
  '🦅', '🦁', '🐺', '⚡', '👑', '🚀', '💎', '🔥', '🎯', '🛡️'
];

export const ProfilePage: React.FC = () => {
  const { user, logout, refreshUser, updateProfile, navigateTo } = useAuth();

  // Edit Profile State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Delete account modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Notifications
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Submissions and rank stats
  const [approvedTasksCount, setApprovedTasksCount] = useState(0);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [rankInfo, setRankInfo] = useState<{ rank: number | null; totalRanked: number }>({
    rank: null,
    totalRanked: 0,
  });

  useEffect(() => {
    if (user?.id) {
      const subs = getUserSubmissions(user.id);
      setApprovedTasksCount(subs.filter(s => s.status === 'approved').length);
      setPendingTasksCount(subs.filter(s => s.status === 'pending').length);
      setRankInfo(getUserRank(user.id));
      setEditFullName(user.fullName || '');
      setEditInstagram(user.instagramUsername || '');
      setEditAvatar(user.avatarUrl || '');
    }
  }, [user]);

  if (!user) return null;

  const handleOpenEditModal = () => {
    setEditFullName(user.fullName);
    setEditInstagram(user.instagramUsername || '');
    setEditAvatar(user.avatarUrl || '');
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    const res = updateProfile({
      fullName: editFullName,
      instagramUsername: editInstagram,
      avatarUrl: editAvatar,
    });
    setIsUpdatingProfile(false);

    if (res.success) {
      setIsEditModalOpen(false);
      refreshUser();
      setNotice({ type: 'success', message: 'Profile updated successfully!' });
      setTimeout(() => setNotice(null), 3500);
    } else {
      setNotice({ type: 'error', message: res.error || 'Failed to update profile.' });
      setTimeout(() => setNotice(null), 4000);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setNotice({ type: 'error', message: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setNotice({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }

    setIsChangingPass(true);
    const res = await changeUserPassword(user.id, currentPassword, newPassword);
    setIsChangingPass(false);

    if (res.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setNotice({ type: 'success', message: 'Password updated successfully!' });
      setTimeout(() => setNotice(null), 3500);
    } else {
      setNotice({ type: 'error', message: res.error || 'Password update failed.' });
      setTimeout(() => setNotice(null), 4000);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmationText !== 'DELETE') {
      setNotice({ type: 'error', message: 'Please type DELETE in capital letters to confirm.' });
      return;
    }

    setIsDeleting(true);
    const res = await deleteUserAccount(user.id, deletePassword, user);
    setIsDeleting(false);

    if (res.success) {
      logout('/login');
    } else {
      setNotice({ type: 'error', message: res.error || 'Failed to delete account.' });
      setTimeout(() => setNotice(null), 4000);
    }
  };

  const warningsCount = user.warnings?.length || 0;

  return (
    <div id="asjadfx-profile-page" className="min-h-[calc(100vh-4rem)] pb-24 pt-6 sm:pt-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2A900]/10 border border-[#F2A900]/20 text-[#F2A900] text-xs font-bold uppercase tracking-wider font-mono mb-2">
              <User className="w-3.5 h-3.5" />
              <span>Account Center</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-['Space_Grotesk'] tracking-tight">
              User Profile & Settings
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Manage your verified credentials, connected Instagram profile, security keys, and preferences.
            </p>
          </div>

          <button
            id="btn-edit-profile-open"
            onClick={handleOpenEditModal}
            className="px-4 py-2.5 rounded-xl bg-[#161B24] hover:bg-[#1C232E] border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer self-start sm:self-center"
          >
            <Edit3 className="w-4 h-4 text-[#F2A900]" />
            <span>EDIT PROFILE</span>
          </button>
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

        {/* User Profile Card */}
        <div className="rounded-3xl bg-[#0F131C] border border-white/5 p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#F2A900] via-amber-400 to-amber-600 text-black font-black text-2xl flex items-center justify-center font-mono shadow-lg relative">
                {user.avatarUrl ? (
                  <span className="text-2xl">{user.avatarUrl}</span>
                ) : (
                  user.fullName.charAt(0).toUpperCase()
                )}
                <button
                  onClick={handleOpenEditModal}
                  title="Change avatar"
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0A0D14] border border-white/20 text-[#F2A900] flex items-center justify-center text-[10px] hover:scale-110 transition-transform cursor-pointer"
                >
                  <Camera className="w-3 h-3" />
                </button>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-white">{user.fullName}</h2>
                  {rankInfo.rank && rankInfo.rank <= 3 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#FFD700]/20 text-[#FFD700] text-[10px] font-bold font-mono">
                      Top #{rankInfo.rank}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-0.5">
                  <span className="text-[#F2A900]">@{user.username}</span>
                  <span>•</span>
                  <span className="capitalize">{user.role} Member</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2.5 rounded-2xl bg-[#0A0D14] border border-white/5 text-right font-mono">
                <div className="text-[10px] text-slate-500 uppercase">Coin Balance</div>
                <div className="text-xl font-black text-[#FFD700]">🪙 {user.coins ?? 0}</div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#0A0D14] border border-white/5 space-y-1">
              <span className="text-slate-500 uppercase font-mono text-[10px]">Email Address</span>
              <div className="font-bold text-white flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#F2A900]" />
                <span className="truncate">{user.email}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0A0D14] border border-white/5 space-y-1">
              <span className="text-slate-500 uppercase font-mono text-[10px]">Connected Instagram</span>
              <div className="font-bold text-purple-300 flex items-center gap-2">
                <Instagram className="w-3.5 h-3.5 text-purple-400" />
                <span>{user.instagramUsername ? `@${user.instagramUsername}` : 'Not connected'}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0A0D14] border border-white/5 space-y-1">
              <span className="text-slate-500 uppercase font-mono text-[10px]">Current Rank</span>
              <div className="font-bold font-mono text-white flex items-center gap-2">
                <Trophy className="w-3.5 h-3.5 text-[#FFD700]" />
                <span>
                  {rankInfo.rank ? `#${rankInfo.rank} of ${rankInfo.totalRanked}` : 'Unranked'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0A0D14] border border-white/5 space-y-1">
              <span className="text-slate-500 uppercase font-mono text-[10px]">Completed Tasks</span>
              <div className="font-bold text-emerald-400 font-mono flex items-center gap-2">
                <CheckCheck className="w-3.5 h-3.5" />
                <span>{approvedTasksCount} Approved</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0A0D14] border border-white/5 space-y-1">
              <span className="text-slate-500 uppercase font-mono text-[10px]">Pending Submissions</span>
              <div className="font-bold text-amber-400 font-mono flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                <span>{pendingTasksCount} Under Review</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0A0D14] border border-white/5 space-y-1">
              <span className="text-slate-500 uppercase font-mono text-[10px]">Join Date</span>
              <div className="font-bold text-slate-300 font-mono flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#F2A900]" />
                <span>{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0A0D14] border border-white/5 space-y-1">
              <span className="text-slate-500 uppercase font-mono text-[10px]">Account Standing</span>
              <div className="font-bold font-mono">
                {user.isBanned || user.status === 'banned' ? (
                  <span className="text-rose-400">Permanently Banned</span>
                ) : user.isRestricted || user.status === 'restricted' ? (
                  <span className="text-orange-400">Restricted ({warningsCount} Warnings)</span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Good Standing ({warningsCount} Strikes)</span>
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0A0D14] border border-white/5 space-y-1">
              <span className="text-slate-500 uppercase font-mono text-[10px]">Last Session</span>
              <div className="font-bold text-slate-300 font-mono">
                {new Date(user.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>

        {/* VIP Membership Status Card */}
        <div className={`rounded-3xl border p-6 sm:p-8 space-y-5 shadow-xl transition-all ${
          user.membership_type === 'premium' && user.premium_status === 'active'
            ? 'bg-gradient-to-b from-[#181C26] to-[#0D1017] border-[#FFD700]/40 shadow-[0_0_30px_rgba(255,215,0,0.15)]'
            : 'bg-[#0F131C] border-white/5'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={`p-3 rounded-2xl ${
                user.membership_type === 'premium' && user.premium_status === 'active'
                  ? 'bg-gradient-to-tr from-[#FFD700] to-amber-500 text-black shadow-[0_0_20px_rgba(255,215,0,0.3)]'
                  : 'bg-white/5 text-slate-400'
              }`}>
                <Crown className="w-6 h-6 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white">Membership Plan</h2>
                  {user.membership_type === 'premium' && user.premium_status === 'active' ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FFD700]/20 border border-[#FFD700]/40 text-[#FFD700] text-xs font-black font-mono flex items-center gap-1">
                      <span>👑</span>
                      <span>ASJADFX VIP ACTIVE</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-400 text-xs font-mono">
                      FREE TIER
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {user.membership_type === 'premium' && user.premium_status === 'active'
                    ? 'Enjoying 25% extra bonus coins on all approved tasks and VIP privileges.'
                    : 'Upgrade to ASJADFX VIP to earn +25% bonus coins on every approved task.'}
                </p>
              </div>
            </div>

            <div>
              {user.membership_type === 'premium' && user.premium_status === 'active' ? (
                <button
                  id="profile-manage-vip-btn"
                  onClick={() => navigateTo('/premium')}
                  className="px-5 py-2.5 rounded-xl bg-[#FFD700]/15 hover:bg-[#FFD700]/25 border border-[#FFD700]/40 text-[#FFD700] font-bold text-xs flex items-center gap-2 cursor-pointer transition-all"
                >
                  <span>VIP Status Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  id="profile-upgrade-vip-btn"
                  onClick={() => navigateTo('/premium')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FFD700] via-amber-400 to-[#F2A900] text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:scale-105 transition-all cursor-pointer"
                >
                  <span>UPGRADE TO VIP 👑</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {user.membership_type === 'premium' && user.premium_status === 'active' && user.premium_expires_at && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <span className="text-[10px] text-slate-500 uppercase">Multiplier</span>
                <div className="text-sm font-black text-[#00FF66] mt-0.5">+25% Coins</div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <span className="text-[10px] text-slate-500 uppercase">Started On</span>
                <div className="text-sm font-bold text-slate-300 mt-0.5">
                  {user.premium_started_at ? new Date(user.premium_started_at).toLocaleDateString() : 'Active'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <span className="text-[10px] text-slate-500 uppercase">Expires On</span>
                <div className="text-sm font-bold text-[#FFD700] mt-0.5">
                  {new Date(user.premium_expires_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Security & Password Change */}
        <div className="rounded-3xl bg-[#0F131C] border border-white/5 p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#F2A900]/10 border border-[#F2A900]/20 text-[#F2A900]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Security & Password Settings</h2>
              <p className="text-xs text-slate-400">Update your account authentication password</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-slate-400">Current Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-4 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-[#F2A900]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-slate-400">New Password (min 8 chars)</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter new strong password"
                className="w-full px-4 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-[#F2A900]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-slate-400">Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-4 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-[#F2A900]"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPassword ? 'Hide' : 'Show'} passwords</span>
              </button>

              <button
                type="submit"
                disabled={isChangingPass}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F2A900] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs cursor-pointer shadow-md disabled:opacity-50"
              >
                {isChangingPass ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Danger Zone: Delete Account */}
        <div className="rounded-3xl bg-[#0F131C] border border-rose-500/20 p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-rose-300">Account Deletion System</h2>
              <p className="text-xs text-slate-400">Permanently delete your ASJADFX account and all coin balances</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Once you delete your account, your profile, pending submissions, leaderboard standing, and accumulated coins (🪙 {user.coins ?? 0}) will be permanently destroyed.
            </p>

            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs cursor-pointer shrink-0 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {isEditModalOpen && (
          <div
            id="modal-edit-profile-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsEditModalOpen(false);
            }}
          >
            <div
              id="modal-edit-profile-frame"
              className="relative max-w-md w-full max-h-[92vh] flex flex-col rounded-3xl bg-[#0F131C] border border-[#F2A900]/30 shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden my-auto"
            >
              <div className="sticky top-0 z-20 bg-[#0F131C] px-5 py-4 border-b border-white/10 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#F2A900]/10 border border-[#F2A900]/20 text-[#F2A900]">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-white">Edit Profile</h3>
                    <p className="text-[11px] text-slate-400">Update your public details</p>
                  </div>
                </div>
                <button
                  id="btn-close-edit-profile"
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-xs"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Close</span>
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1 overscroll-contain">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-slate-400">Choose Avatar Icon</label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {AVATAR_OPTIONS.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setEditAvatar(emoji)}
                          className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center border transition-all cursor-pointer ${
                            editAvatar === emoji
                              ? 'bg-[#F2A900]/20 border-[#F2A900] scale-110'
                              : 'bg-[#0A0D14] border-white/10 hover:border-white/30'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-slate-400">Full Name</label>
                    <input
                      type="text"
                      required
                      value={editFullName}
                      onChange={e => setEditFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-[#F2A900]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-slate-400">Instagram Handle</label>
                    <input
                      type="text"
                      value={editInstagram}
                      onChange={e => setEditInstagram(e.target.value)}
                      placeholder="your_instagram_handle"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-[#F2A900]"
                    />
                  </div>
                </div>

                <div className="sticky bottom-0 z-20 bg-[#0F131C] px-5 py-3.5 border-t border-white/10 flex items-center justify-end gap-3 shadow-md">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-[#0A0D14] border border-white/10 text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#F2A900] to-amber-500 text-black text-xs font-bold cursor-pointer shadow-md disabled:opacity-40"
                  >
                    {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div
            id="modal-delete-profile-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsDeleteModalOpen(false);
                setDeleteConfirmationText('');
                setDeletePassword('');
              }
            }}
          >
            <div
              id="modal-delete-profile-frame"
              className="relative max-w-md w-full max-h-[92vh] flex flex-col rounded-3xl bg-[#0F131C] border border-rose-500/30 shadow-[0_10px_40px_rgba(225,29,72,0.25)] overflow-hidden my-auto"
            >
              <div className="sticky top-0 z-20 bg-[#0F131C] px-5 py-4 border-b border-white/10 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2.5 text-rose-400">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <h3 className="text-base font-extrabold text-white">Permanent Deletion</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeleteConfirmationText('');
                    setDeletePassword('');
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer text-xs flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Close</span>
                </button>
              </div>

              <form onSubmit={handleDeleteAccount} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1 overscroll-contain">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    This action is irreversible. All your coins (🪙 {user.coins ?? 0}) and verified task submissions will be deleted forever.
                  </p>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-slate-400">
                      Type <strong className="text-rose-400">DELETE</strong> to confirm:
                    </label>
                    <input
                      type="text"
                      required
                      value={deleteConfirmationText}
                      onChange={e => setDeleteConfirmationText(e.target.value)}
                      placeholder="DELETE"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-slate-400">Confirm Your Password:</label>
                    <input
                      type="password"
                      required
                      value={deletePassword}
                      onChange={e => setDeletePassword(e.target.value)}
                      placeholder="Enter account password"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="sticky bottom-0 z-20 bg-[#0F131C] px-5 py-3.5 border-t border-white/10 flex items-center justify-end gap-3 shadow-md">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setDeleteConfirmationText('');
                      setDeletePassword('');
                    }}
                    className="px-4 py-2 rounded-xl bg-[#0A0D14] border border-white/10 text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isDeleting || deleteConfirmationText !== 'DELETE'}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer disabled:opacity-40"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete My Account'}
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
