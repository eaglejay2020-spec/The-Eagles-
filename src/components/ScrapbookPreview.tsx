import React, { useState, useEffect } from 'react';
import { SharedMoment, Role } from '../types';
import {
  googleSignIn,
  logoutGoogle,
  uploadScrapbookToDrive,
  initAuth,
  DriveSyncResult
} from '../services/googleDriveService';
import { sounds } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  BookOpen,
  Cloud,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Calendar,
  MapPin,
  Users,
  Heart,
  Star,
  Sparkles,
  Download,
  AlertCircle,
  Eye,
  X,
  Layers,
  Check
} from 'lucide-react';
import { User } from 'firebase/auth';

interface ScrapbookPreviewProps {
  moments: SharedMoment[];
  activeRole?: Role;
  onSelectMoment?: (moment: SharedMoment) => void;
  onClose?: () => void;
}

export const ScrapbookPreview: React.FC<ScrapbookPreviewProps> = ({
  moments,
  activeRole = 'mum',
  onClose,
}) => {
  const isYounger = activeRole === 'sister_younger';

  // Filter bookmarked moments
  const bookmarkedMoments = moments.filter(
    m => m.mumReaction?.bookmarkedForScrapbook === true
  );

  // Google Drive & Auth State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [lastSyncResult, setLastSyncResult] = useState<DriveSyncResult | null>(() => {
    try {
      const saved = localStorage.getItem('temuka_scrapbook_last_drive_sync');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Gallery Filters & Lightbox
  const [filterAuthor, setFilterAuthor] = useState<'all' | 'sister_younger' | 'sister_older'>('all');
  const [activePhotoModal, setActivePhotoModal] = useState<string | null>(null);

  // Initialize Auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setGoogleUser(user);
      },
      () => {
        setGoogleUser(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Auto-sync effect: when Google user is logged in and autoSyncEnabled is true
  useEffect(() => {
    if (googleUser && autoSyncEnabled && bookmarkedMoments.length > 0) {
      // Debounce auto-sync
      const timer = setTimeout(() => {
        handleSyncToDrive(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [bookmarkedMoments.length, googleUser, autoSyncEnabled]);

  const handleGoogleLogin = async () => {
    try {
      sounds.playTap();
      setIsAuthenticating(true);
      setErrorMsg(null);
      const res = await googleSignIn();
      if (res?.user) {
        setGoogleUser(res.user);
        sounds.playCorrect();
        confetti({ particleCount: 50, spread: 60 });
        setSyncStatusMsg(`已成功連接媽媽 Google 帳戶 (${res.user.email})！正在自動同步回憶冊...`);
        setTimeout(() => setSyncStatusMsg(null), 4000);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Google 登入失敗，請確認彈出視窗未被封鎖。');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleLogout = async () => {
    sounds.playTap();
    await logoutGoogle();
    setGoogleUser(null);
    setSyncStatusMsg('已中斷 Google Drive 帳戶連線。');
    setTimeout(() => setSyncStatusMsg(null), 3000);
  };

  const handleSyncToDrive = async (isAuto = false) => {
    if (bookmarkedMoments.length === 0) {
      if (!isAuto) {
        setErrorMsg('目前尚無被媽媽標記為「回憶冊精選」的生活紀錄。請先在分享列表中將記錄打星號！');
      }
      return;
    }

    try {
      setIsSyncingDrive(true);
      setErrorMsg(null);
      if (!isAuto) sounds.playTap();

      const result = await uploadScrapbookToDrive(bookmarkedMoments);
      setLastSyncResult(result);
      localStorage.setItem('temuka_scrapbook_last_drive_sync', JSON.stringify(result));

      if (!isAuto) {
        sounds.playFanfare();
        confetti({ particleCount: 60, spread: 70 });
      }

      setSyncStatusMsg(
        isAuto
          ? `⚡ 已自動備份第一章至媽媽 Google Drive (${result.syncedAt})`
          : `🎉 已成功備份第一章至媽媽 Google Drive (${result.syncedAt})！`
      );
      setTimeout(() => setSyncStatusMsg(null), 5000);
    } catch (err: any) {
      console.error('Drive sync failed:', err);
      if (!isAuto) {
        setErrorMsg(err.message || '備份至 Google Drive 時發生錯誤。請確認網路或重新登入 Google。');
      }
    } finally {
      setIsSyncingDrive(false);
    }
  };

  const handleDownloadOfflineMarkdown = () => {
    sounds.playTap();
    const content = bookmarkedMoments.map((m, i) => 
      `### [${i + 1}] ${m.dateStr} - ${m.location}\n${m.titleOrEvent}\n\n`
    ).join('\n');
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Temuka_Scrapbook_Chapter_1_${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const displayedMoments = bookmarkedMoments.filter(m => {
    if (filterAuthor === 'sister_younger') return m.userId === 'sister_younger';
    if (filterAuthor === 'sister_older') return m.userId === 'sister_older';
    return true;
  });

  const bodyContent = (
    <div className="space-y-6">
      
      {/* Chapter 1 Hero Book Cover Header */}
      <div className="relative rounded-3xl bg-gradient-to-br from-amber-950/40 via-slate-850 to-slate-900 border-2 border-amber-500/40 p-6 sm:p-8 shadow-2xl overflow-hidden">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 cursor-pointer shadow"
            title="關閉預覽"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {/* Decorative Golden Ambient glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold font-mono flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                第一章 · 生活點滴與紐西蘭足跡 (Chapter 1)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs border border-slate-700">
                精選共 {bookmarkedMoments.length} 篇記憶
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] tracking-tight flex items-center gap-2">
              <span>紐西蘭成長回憶冊</span>
              <span className="text-amber-400 text-xl font-normal font-sans">· Temuka Digital Scrapbook</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              由媽媽在香港親自審閱並加蓋「⭐ 精選」標記的生活紀錄。不論是去 Auntie 屋企過週末、Christchurch 旅行、同表妹畫畫還是爺爺散步時看見的彩虹雪山，都在這裡匯聚成第一章永恆記憶，並自動備份至媽媽的 Google Drive！
            </p>
          </div>

          {/* Golden Badge Counter */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 flex items-center gap-4 shrink-0 shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 flex items-center justify-center font-black text-2xl shadow-md">
              ⭐
            </div>
            <div>
              <div className="text-[11px] text-amber-400/90 font-mono font-bold uppercase">Scrapbook Highlights</div>
              <div className="text-xl font-black text-white font-mono">{bookmarkedMoments.length} 篇生活印記</div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3" />
                <span>媽媽全數審閱備案</span>
              </div>
            </div>
          </div>
        </div>

        {/* ☁️ Google Drive Auto-Save Status & Control Bar */}
        <div className="mt-6 pt-5 border-t border-slate-700/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left: Google Account & Sync Status */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Cloud className="w-4 h-4" />
            </div>

            {googleUser ? (
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-300">已連接媽媽 Google Drive 帳戶：</span>
                  <strong className="text-emerald-400 font-mono">{googleUser.email}</strong>
                  <button
                    onClick={handleGoogleLogout}
                    className="text-[11px] text-slate-500 hover:text-rose-400 underline cursor-pointer ml-1"
                  >
                    登出
                  </button>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    自動儲存已啟用 (Auto-Save Active)
                  </span>
                  {lastSyncResult && (
                    <span className="text-slate-500 font-mono">
                      · 上次同步：{lastSyncResult.syncedAt} ({lastSyncResult.fileName})
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-0.5">
                <div className="text-xs text-slate-300 font-medium">
                  尚未連接 Google Drive 帳戶
                </div>
                <div className="text-[11px] text-slate-400">
                  登入媽媽 Google 帳戶即可自動將「第一章回憶冊」同步儲存至雲端硬碟。
                </div>
              </div>
            )}
          </div>

          {/* Right: Actions Toolbar */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {!googleUser ? (
              /* Official "Sign in with Google" Style Button */
              <button
                onClick={handleGoogleLogin}
                disabled={isAuthenticating}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2.5 border border-slate-300"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isAuthenticating ? '正在連接 Google...' : '登入 Google Drive 自動備份'}</span>
              </button>
            ) : (
              <>
                {/* Auto Sync Toggle */}
                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
                  <input
                    type="checkbox"
                    checked={autoSyncEnabled}
                    onChange={e => setAutoSyncEnabled(e.target.checked)}
                    className="accent-amber-500 rounded"
                  />
                  <span>自動同步</span>
                </label>

                {/* Manual Sync Now Button */}
                <button
                  onClick={() => handleSyncToDrive(false)}
                  disabled={isSyncingDrive}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDrive ? 'animate-spin' : ''}`} />
                  <span>{isSyncingDrive ? '同步中...' : '手動立即備份至 Drive'}</span>
                </button>

                {/* Google Drive View Link */}
                {lastSyncResult?.webViewLink && (
                  <a
                    href={lastSyncResult.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                    <span>在 Drive 檢視</span>
                  </a>
                )}
              </>
            )}

            {/* Offline Markdown Download Backup */}
            <button
              onClick={handleDownloadOfflineMarkdown}
              title="下載離線 Markdown 回憶檔案"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sync Status Banner */}
        {syncStatusMsg && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncStatusMsg}</span>
          </div>
        )}

        {/* Error Banner */}
        {errorMsg && (
          <div className="mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="cursor-pointer text-xs font-bold">✕</button>
          </div>
        )}
      </div>

      {/* Gallery Filter & View Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white font-['Outfit'] uppercase tracking-wider">
            第一章畫廊展覽 · Chapter 1 Gallery
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            ({displayedMoments.length} 則精選展品)
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-850 p-1 rounded-xl border border-slate-700 text-xs">
          <button
            onClick={() => {
              sounds.playTap();
              setFilterAuthor('all');
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterAuthor === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => {
              sounds.playTap();
              setFilterAuthor('sister_younger');
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterAuthor === 'sister_younger'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Jasmine
          </button>
          <button
            onClick={() => {
              sounds.playTap();
              setFilterAuthor('sister_older');
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterAuthor === 'sister_older'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Jessie
          </button>
        </div>
      </div>

      {/* Scrapbook Cards Gallery Grid */}
      {displayedMoments.length === 0 ? (
        <div className="p-12 text-center bg-slate-850/60 rounded-3xl border border-slate-800 text-slate-400 space-y-3">
          <BookOpen className="w-10 h-10 mx-auto text-amber-500/40" />
          <h4 className="text-base font-bold text-white">Chapter 1 Scrapbook In Progress</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No memories bookmarked for this filter yet. Once Mum bookmarks moments with ⭐, they will appear in this digital gallery!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayedMoments.map((moment, index) => {
            const isYoungerAuthor = moment.userId === 'sister_younger';
            const authorTitle = isYoungerAuthor ? 'Jasmine' : 'Jessie';

            return (
              <div
                key={moment.id}
                className="group relative rounded-3xl bg-slate-850/90 border border-slate-700/80 hover:border-amber-400/60 transition-all duration-300 shadow-xl overflow-hidden flex flex-col justify-between"
              >
                {/* Card Top Stamp Bar */}
                <div className="p-5 pb-3 border-b border-slate-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold text-xs flex items-center justify-center border border-amber-500/30">
                      #{index + 1}
                    </span>
                    <span className="font-bold text-white text-xs">{authorTitle}</span>
                    <span className="text-base" title="當日心情">{moment.mood}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                    <Calendar className="w-3 h-3 text-amber-400" />
                    <span>{moment.dateStr}</span>
                  </div>
                </div>

                {/* Photo Polaroid Frame */}
                {moment.photoUrl && (
                  <div className="px-5 pt-3">
                    <div
                      onClick={() => setActivePhotoModal(moment.photoUrl || null)}
                      className="relative rounded-2xl overflow-hidden border-2 border-slate-700 group-hover:border-amber-400/50 transition-colors max-h-56 bg-slate-950 cursor-pointer"
                    >
                      <img
                        src={moment.photoUrl}
                        alt="Moment highlight"
                        className="w-full h-full object-cover max-h-56 transition-transform duration-500 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3 text-white text-xs">
                        <span className="flex items-center gap-1 font-semibold">
                          <Eye className="w-3.5 h-3.5" /> 放大檢視相片
                        </span>
                        <span className="text-[10px] text-slate-300 font-mono">Temuka & Beyond</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Content & Metadata */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    {/* Location Badge */}
                    <div className="flex items-center gap-1.5 text-xs text-rose-300 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>{moment.location}</span>
                    </div>

                    {/* Story Text */}
                    <p className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed whitespace-pre-line">
                      {moment.titleOrEvent}
                    </p>

                    {/* Companions */}
                    {moment.companions && moment.companions.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap pt-1 text-[11px] text-slate-400">
                        <Users className="w-3 h-3" />
                        <span>同行：</span>
                        {moment.companions.map((comp, cIdx) => (
                          <span key={cIdx} className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700/80 text-slate-300">
                            {comp}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Mum Handwritten-style Quote Note */}
                  {moment.mumReaction?.encouragement ? (
                    <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-600/40 text-xs space-y-1 mt-2">
                      <div className="flex items-center justify-between text-amber-300 font-bold">
                        <span className="flex items-center gap-1.5">
                          <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                          <span>媽媽的回憶手札</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {moment.mumReaction.reactedAt || '已備存'}
                        </span>
                      </div>
                      <p className="text-slate-200 italic leading-relaxed pl-5 font-sans">
                        “{moment.mumReaction.encouragement}”
                      </p>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span>媽媽已標記為精選展品</span>
                      </span>
                      <span className="text-emerald-400 font-mono">+{moment.xpAwarded} XP 已入帳</span>
                    </div>
                  )}
                </div>

                {/* Footer Golden Bar */}
                <div className="px-5 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1 text-amber-300">
                    <Sparkles className="w-3 h-3" />
                    <span>第 1 章 · 典藏編號 #{moment.id.slice(-4)}</span>
                  </span>
                  <span className="text-emerald-400">已自動備份</span>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {activePhotoModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActivePhotoModal(null)}
        >
          <div
            className="relative max-w-3xl max-h-[85vh] rounded-3xl overflow-hidden border border-amber-400/50 shadow-2xl bg-slate-900"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setActivePhotoModal(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-950/80 text-white flex items-center justify-center text-sm font-bold z-10 hover:bg-rose-600 transition-colors"
            >
              ✕
            </button>
            <img
              src={activePhotoModal}
              alt="Enlarged moment"
              className="max-h-[80vh] w-auto object-contain mx-auto"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

    </div>
  );

  if (onClose) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-750 rounded-3xl p-4 sm:p-6 shadow-2xl">
          {bodyContent}
        </div>
      </div>
    );
  }

  return bodyContent;
};
