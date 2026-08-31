import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getSystemSettings,
  updateSystemSettings,
  getPlatforms,
  updatePlatformConfig,
  changeUserPassword,
  updateUserProfileByAdmin,
} from '../../services/storage';
import { AdminSystemSettings, PlatformConfig } from '../../types';
import {
  Settings,
  Lock,
  Globe,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Key,
  Smartphone,
  Eye,
  EyeOff,
} from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const { user: currentAdmin, refreshUser } = useAuth();
  const [settings, setSettings] = useState<AdminSystemSettings | null>(null);
  const [platforms, setPlatforms] = useState<PlatformConfig[]>([]);

  // Profile Form
  const [adminName, setAdminName] = useState(currentAdmin?.fullName || 'Master Administrator');
  const [adminEmail, setAdminEmail] = useState(currentAdmin?.email || 'asjadarmwrestlingvloge@gmail.com');

  // Password Change Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Notifications
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    setSettings(getSystemSettings());
    setPlatforms(getPlatforms());
  }, []);

  const handleSaveSystemSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    updateSystemSettings(settings);
    setNotice({ type: 'success', message: 'System configuration updated successfully.' });
    setTimeout(() => setNotice(null), 3500);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdmin) return;

    const res = updateUserProfileByAdmin(currentAdmin.id, {
      fullName: adminName,
      email: adminEmail,
    });

    if (res.success) {
      refreshUser();
      setNotice({ type: 'success', message: 'Admin profile updated.' });
      setTimeout(() => setNotice(null), 3000);
    } else {
      setNotice({ type: 'error', message: res.error || 'Profile update failed.' });
      setTimeout(() => setNotice(null), 4000);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdmin) return;

    if (newPassword !== confirmNewPassword) {
      setNotice({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    if (newPassword.length < 8) {
      setNotice({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }

    setIsChangingPassword(true);
    const res = await changeUserPassword(currentAdmin.id, currentPassword, newPassword);
    setIsChangingPassword(false);

    if (res.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setNotice({ type: 'success', message: 'Admin password successfully changed with cryptographic hashing.' });
      setTimeout(() => setNotice(null), 3500);
    } else {
      setNotice({ type: 'error', message: res.error || 'Password update failed.' });
      setTimeout(() => setNotice(null), 4000);
    }
  };

  const handlePlatformUrlChange = (pltKey: string, newUrl: string) => {
    const plt = platforms.find(p => p.key === pltKey);
    if (!plt) return;
    const updated = { ...plt, officialUrl: newUrl };
    updatePlatformConfig(updated);
    setPlatforms(getPlatforms());
  };

  if (!settings) return null;

  return (
    <div id="admin-settings-page" className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2A900]/10 border border-[#F2A900]/20 text-[#F2A900] text-xs font-bold uppercase tracking-wider mb-2 font-mono">
          <Settings className="w-3.5 h-3.5" />
          <span>System & Security</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Admin Settings & Platform Security
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage core platform identity, security credentials, maintenance toggles, and official social media routing.
        </p>
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
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      {/* Grid of Settings Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module 1: System Config & Toggles */}
        <div className="rounded-2xl bg-[#0F131C] border border-white/5 p-6 space-y-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-extrabold text-white pb-3 border-b border-white/5">
              <Globe className="w-4 h-4 text-[#F2A900]" />
              <span>Platform Branding & Toggles</span>
            </div>

            <form onSubmit={handleSaveSystemSettings} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-300 uppercase font-mono">Website Name</label>
                <input
                  type="text"
                  required
                  value={settings.siteName}
                  onChange={e => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900]"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-300 uppercase font-mono">Platform Tagline</label>
                <input
                  type="text"
                  required
                  value={settings.siteTagline}
                  onChange={e => setSettings({ ...settings, siteTagline: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900]"
                />
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between p-3 rounded-xl bg-[#0A0D14] border border-white/5 cursor-pointer">
                  <div>
                    <div className="font-bold text-white text-xs">User Registrations</div>
                    <div className="text-[11px] text-slate-500">Allow new users to sign up on the website</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.signupEnabled}
                    onChange={e => setSettings({ ...settings, signupEnabled: e.target.checked })}
                    className="w-4 h-4 accent-[#F2A900]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-[#0A0D14] border border-white/5 cursor-pointer">
                  <div>
                    <div className="font-bold text-white text-xs">Maintenance Mode</div>
                    <div className="text-[11px] text-slate-500">Disable non-admin access for platform updates</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={e => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                    className="w-4 h-4 accent-rose-500"
                  />
                </label>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#F2A900] text-black font-extrabold uppercase font-mono text-xs flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(242,169,0,0.2)]"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save System Settings</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Module 2: Admin Password & Security */}
        <div className="rounded-2xl bg-[#0F131C] border border-white/5 p-6 space-y-5 shadow-xl">
          <div className="flex items-center gap-2 text-sm font-extrabold text-white pb-3 border-b border-white/5">
            <Lock className="w-4 h-4 text-[#F2A900]" />
            <span>Admin Password & Security</span>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <label className="block font-bold text-slate-300 uppercase font-mono">Current Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter current password..."
                className="w-full px-3.5 py-2 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900]"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-300 uppercase font-mono">New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters..."
                className="w-full px-3.5 py-2 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900]"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-300 uppercase font-mono">Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmNewPassword}
                onChange={e => setConfirmNewPassword(e.target.value)}
                placeholder="Re-enter new password..."
                className="w-full px-3.5 py-2 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900]"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPassword ? 'Hide Passwords' : 'Show Passwords'}</span>
              </button>

              <button
                type="submit"
                disabled={isChangingPassword}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F2A900] via-[#FFD700] to-[#F2A900] text-black font-extrabold uppercase font-mono text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Key className="w-3.5 h-3.5" />
                <span>{isChangingPassword ? 'Hashing...' : 'Update Password'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Module 3: Official Social Network URLs (Full Width across 2 cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-[#0F131C] border border-white/5 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2 text-sm font-extrabold text-white">
              <Smartphone className="w-4 h-4 text-[#F2A900]" />
              <span>Official Social Media Account URLs</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Direct traffic targets for ASJADFX tasks
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {platforms.map(plt => (
              <div key={plt.id} className="p-3.5 rounded-xl bg-[#0A0D14] border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span>{plt.icon}</span>
                    <span>{plt.name}</span>
                  </span>
                  <span className="text-[10px] uppercase text-slate-500 font-bold">{plt.status}</span>
                </div>
                <input
                  type="url"
                  value={plt.officialUrl}
                  onChange={e => handlePlatformUrlChange(plt.key, e.target.value)}
                  placeholder={`https://${plt.key}.com/...`}
                  className="w-full px-3 py-2 rounded-lg bg-[#0F131C] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#F2A900]"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
