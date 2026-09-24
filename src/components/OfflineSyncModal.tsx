import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { OfflineAction } from '../types';
import { sounds } from '../utils/sound';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  Clock,
  Wifi,
  WifiOff,
  Sparkles
} from 'lucide-react';

interface OfflineSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOffline: boolean;
  onToggleOffline: () => void;
  offlineQueue: OfflineAction[];
  lastSyncedAt: string;
  onPerformSync: () => void;
}

export const OfflineSyncModal: React.FC<OfflineSyncModalProps> = ({
  isOpen,
  onClose,
  isOffline,
  onToggleOffline,
  offlineQueue,
  lastSyncedAt,
  onPerformSync,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isOpen) return null;

  const handleSyncNow = () => {
    sounds.playTap();
    setIsSyncing(true);

    setTimeout(() => {
      setIsSyncing(false);
      onPerformSync();
      sounds.playCorrect();
      confetti({ particleCount: 60, spread: 60 });
    }, 1200);
  };

  const actionNameMap: Record<string, string> = {
    complete_math: '🧮 數學 10 題完成記錄',
    log_walk: '🚶 戶外步數更新記錄',
    checkpoint_evidence: '📸 冒險搜證與照片上傳',
    family_done: '❤️ 祖父母家庭任務完成',
    submit_reflection: '🌙 每日反思日記提交',
    redeem_reward: '🎁 獎勵兌換申請',
    mum_mission: '👑 媽媽特派任務發送',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-850 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl animate-in fade-in zoom-in-95">
        
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
          <div className="flex items-center gap-2">
            {isOffline ? (
              <CloudOff className="w-5 h-5 text-amber-400" />
            ) : (
              <Cloud className="w-5 h-5 text-emerald-400" />
            )}
            <h2 className="text-base font-bold text-white font-['Outfit']">
              Offline-First 離線狀態與同步中心
            </h2>
          </div>
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
          >
            ✕ 關閉
          </button>
        </div>

        {/* Current Network Status Card */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isOffline ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60' : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
            }`}>
              {isOffline ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                {isOffline ? '目前為離線模式 (Offline)' : '已連線至網路 (Online)'}
              </div>
              <div className="text-xs text-slate-400">
                {isOffline
                  ? '出街漫步無網絡，任務先存本機，回家一鍵 Sync！'
                  : `最後同步時間：${lastSyncedAt}`}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playTap();
              onToggleOffline();
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 cursor-pointer"
          >
            {isOffline ? '切回線上' : '模擬離線'}
          </button>
        </div>

        {/* Offline Queue list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300">
              待同步隊列 (Pending Queue): {offlineQueue.length} 項
            </span>
            {offlineQueue.length === 0 && (
              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> 所有數據均已是最新
              </span>
            )}
          </div>

          {offlineQueue.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400 space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-400/80 mx-auto" />
              <div className="font-bold text-slate-300">本地與伺服器完全同步</div>
              <div>你在紐西蘭的每次前進，媽媽在香港都能看到！</div>
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {offlineQueue.map(item => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/70 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-white font-medium">
                      {actionNameMap[item.actionType] || item.actionType}
                    </span>
                  </div>
                  <span className="text-slate-500 font-mono text-[11px]">{item.timestamp}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sync Action Button */}
        <div className="pt-2 border-t border-slate-700/60 flex items-center justify-end gap-3">
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
          >
            稍後再說
          </button>

          <button
            onClick={handleSyncNow}
            disabled={isSyncing || offlineQueue.length === 0}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-400 hover:to-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl shadow cursor-pointer active:scale-95 transition-transform flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? '正在傳送數據至香港...' : '☁️ 立即同步至香港 Game Master'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
