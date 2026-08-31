import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Megaphone,
  Trophy,
  ShieldAlert,
  X,
  Trash2,
  CheckCheck,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NotificationType, AppRoute } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const { notifications, markAsRead, markAllAsRead, clearNotifications, navigateTo } = useAuth();

  if (!isOpen) return null;

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'task_approved':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'task_rejected':
        return <XCircle className="w-5 h-5 text-rose-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'account_restricted':
        return <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />;
      case 'announcement':
        return <Megaphone className="w-5 h-5 text-cyan-400 shrink-0" />;
      case 'giveaway_winner':
        return <Trophy className="w-5 h-5 text-amber-300 shrink-0" />;
      default:
        return <Bell className="w-5 h-5 text-slate-400 shrink-0" />;
    }
  };

  const handleNotificationClick = (id: string, actionUrl?: string) => {
    markAsRead(id);
    if (actionUrl) {
      onClose();
      navigateTo(actionUrl as AppRoute);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AnimatePresence>
      <div
        id="notifications-backdrop"
        className="fixed inset-0 z-50 flex items-start justify-end p-3 sm:p-6 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          id="notifications-panel"
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.18 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-md bg-[#0A0D14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden mt-12 sm:mt-14"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#0F131C]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#F2A900]/10 border border-[#F2A900]/20 text-[#F2A900]">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white font-['Space_Grotesk']">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#F2A900]/20 border border-[#F2A900]/30 text-[#F2A900] text-[10px] font-bold font-mono">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">Real-time system updates & alerts</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {notifications.length > 0 && unreadCount > 0 && (
                <button
                  id="btn-mark-all-read"
                  onClick={markAllAsRead}
                  title="Mark all as read"
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#F2A900] hover:bg-[#F2A900]/10 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mark read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  id="btn-clear-notifications"
                  onClick={clearNotifications}
                  title="Clear all"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                id="btn-close-notifications"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-[65vh] overflow-y-auto p-4 space-y-2.5">
            {notifications.length === 0 ? (
              <div id="notifications-empty-state" className="py-12 px-4 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                  <Bell className="w-6 h-6 opacity-60" />
                </div>
                <p className="text-sm font-semibold text-slate-300">No notifications yet.</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  You will receive alerts here when your tasks are reviewed, giveaways end, or announcements are published.
                </p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  id={`notification-item-${n.id}`}
                  onClick={() => handleNotificationClick(n.id, n.actionUrl)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    n.read
                      ? 'bg-[#0F131C]/60 border-white/5 text-slate-300 hover:border-white/15'
                      : 'bg-[#161B24] border-[#F2A900]/30 text-white shadow-[0_0_12px_rgba(242,169,0,0.05)] hover:border-[#F2A900]/60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-sm font-semibold truncate text-slate-100">{n.title}</h4>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-[#F2A900] shrink-0 shadow-[0_0_6px_#F2A900]" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed break-words">{n.message}</p>
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5 text-[10px] font-mono text-slate-500">
                        <span>{new Date(n.date).toLocaleString()}</span>
                        {n.actionUrl && (
                          <span className="text-[#F2A900] flex items-center gap-1 hover:underline">
                            View details
                            <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
