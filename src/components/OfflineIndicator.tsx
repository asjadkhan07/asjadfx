import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          id="pwa-offline-indicator"
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-20 sm:bottom-6 left-4 z-50 flex items-center gap-3 rounded-xl bg-[#141A24]/95 border border-amber-500/40 px-4 py-2.5 shadow-2xl backdrop-blur-xl text-xs font-semibold text-slate-200"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
            <WifiOff className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <p className="font-bold text-amber-300 flex items-center gap-1.5">
              <span>Offline Mode Active</span>
            </p>
            <p className="text-[11px] text-slate-400">Using offline cached data. Reconnecting...</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
