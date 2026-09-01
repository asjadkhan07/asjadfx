import React, { useState, useEffect } from 'react';
import {
  getDailyStreakConfig,
  saveDailyStreakConfig,
  getAllRedeemCodes,
  saveRedeemCode,
  deleteRedeemCode,
  toggleRedeemCodeStatus,
  getAllRedemptionLogs,
} from '../../services/rewards';
import { DailyStreakConfig, RedeemCode, CodeRedemptionLog } from '../../types';
import {
  Gift,
  Flame,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Clock,
  Coins,
  Ticket,
  Search,
  Filter,
  RefreshCw,
  Save,
  AlertCircle,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

export const AdminRewardsPage: React.FC = () => {
  // Streak config state
  const [streakConfig, setStreakConfig] = useState<DailyStreakConfig>(getDailyStreakConfig());
  const [streakSavedMessage, setStreakSavedMessage] = useState<string | null>(null);

  // Day 1-7 reward inputs string state to allow clean typing, backspace, and replacement
  const [streakRewardInputs, setStreakRewardInputs] = useState<string[]>(() =>
    getDailyStreakConfig().rewards.map((r) => String(r))
  );
  // Reset threshold hours input string state
  const [streakResetHoursInput, setStreakResetHoursInput] = useState<string>(() =>
    String(getDailyStreakConfig().resetAfterHours || 48)
  );

  // Redeem codes state
  const [codes, setCodes] = useState<RedeemCode[]>(getAllRedeemCodes());
  const [logs, setLogs] = useState<CodeRedemptionLog[]>(getAllRedemptionLogs());
  const [searchQuery, setSearchQuery] = useState('');
  const [logFilter, setLogFilter] = useState('');

  // Delete confirmation modal state
  const [deleteConfirmCode, setDeleteConfirmCode] = useState<{ id: string; code: string } | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<RedeemCode | null>(null);
  const [formData, setFormData] = useState<{
    code: string;
    rewardCoins: string;
    maxUses: string;
    expiresAt: string;
    status: 'active' | 'disabled';
    description: string;
  }>({
    code: '',
    rewardCoins: '50',
    maxUses: '0',
    expiresAt: '',
    status: 'active',
    description: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const refreshAllData = () => {
    const freshConfig = getDailyStreakConfig();
    setStreakConfig(freshConfig);
    setStreakRewardInputs(freshConfig.rewards.map((r) => String(r)));
    setStreakResetHoursInput(String(freshConfig.resetAfterHours || 48));
    setCodes(getAllRedeemCodes());
    setLogs(getAllRedemptionLogs());
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // Handle streak reward typing
  const handleStreakRewardInputChange = (index: number, rawVal: string) => {
    // Keep only digits
    const clean = rawVal.replace(/[^0-9]/g, '');
    setStreakRewardInputs((prev) => {
      const next = [...prev];
      next[index] = clean;
      return next;
    });
  };

  // Commit / normalize on blur
  const handleStreakRewardInputBlur = (index: number) => {
    const currentStr = streakRewardInputs[index];
    const parsed = parseInt(currentStr, 10);
    const safeVal = isNaN(parsed) || parsed < 1 ? 1 : parsed;

    setStreakRewardInputs((prev) => {
      const next = [...prev];
      next[index] = String(safeVal);
      return next;
    });

    setStreakConfig((prev) => {
      const newRewards = [...prev.rewards] as [
        number,
        number,
        number,
        number,
        number,
        number,
        number
      ];
      newRewards[index] = safeVal;
      return {
        ...prev,
        rewards: newRewards,
      };
    });
  };

  // Commit reset threshold on blur
  const handleResetHoursBlur = () => {
    const parsed = parseInt(streakResetHoursInput, 10);
    const safeVal = isNaN(parsed) || parsed < 1 ? 48 : parsed;
    setStreakResetHoursInput(String(safeVal));
    setStreakConfig((prev) => ({
      ...prev,
      resetAfterHours: safeVal,
    }));
  };

  // Save Streak Config
  const handleSaveStreakConfig = (e: React.FormEvent) => {
    e.preventDefault();

    const resolvedRewards = streakRewardInputs.map((str, idx) => {
      const p = parseInt(str, 10);
      return isNaN(p) || p < 1 ? (streakConfig.rewards[idx] || 1) : p;
    }) as [number, number, number, number, number, number, number];

    const pReset = parseInt(streakResetHoursInput, 10);
    const resolvedReset = isNaN(pReset) || pReset < 1 ? 48 : pReset;

    const finalConfig: DailyStreakConfig = {
      ...streakConfig,
      rewards: resolvedRewards,
      resetAfterHours: resolvedReset,
    };

    saveDailyStreakConfig(finalConfig);
    setStreakConfig(finalConfig);
    setStreakRewardInputs(resolvedRewards.map(String));
    setStreakResetHoursInput(String(resolvedReset));

    setStreakSavedMessage('Daily Streak configurations updated successfully!');
    setTimeout(() => setStreakSavedMessage(null), 3500);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingCode(null);
    setFormData({
      code: '',
      rewardCoins: '50',
      maxUses: '0',
      expiresAt: '',
      status: 'active',
      description: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (code: RedeemCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      rewardCoins: String(code.rewardCoins),
      maxUses: String(code.maxUses || 0),
      expiresAt: code.expiresAt ? code.expiresAt.substring(0, 10) : '',
      status: code.status,
      description: code.description || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Save / Update Code
  const handleSaveCode = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanCode = formData.code.trim().toUpperCase();
    if (!cleanCode) {
      setFormError('Promo code string is required.');
      return;
    }
    const coinAmt = parseInt(formData.rewardCoins, 10);
    if (isNaN(coinAmt) || coinAmt <= 0) {
      setFormError('Reward coin amount must be greater than 0.');
      return;
    }

    const codeToSave: RedeemCode = {
      id: editingCode ? editingCode.id : `code_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      code: cleanCode,
      rewardCoins: coinAmt,
      maxUses: parseInt(formData.maxUses, 10) || 0,
      usedCount: editingCode ? editingCode.usedCount : 0,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined,
      status: formData.status,
      createdAt: editingCode ? editingCode.createdAt : new Date().toISOString(),
      description: formData.description.trim() || 'Admin Created Reward Code',
    };

    saveRedeemCode(codeToSave);
    setIsModalOpen(false);
    refreshAllData();
  };

  // Toggle Code Status
  const handleToggleStatus = (codeId: string) => {
    toggleRedeemCodeStatus(codeId);
    refreshAllData();
  };

  // Delete Code Prompt Modal
  const handleDeleteCode = (codeId: string, codeName: string) => {
    setDeleteConfirmCode({ id: codeId, code: codeName });
  };

  // Confirm Delete Handler
  const handleConfirmDelete = () => {
    if (!deleteConfirmCode) return;
    const { id, code } = deleteConfirmCode;
    deleteRedeemCode(id);
    setDeleteConfirmCode(null);
    refreshAllData();
    setActionSuccessMessage(`Reward code "${code}" deleted permanently.`);
    setTimeout(() => setActionSuccessMessage(null), 3500);
  };

  // Filtered Codes
  const filteredCodes = codes.filter(
    (c) =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filtered Logs
  const filteredLogs = logs.filter(
    (l) =>
      l.code.toLowerCase().includes(logFilter.toLowerCase()) ||
      l.username.toLowerCase().includes(logFilter.toLowerCase()) ||
      l.fullName.toLowerCase().includes(logFilter.toLowerCase())
  );

  const totalCoinsDistributed = logs.reduce((acc, l) => acc + l.rewardCoins, 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Gift className="w-6 h-6 text-[#F2A900]" />
            <h1 className="text-xl sm:text-2xl font-black text-white">Rewards & Streaks Control</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure 7-day streak payout multipliers, issue live coupon voucher codes, and audit redemptions.
          </p>
        </div>

        <button
          onClick={refreshAllData}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs font-semibold self-start sm:self-auto cursor-pointer transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0F131C] border border-white/5 p-4 rounded-2xl">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-400">Total Active Codes</div>
          <div className="text-2xl font-black font-mono text-[#00FF66] mt-1">
            {codes.filter((c) => c.status === 'active').length}{' '}
            <span className="text-xs text-slate-500 font-normal">/ {codes.length} Total</span>
          </div>
        </div>

        <div className="bg-[#0F131C] border border-white/5 p-4 rounded-2xl">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-400">Total Redemptions</div>
          <div className="text-2xl font-black font-mono text-white mt-1">{logs.length}</div>
        </div>

        <div className="bg-[#0F131C] border border-white/5 p-4 rounded-2xl">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-400">Coins Claimed via Codes</div>
          <div className="text-2xl font-black font-mono text-[#FFD700] mt-1">
            {totalCoinsDistributed.toLocaleString()}{' '}
            <span className="text-xs text-slate-400 font-normal">Coins</span>
          </div>
        </div>

        <div className="bg-[#0F131C] border border-white/5 p-4 rounded-2xl">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-400">Streak System Status</div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                streakConfig.enabled ? 'bg-[#00FF66] animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="text-sm font-bold text-white">
              {streakConfig.enabled ? 'Active (Live)' : 'Paused'}
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. DAILY STREAK CONFIGURATION */}
      {/* ======================================================== */}
      <div className="bg-[#0F131C] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Daily Streak Payout Settings</h2>
              <p className="text-xs text-slate-400">Configure coins awarded per day for consecutive check-ins.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={streakConfig.enabled}
                onChange={(e) => setStreakConfig({ ...streakConfig, enabled: e.target.checked })}
                className="w-4 h-4 rounded text-[#00FF66] focus:ring-0 bg-black border-white/20"
              />
              <span>Enable Daily Streaks</span>
            </label>
          </div>
        </div>

        {streakSavedMessage && (
          <div className="p-3 rounded-2xl bg-[#00FF66]/10 border border-[#00FF66]/30 text-[#00FF66] text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{streakSavedMessage}</span>
          </div>
        )}

        <form onSubmit={handleSaveStreakConfig} className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {streakConfig.rewards.map((_, index) => {
              const day = index + 1;
              const isSpecial = day === 7;
              return (
                <div
                  key={`day-setting-${day}`}
                  className={`p-3 rounded-2xl border text-center space-y-1.5 ${
                    isSpecial ? 'bg-amber-500/10 border-[#FFD700]/30' : 'bg-[#05070A] border-white/10'
                  }`}
                >
                  <div className="text-[10px] font-mono font-bold text-slate-400 flex items-center justify-center gap-1">
                    <span>DAY {day}</span>
                    {isSpecial && <Sparkles className="w-3 h-3 text-[#FFD700]" />}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={streakRewardInputs[index] ?? ''}
                      placeholder="1"
                      onFocus={(e) => e.target.select()}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      onChange={(e) => handleStreakRewardInputChange(index, e.target.value)}
                      onBlur={() => handleStreakRewardInputBlur(index)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      className="w-full text-center px-2 py-2 rounded-xl bg-[#0A0D14] border border-white/15 focus:border-[#00FF66] text-white font-mono font-bold text-sm outline-none transition-colors"
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {isSpecial ? 'Special Jackpot' : 'Coins'}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-mono font-bold text-slate-300">Special Bonus Label</label>
              <input
                type="text"
                value={streakConfig.specialBonusLabel || ''}
                onChange={(e) => setStreakConfig({ ...streakConfig, specialBonusLabel: e.target.value })}
                placeholder="e.g. 100 Coins Jackpot + Elite Badge"
                className="w-full px-4 py-2.5 rounded-xl bg-[#05070A] border border-white/15 focus:border-[#00FF66] text-white text-xs outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono font-bold text-slate-300">Streak Reset Threshold (Hours)</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={streakResetHoursInput}
                placeholder="48"
                onFocus={(e) => e.target.select()}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                onChange={(e) => setStreakResetHoursInput(e.target.value.replace(/[^0-9]/g, ''))}
                onBlur={handleResetHoursBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-[#05070A] border border-white/15 focus:border-[#00FF66] text-white font-mono text-xs outline-none transition-colors"
              />
              <p className="text-[10px] text-slate-500">
                If user does not claim within this window, their streak resets back to Day 1.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#F2A900] hover:bg-[#F2A900]/90 text-black font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>Save Streak Settings</span>
            </button>
          </div>
        </form>
      </div>

      {/* ======================================================== */}
      {/* 2. REDEEM PROMO CODES MANAGEMENT */}
      {/* ======================================================== */}
      <div className="bg-[#0F131C] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00FF66]/20 text-[#00FF66] flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Promo Codes Management</h2>
              <p className="text-xs text-slate-400">Generate coupons, livestream codes, and custom community bonuses.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-[#05070A] border border-white/10 text-xs text-white focus:border-[#00FF66] outline-none"
              />
            </div>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl bg-[#00FF66] hover:bg-[#00FF66]/90 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-[0_0_15px_rgba(0,255,102,0.3)]"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Code</span>
            </button>
          </div>
        </div>

        {/* Codes Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 font-mono">
                <th className="pb-3 px-3 font-semibold">CODE</th>
                <th className="pb-3 px-3 font-semibold">REWARD</th>
                <th className="pb-3 px-3 font-semibold">USAGE (USED / MAX)</th>
                <th className="pb-3 px-3 font-semibold">EXPIRES</th>
                <th className="pb-3 px-3 font-semibold">STATUS</th>
                <th className="pb-3 px-3 font-semibold text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCodes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No promo codes found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredCodes.map((code) => {
                  const isExpired =
                    code.expiresAt && new Date(code.expiresAt).getTime() < Date.now();
                  const isLimitReached =
                    code.maxUses > 0 && (code.usedCount || 0) >= code.maxUses;

                  return (
                    <tr key={code.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-white text-sm tracking-wide">
                          {code.code}
                        </div>
                        {code.description && (
                          <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">
                            {code.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#FFD700]">
                        +{code.rewardCoins} Coins
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">
                        {code.usedCount || 0}{' '}
                        <span className="text-slate-500">
                          / {code.maxUses > 0 ? code.maxUses : 'Unlimited'}
                        </span>
                        {isLimitReached && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            Max Limit
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {code.expiresAt ? (
                          <span className={isExpired ? 'text-rose-400 line-through' : ''}>
                            {new Date(code.expiresAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-slate-500">No Expiry</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleToggleStatus(code.id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                            code.status === 'active'
                              ? 'bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {code.status === 'active' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>ACTIVE</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>DISABLED</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(code)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer transition-colors"
                            title="Edit Code"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCode(code.id, code.code)}
                            className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer transition-colors"
                            title="Delete Code"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* ======================================================== */}
      {/* 3. REDEMPTION AUDIT LOGS */}
      {/* ======================================================== */}
      <div className="bg-[#0F131C] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/5">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">Live Code Redemption History</h2>
            <p className="text-xs text-slate-400">Complete audit log of all users who claimed reward codes.</p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by user or code..."
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-[#05070A] border border-white/10 text-xs text-white focus:border-[#00FF66] outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-[#0F131C]">
              <tr className="border-b border-white/5 text-slate-400 font-mono">
                <th className="pb-3 px-3 font-semibold">CODE</th>
                <th className="pb-3 px-3 font-semibold">USER</th>
                <th className="pb-3 px-3 font-semibold">REWARD</th>
                <th className="pb-3 px-3 font-semibold">TIMESTAMP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    No redemption records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5">
                    <td className="py-2.5 px-3 font-mono font-bold text-white">{log.code}</td>
                    <td className="py-2.5 px-3">
                      <div className="text-white font-medium">{log.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">@{log.username}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#FFD700]">
                      +{log.rewardCoins} Coins
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                      {new Date(log.redeemedAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CREATE / EDIT CODE MODAL */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0F131C] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <h3 className="text-lg font-bold text-white">
                {editingCode ? `Edit Code [${editingCode.code}]` : 'Create New Promo Code'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCode} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-slate-300 uppercase">
                  Code String *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. ASJAD2026, LIVESTREAM100"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#05070A] border border-white/15 focus:border-[#00FF66] text-white font-mono uppercase font-bold text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-slate-300 uppercase">
                    Reward Coins *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    value={formData.rewardCoins}
                    placeholder="50"
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    onChange={(e) =>
                      setFormData({ ...formData, rewardCoins: e.target.value.replace(/[^0-9]/g, '') })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-[#05070A] border border-white/15 focus:border-[#00FF66] text-white font-mono font-bold text-sm outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-slate-300 uppercase">
                    Max Uses (0 = Unlimited)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.maxUses}
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    onChange={(e) =>
                      setFormData({ ...formData, maxUses: e.target.value.replace(/[^0-9]/g, '') })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-[#05070A] border border-white/15 focus:border-[#00FF66] text-white font-mono font-bold text-sm outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-slate-300 uppercase">
                    Expiration Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#05070A] border border-white/15 focus:border-[#00FF66] text-white text-xs outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-slate-300 uppercase">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as 'active' | 'disabled' })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-[#05070A] border border-white/15 focus:border-[#00FF66] text-white text-xs outline-none cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-slate-300 uppercase">
                  Description / Campaign Note
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. YouTube Live Trading Drop - Oct 2026"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#05070A] border border-white/15 focus:border-[#00FF66] text-white text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#00FF66] hover:bg-[#00FF66]/90 text-black font-black text-xs cursor-pointer shadow-[0_0_15px_rgba(0,255,102,0.3)]"
                >
                  {editingCode ? 'Update Code' : 'Create Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Action Toast Banner */}
      {actionSuccessMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-2 shadow-2xl backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Delete Code Confirmation Dialog */}
      {deleteConfirmCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-[#0F131C] border border-rose-500/30 p-6 space-y-5 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-white font-mono">Delete Promo Code?</h3>
              <p className="text-xs text-slate-300">
                Are you sure you want to permanently delete code{' '}
                <strong className="text-[#00FF66] font-mono tracking-wider font-bold">
                  {deleteConfirmCode.code}
                </strong>
                ?
              </p>
              <p className="text-[11px] text-slate-500">
                Users will immediately no longer be able to redeem this code. Past audit records remain intact.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmCode(null)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold font-mono uppercase tracking-wider cursor-pointer shadow-[0_0_15px_rgba(225,29,72,0.3)] transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
