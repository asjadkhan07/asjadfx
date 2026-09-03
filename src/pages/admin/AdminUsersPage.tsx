import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getAllUsers,
  getUserTransactions,
  getUserSubmissions,
  getUserWarnings,
  updateUserProfileByAdmin,
  adjustUserCoins,
  issueWarningToUser,
  banUserByAdmin,
  unbanUserByAdmin,
  deleteUserByAdmin,
  resetAllUserCoins,
  syncFromSupabase,
} from '../../services/storage';
import { fetchSupabaseUsers } from '../../services/supabase';
import { User, CoinTransaction, TaskSubmission, UserWarning } from '../../types';
import {
  Users,
  Search,
  Eye,
  Edit3,
  Coins,
  AlertTriangle,
  Ban,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  Save,
  ShieldCheck,
  History,
  Camera,
  RotateCcw,
  RefreshCw,
  Sparkles,
  Copy,
  Check,
  Crown,
  Fingerprint,
} from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [viewModalData, setViewModalData] = useState<{
    user: User;
    submissions: TaskSubmission[];
    transactions: CoinTransaction[];
    warnings: UserWarning[];
  } | null>(null);

  const [editModalUser, setEditModalUser] = useState<User | null>(null);
  const [coinModalUser, setCoinModalUser] = useState<User | null>(null);
  const [coinAmount, setCoinAmount] = useState<number>(100);
  const [coinReason, setCoinReason] = useState<string>('Administrative manual credit');
  const [coinAdjustmentType, setCoinAdjustmentType] = useState<'credit' | 'debit'>('credit');

  const [warningModalUser, setWarningModalUser] = useState<User | null>(null);
  const [warningReason, setWarningReason] = useState<string>('');
  const [warningLevel, setWarningLevel] = useState<1 | 2 | 3>(1);

  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const reloadUsers = async (syncWithRemote = false) => {
    if (syncWithRemote) {
      setIsSyncing(true);
      try {
        await syncFromSupabase();
        const directUsers = await fetchSupabaseUsers();
        const loaded = directUsers && directUsers.length > 0 ? directUsers : getAllUsers();
        setUsers(loaded);
        setNotice({
          type: 'success',
          message: `Synchronized ${loaded.length} registered ${loaded.length === 1 ? 'user' : 'users'} directly from Supabase Authentication & Database.`,
        });
        setTimeout(() => setNotice(null), 4500);
      } catch (err) {
        console.warn('Sync error:', err);
        setUsers(getAllUsers());
      } finally {
        setIsSyncing(false);
      }
    } else {
      setUsers(getAllUsers());
    }
  };

  const handleCopyUUID = (id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId(prev => (prev === id ? null : prev));
      }, 2000);
    }
  };

  useEffect(() => {
    reloadUsers(true);
  }, []);

  const handleFreshStartReset = async () => {
    if (!currentAdmin) return;
    setIsResetting(true);
    try {
      const res = await resetAllUserCoins(currentAdmin);
      if (res.success) {
        reloadUsers();
        setResetModalOpen(false);
        setNotice({
          type: 'success',
          message: `Monday Fresh Start applied: ${res.count} users' coin balances reset to 0.`,
        });
        setTimeout(() => setNotice(null), 4000);
      } else {
        setNotice({ type: 'error', message: res.error || 'Fresh start reset failed.' });
      }
    } catch (err) {
      setNotice({ type: 'error', message: 'Failed to complete reset.' });
    } finally {
      setIsResetting(false);
    }
  };

  const handleOpenViewModal = (targetUser: User) => {
    const submissions = getUserSubmissions(targetUser.id);
    const transactions = getUserTransactions(targetUser.id);
    const warnings = getUserWarnings(targetUser.id);
    setViewModalData({ user: targetUser, submissions, transactions, warnings });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalUser) return;

    const res = updateUserProfileByAdmin(editModalUser.id, {
      fullName: editModalUser.fullName,
      username: editModalUser.username,
      email: editModalUser.email,
      instagramUsername: editModalUser.instagramUsername,
    });

    if (res.success) {
      reloadUsers();
      setEditModalUser(null);
      setNotice({ type: 'success', message: 'User profile updated successfully.' });
      setTimeout(() => setNotice(null), 3000);
    } else {
      setNotice({ type: 'error', message: res.error || 'Update failed.' });
      setTimeout(() => setNotice(null), 4000);
    }
  };

  const handleCoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coinModalUser || !currentAdmin) return;

    if (!coinAmount || coinAmount <= 0) {
      setNotice({ type: 'error', message: 'Please enter a valid positive coin amount.' });
      setTimeout(() => setNotice(null), 3000);
      return;
    }

    const delta = coinAdjustmentType === 'credit' ? Math.abs(coinAmount) : -Math.abs(coinAmount);
    const res = adjustUserCoins(coinModalUser.id, delta, coinReason, currentAdmin);

    if (res.success) {
      reloadUsers();
      setCoinModalUser(null);
      setNotice({
        type: 'success',
        message: `Successfully ${coinAdjustmentType === 'credit' ? 'credited' : 'deducted'} ${Math.abs(
          coinAmount
        )} coins for ${coinModalUser.fullName}.`,
      });
      setTimeout(() => setNotice(null), 3000);
    } else {
      setNotice({ type: 'error', message: res.error || 'Coin adjustment failed.' });
      setTimeout(() => setNotice(null), 4000);
    }
  };

  const handleWarningSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warningModalUser || !currentAdmin || !warningReason) return;

    const res = issueWarningToUser(warningModalUser.id, warningReason, warningLevel, currentAdmin);
    if (res.success) {
      reloadUsers();
      setWarningModalUser(null);
      setWarningReason('');
      setNotice({
        type: 'success',
        message: `Disciplinary sanction (Level ${warningLevel}) applied to ${warningModalUser.fullName}.`,
      });
      setTimeout(() => setNotice(null), 3000);
    } else {
      setNotice({ type: 'error', message: res.error || 'Warning issuance failed.' });
      setTimeout(() => setNotice(null), 4000);
    }
  };

  const handleToggleBan = (targetUser: User) => {
    if (!currentAdmin) return;
    if (targetUser.isBanned || targetUser.status === 'banned') {
      const res = unbanUserByAdmin(targetUser.id);
      if (res.success) {
        reloadUsers();
        setNotice({ type: 'success', message: `User ${targetUser.fullName} unbanned.` });
        setTimeout(() => setNotice(null), 3000);
      }
    } else {
      const res = banUserByAdmin(targetUser.id, 'Administrative account suspension.', currentAdmin);
      if (res.success) {
        reloadUsers();
        setNotice({ type: 'success', message: `User ${targetUser.fullName} suspended/banned.` });
        setTimeout(() => setNotice(null), 3000);
      }
    }
  };

  const handleDeleteUser = async (targetUser: User) => {
    if (!currentAdmin) return;
    const res = await deleteUserByAdmin(targetUser.id, currentAdmin);
    if (res.success) {
      reloadUsers();
      setDeleteConfirmUser(null);
      setNotice({ type: 'success', message: `User ${targetUser.fullName} permanently deleted.` });
      setTimeout(() => setNotice(null), 3000);
    } else {
      setNotice({ type: 'error', message: res.error || 'Deletion failed.' });
      setTimeout(() => setNotice(null), 4000);
    }
  };

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.instagramUsername && u.instagramUsername.toLowerCase().includes(q))
    );
  });

  return (
    <div id="admin-users-page" className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="border-b border-white/5 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2A900]/10 border border-[#F2A900]/20 text-[#F2A900] text-xs font-bold uppercase tracking-wider mb-2 font-mono">
            <Users className="w-3.5 h-3.5" />
            <span>User Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            User Accounts & Permissions
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Search, inspect, credit coins, issue disciplinary warnings, and manage access for all registered members.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => reloadUsers(true)}
            disabled={isSyncing}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold flex items-center gap-2 border border-white/10 transition-all font-mono"
            title="Fetch real users directly from Supabase Authentication & Database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#F2A900] ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Supabase'}</span>
          </button>

          <button
            onClick={() => setResetModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-[#F2A900] text-xs font-bold flex items-center gap-2 border border-[#F2A900]/30 transition-all font-mono shadow-md"
            title="Reset all community user coin balances to 0 for Monday Fresh Start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Monday Fresh Start (0 Coins)</span>
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2 font-semibold ${
            notice.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#0F131C] border border-white/5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, @username, email, or @instagram handle..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0A0D14] border border-white/10 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-[#F2A900]"
          />
        </div>
        <div className="text-xs font-mono text-slate-400 px-2 shrink-0">
          {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-[#0F131C] border border-white/5 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-[#0A0D14]/60 text-slate-400 uppercase font-mono text-[11px]">
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Auth UUID</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Instagram</th>
                <th className="py-3.5 px-4">Coins / Wallet</th>
                <th className="py-3.5 px-4">Membership</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Joined</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-mono text-xs">
                    {searchQuery ? 'No registered users match your search query.' : 'No registered users found in Supabase Auth & Database.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt={u.fullName}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-full object-cover border border-[#F2A900]/30 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#F2A900] to-amber-600 text-black font-extrabold flex items-center justify-center text-xs shrink-0">
                            {u.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{u.fullName}</span>
                            {u.role === 'admin' && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#F2A900]/20 text-[#F2A900] border border-[#F2A900]/30">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#F2A900] font-mono">@{u.username}</div>
                        </div>
                      </div>
                    </td>

                    {/* Auth UUID with 1-click copy */}
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5 group">
                        <span className="text-slate-400 font-mono" title={u.id}>
                          {u.id.length > 13 ? `${u.id.substring(0, 8)}...${u.id.substring(u.id.length - 4)}` : u.id}
                        </span>
                        <button
                          onClick={() => handleCopyUUID(u.id)}
                          className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-[#F2A900] transition-colors cursor-pointer"
                          title="Copy Full Supabase Auth User UUID"
                        >
                          {copiedId === u.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-300">{u.email}</td>

                    <td className="py-3.5 px-4 font-mono text-purple-300">
                      {u.instagramUsername ? `@${u.instagramUsername}` : '—'}
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-[#F2A900] text-xs">🪙 {u.coins ?? u.coinBalance ?? 0}</div>
                      <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                        ₹{Number(u.walletBalance ?? u.wallet_balance ?? 0).toLocaleString('en-IN')}
                      </div>
                    </td>

                    {/* Membership Status */}
                    <td className="py-3.5 px-4">
                      {u.membership_type === 'premium' || u.premium_status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-[#F2A900] border border-[#F2A900]/30">
                          <Crown className="w-3 h-3" />
                          <span>VIP</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase font-mono bg-slate-800 text-slate-400 border border-white/5">
                          Free
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                            u.isBanned
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : u.isRestricted
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {u.isBanned ? 'Banned' : u.isRestricted ? 'Restricted' : 'Active'}
                        </span>

                        {u.warningCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300">
                            ⚠️ {u.warningCount} {u.warningCount === 1 ? 'warn' : 'warns'}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* View details */}
                        <button
                          onClick={() => handleOpenViewModal(u)}
                          title="View Full Profile & History"
                          className="p-1.5 rounded-lg bg-white/5 text-slate-300 hover:text-white cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit user */}
                        <button
                          onClick={() => setEditModalUser(u)}
                          title="Edit User Profile"
                          className="p-1.5 rounded-lg bg-white/5 text-slate-300 hover:text-white cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Add/Remove Coins */}
                        <button
                          onClick={() => {
                            setCoinModalUser(u);
                            setCoinAmount(100);
                            setCoinAdjustmentType('credit');
                          }}
                          title="Adjust Coins"
                          className="p-1.5 rounded-lg bg-[#F2A900]/15 text-[#F2A900] hover:bg-[#F2A900]/25 cursor-pointer"
                        >
                          <Coins className="w-3.5 h-3.5" />
                        </button>

                        {/* Warning */}
                        <button
                          onClick={() => {
                            setWarningModalUser(u);
                            setWarningLevel(1);
                            setWarningReason('');
                          }}
                          title="Issue Disciplinary Warning"
                          className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 cursor-pointer"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </button>

                        {/* Ban / Unban */}
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleToggleBan(u)}
                            title={u.isBanned ? 'Unban User' : 'Ban User'}
                            className={`p-1.5 rounded-lg cursor-pointer ${
                              u.isBanned
                                ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                                : 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25'
                            }`}
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete */}
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => setDeleteConfirmUser(u)}
                            title="Delete User Permanently"
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View User Full History Modal */}
      {viewModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl bg-[#0F131C] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-3.5">
                {viewModalData.user.avatarUrl ? (
                  <img
                    src={viewModalData.user.avatarUrl}
                    alt={viewModalData.user.fullName}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#F2A900]/40 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#F2A900] to-amber-600 text-black font-black flex items-center justify-center text-base shrink-0">
                    {viewModalData.user.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <span>{viewModalData.user.fullName}</span>
                    <span className="text-xs font-mono text-[#F2A900]">@{viewModalData.user.username}</span>
                    {viewModalData.user.role === 'admin' && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#F2A900]/20 text-[#F2A900] border border-[#F2A900]/30">
                        ADMIN
                      </span>
                    )}
                    {viewModalData.user.membership_type === 'premium' || viewModalData.user.premium_status === 'active' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-[#F2A900] border border-[#F2A900]/30">
                        <Crown className="w-3 h-3" />
                        <span>VIP</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase font-mono bg-slate-800 text-slate-400 border border-white/5">
                        Free
                      </span>
                    )}
                  </h3>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    {viewModalData.user.email} {viewModalData.user.instagramUsername ? `• @${viewModalData.user.instagramUsername}` : ''} • Coins: 🪙 {viewModalData.user.coins ?? viewModalData.user.coinBalance ?? 0} • Wallet: ₹{Number(viewModalData.user.walletBalance ?? viewModalData.user.wallet_balance ?? 0).toLocaleString('en-IN')}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono text-slate-500">
                    <span>UUID:</span>
                    <span className="text-slate-400 select-all">{viewModalData.user.id}</span>
                    <button
                      onClick={() => handleCopyUUID(viewModalData.user.id)}
                      className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-[#F2A900] cursor-pointer"
                      title="Copy Auth UUID"
                    >
                      {copiedId === viewModalData.user.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewModalData(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-[#0A0D14] border border-white/5 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Submissions</div>
                <div className="text-lg font-black text-white">{viewModalData.submissions.length}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#0A0D14] border border-white/5 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Approved</div>
                <div className="text-lg font-black text-emerald-400">
                  {viewModalData.submissions.filter(s => s.status === 'approved').length}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#0A0D14] border border-white/5 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Warnings</div>
                <div className="text-lg font-black text-amber-400">{viewModalData.warnings.length}</div>
              </div>
            </div>

            {/* Submissions Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase font-mono">
                <Camera className="w-3.5 h-3.5 text-[#F2A900]" />
                <span>Task Submissions ({viewModalData.submissions.length})</span>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-[#0A0D14] border border-white/5 text-xs">
                {viewModalData.submissions.length === 0 ? (
                  <div className="text-slate-500 py-3 text-center">No task submissions recorded.</div>
                ) : (
                  viewModalData.submissions.map(sub => (
                    <div
                      key={sub.id}
                      className="p-2 rounded-lg bg-[#0F131C] border border-white/5 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-white">{sub.taskTitle}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {sub.platform} • {new Date(sub.submittedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                          sub.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : sub.status === 'rejected'
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Transactions Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase font-mono">
                <History className="w-3.5 h-3.5 text-[#F2A900]" />
                <span>Coin Ledger History ({viewModalData.transactions.length})</span>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-[#0A0D14] border border-white/5 text-xs">
                {viewModalData.transactions.length === 0 ? (
                  <div className="text-slate-500 py-3 text-center">No coin ledger entries.</div>
                ) : (
                  viewModalData.transactions.map(tx => (
                    <div
                      key={tx.id}
                      className="p-2 rounded-lg bg-[#0F131C] border border-white/5 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-slate-300">{tx.description}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {new Date(tx.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <span
                        className={`font-mono font-bold ${
                          tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {tx.amount >= 0 ? `+${tx.amount}` : tx.amount}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Warnings Section */}
            {viewModalData.warnings.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase font-mono">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Disciplinary Warnings ({viewModalData.warnings.length})</span>
                </div>
                <div className="space-y-1.5 p-2 rounded-xl bg-rose-500/5 border border-rose-500/20 text-xs">
                  {viewModalData.warnings.map(w => (
                    <div key={w.id} className="p-2 rounded-lg bg-[#0A0D14] border border-white/5">
                      <div className="flex items-center justify-between text-rose-300 font-bold">
                        <span>Level {w.level} Warning</span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(w.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs mt-1">{w.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-[#0F131C] border border-white/10 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="text-base font-bold text-white">Edit User Profile</h3>
              <button
                onClick={() => setEditModalUser(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-300 uppercase font-mono">Full Name</label>
                <input
                  type="text"
                  required
                  value={editModalUser.fullName}
                  onChange={e => setEditModalUser({ ...editModalUser, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900]"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-300 uppercase font-mono">Username</label>
                <input
                  type="text"
                  required
                  value={editModalUser.username}
                  onChange={e => setEditModalUser({ ...editModalUser, username: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900]"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-300 uppercase font-mono">Email Address</label>
                <input
                  type="email"
                  required
                  value={editModalUser.email}
                  onChange={e => setEditModalUser({ ...editModalUser, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900]"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-300 uppercase font-mono">
                  Instagram Username (without @)
                </label>
                <input
                  type="text"
                  value={editModalUser.instagramUsername || ''}
                  onChange={e => setEditModalUser({ ...editModalUser, instagramUsername: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900]"
                />
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalUser(null)}
                  className="px-3.5 py-2 rounded-xl bg-white/5 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#F2A900] text-black font-extrabold uppercase font-mono flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Deduct Coins Modal */}
      {coinModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-[#0F131C] border border-[#F2A900]/30 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-[#F2A900]" />
                <h3 className="text-base font-bold text-white">Adjust User Coins</h3>
              </div>
              <button
                onClick={() => setCoinModalUser(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#0A0D14] border border-white/5 text-xs">
              <span className="text-slate-400">Target User: </span>
              <span className="font-bold text-white">{coinModalUser.fullName}</span>{' '}
              <span className="text-[#F2A900] font-mono">(@{coinModalUser.username})</span>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                Current Balance: 🪙 {coinModalUser.coins ?? coinModalUser.coinBalance ?? 0}
              </div>
            </div>

            <form onSubmit={handleCoinSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCoinAdjustmentType('credit')}
                  className={`py-2 rounded-xl font-bold font-mono uppercase text-xs border ${
                    coinAdjustmentType === 'credit'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-[#0A0D14] border-white/5 text-slate-400'
                  }`}
                >
                  + Add Coins
                </button>
                <button
                  type="button"
                  onClick={() => setCoinAdjustmentType('debit')}
                  className={`py-2 rounded-xl font-bold font-mono uppercase text-xs border ${
                    coinAdjustmentType === 'debit'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : 'bg-[#0A0D14] border-white/5 text-slate-400'
                  }`}
                >
                  - Deduct Coins
                </button>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-300 uppercase font-mono">Coin Amount</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={coinAmount === 0 ? '' : coinAmount}
                  onFocus={e => e.target.select()}
                  onClick={e => (e.target as HTMLInputElement).select()}
                  onKeyDown={e => {
                    if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '') {
                      setCoinAmount(0);
                    } else {
                      const num = parseInt(val, 10);
                      if (!isNaN(num) && num >= 0) {
                        setCoinAmount(num);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-[#0A0D14] border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-[#F2A900]"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-300 uppercase font-mono">Reason for Ledger</label>
                <input
                  type="text"
                  required
                  value={coinReason}
                  onChange={e => setCoinReason(e.target.value)}
                  placeholder="e.g. Special trading competition bonus"
                  className="w-full px-3 py-2 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900]"
                />
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCoinModalUser(null)}
                  className="px-3.5 py-2 rounded-xl bg-white/5 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#F2A900] text-black font-extrabold uppercase font-mono flex items-center gap-1.5"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Execute Adjustment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disciplinary Warning Modal */}
      {warningModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-[#0F131C] border border-amber-500/30 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Issue Sanction / Warning</h3>
              </div>
              <button
                onClick={() => setWarningModalUser(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#0A0D14] border border-white/5 text-xs">
              <span className="text-slate-400">Target User: </span>
              <span className="font-bold text-white">{warningModalUser.fullName}</span>{' '}
              <span className="text-amber-400 font-mono">(@{warningModalUser.username})</span>
            </div>

            <form onSubmit={handleWarningSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-300 uppercase font-mono">Sanction Tier</label>
                <select
                  value={warningLevel}
                  onChange={e => setWarningLevel(parseInt(e.target.value) as 1 | 2 | 3)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value={1}>Level 1: Official Policy Warning (Notification)</option>
                  <option value={2}>Level 2: Task Submission Restriction (Temporarily blocked)</option>
                  <option value={3}>Level 3: Permanent Account Suspension / Ban</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-300 uppercase font-mono">
                  Violation Explanation
                </label>
                <textarea
                  rows={3}
                  required
                  value={warningReason}
                  onChange={e => setWarningReason(e.target.value)}
                  placeholder="Describe the rule infraction (e.g. repeated fake screenshot uploads)..."
                  className="w-full px-3 py-2 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setWarningModalUser(null)}
                  className="px-3.5 py-2 rounded-xl bg-white/5 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold uppercase font-mono flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Issue Sanction</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-[#0F131C] border border-rose-500/30 p-6 space-y-5 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Permanently Delete Account?</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to delete user{' '}
                <strong className="text-white">{deleteConfirmUser.fullName}</strong> (@{deleteConfirmUser.username})?
                This action is irreversible and erases all sessions.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(deleteConfirmUser)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Monday Fresh Start Reset Confirmation Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-[#0F131C] border border-[#F2A900]/30 p-6 space-y-5 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#F2A900]/10 border border-[#F2A900]/20 text-[#F2A900] mx-auto flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-white">Initialize Monday Fresh Start?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                This operation will safely reset all community members&apos; coin balances to{' '}
                <strong className="text-[#F2A900] font-mono">0 coins</strong> in both your local cache and Supabase
                cloud database. All real registered user accounts, passwords, and profiles will remain intact.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                disabled={isResetting}
                className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-semibold hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFreshStartReset}
                disabled={isResetting}
                className="px-4 py-2 rounded-xl bg-[#F2A900] hover:bg-[#d99700] text-black text-xs font-extrabold uppercase font-mono tracking-wider flex items-center gap-1.5"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Confirm Fresh Start</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
