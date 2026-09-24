import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  UserProfile,
  DailyMissionSummary,
  DailyReflection,
  RedemptionRecord,
  MoveState,
  SyllabusUnit,
  SharedMoment,
  MathAnswerLog,
  MumGMSettings,
  SecuritySettings
} from '../types';
import { sounds } from '../utils/sound';
import { ScrapbookPreview } from './ScrapbookPreview';
import {
  formatMathAnswerLogsCsv,
  generateWeakStrongSummaryJson,
  generateProgressTrackerJson,
  uploadFileToDrive,
  downloadFileLocally,
  googleSignIn,
  getAccessToken
} from '../services/googleDriveService';
import {
  Shield,
  Send,
  Heart,
  Award,
  CheckCircle2,
  Clock,
  ThumbsUp,
  MapPin,
  Sparkles,
  Check,
  EyeOff,
  UserCheck,
  GraduationCap,
  BookOpen,
  Compass,
  AlertTriangle,
  Camera,
  Star,
  Users,
  MessageCircle,
  Bookmark,
  Lock,
  KeyRound,
  ShieldCheck,
  Smartphone,
  Languages,
  FolderTree,
  FileSpreadsheet,
  Download,
  UploadCloud,
  Sliders,
  RefreshCw,
  Zap,
  Flame,
  CheckSquare,
  Square,
  Gift,
  Footprints,
  FileText
} from 'lucide-react';

interface MumDashboardTabProps {
  profiles: Record<'sister_older' | 'sister_younger' | 'mum', UserProfile>;
  dailyMissions: Record<'sister_older' | 'sister_younger', DailyMissionSummary[]>;
  moveStates: Record<'sister_older' | 'sister_younger', MoveState>;
  reflections: DailyReflection[];
  redemptions: RedemptionRecord[];
  syllabusUnits: Record<'sister_older' | 'sister_younger', SyllabusUnit[]>;
  sharedMoments: SharedMoment[];
  mathAnswerLogs: MathAnswerLog[];
  mumGMSettings: MumGMSettings;
  security?: SecuritySettings;
  onUpdateMumGMSettings?: (updated: Partial<MumGMSettings>) => void;
  onUpdateSecurity?: (updated: Partial<SecuritySettings>) => void;
  onSendMumMission: (missionTitle: string, description: string, recipient: 'sister_older' | 'sister_younger' | 'both') => void;
  onReplyReflection: (reflectionId: string, replyText: string, badge: string) => void;
  onApproveRedemption: (redemptionId: string, feedback: string) => void;
  onMumReactMoment?: (momentId: string, liked: boolean, comment?: string, extraBonus?: boolean, bookmark?: boolean) => void;
  onToggleUnitComplete?: (role: 'sister_older' | 'sister_younger', unitId: string) => void;
}

export const MumDashboardTab: React.FC<MumDashboardTabProps> = ({
  profiles,
  dailyMissions,
  moveStates,
  reflections,
  redemptions,
  syllabusUnits,
  sharedMoments,
  mathAnswerLogs = [],
  mumGMSettings,
  security,
  onUpdateMumGMSettings,
  onUpdateSecurity,
  onSendMumMission,
  onReplyReflection,
  onApproveRedemption,
  onMumReactMoment,
  onToggleUnitComplete,
}) => {
  // 1. Language Toggle: Default Chinese ('zh') with toggle to English ('en')
  const [lang, setLang] = useState<'zh' | 'en'>(() => mumGMSettings?.dashboardLanguage || 'zh');

  // 2. Active Tab in Mum Dashboard
  const [activeMumTab, setActiveMumTab] = useState<'math_analytics' | 'gm_settings' | 'missions' | 'reflections' | 'moments' | 'redemptions'>('math_analytics');

  // 3. Curriculum & Maths Target Daughter Tab
  const [targetDaughter, setTargetDaughter] = useState<'sister_younger' | 'sister_older'>('sister_younger');

  // 4. Security Settings Form State
  const [securityForm, setSecurityForm] = useState<SecuritySettings>(() => ({
    pinProtectionEnabled: security?.pinProtectionEnabled ?? true,
    mumPin: security?.mumPin ?? '8888',
    jessiePin: security?.jessiePin ?? '5678',
    jasminePin: security?.jasminePin ?? '1234',
    lockedDeviceRole: security?.lockedDeviceRole ?? null,
  }));
  const [securitySavedNotice, setSecuritySavedNotice] = useState(false);

  // 5. GM Settings local state
  const [gmConfig, setGmConfig] = useState<MumGMSettings>(() => ({
    ...mumGMSettings,
    dashboardLanguage: lang,
  }));
  const [gmSavedNotice, setGmSavedNotice] = useState(false);
  const [updateCheckStatus, setUpdateCheckStatus] = useState<string | null>(null);

  // 6. Google Drive Sync State
  const [driveSyncing, setDriveSyncing] = useState(false);
  const [driveSyncNotice, setDriveSyncNotice] = useState<string | null>(null);

  // 7. Mum Mission Form
  const [newMissionTitle, setNewMissionTitle] = useState('');
  const [newMissionDesc, setNewMissionDesc] = useState('');
  const [missionRecipient, setMissionRecipient] = useState<'sister_older' | 'sister_younger' | 'both'>('both');

  // 8. Reflection Reply Modal / Active selection
  const [activeReplyRefId, setActiveReplyRefId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [chosenBadge, setChosenBadge] = useState('🌟 媽媽的超級誇獎星');

  // 9. Moments Reply / Interaction State
  const [activeReplyMomentId, setActiveReplyMomentId] = useState<string | null>(null);
  const [momentCommentText, setMomentCommentText] = useState('');
  const [showScrapbookPreview, setShowScrapbookPreview] = useState(false);

  // 10. Redemption approval note
  const [approvalNotes, setApprovalNotes] = useState<Record<string, string>>({});

  const isZh = lang === 'zh';

  // Toggle Language handler
  const handleToggleLanguage = () => {
    sounds.playTap();
    const nextLang = lang === 'zh' ? 'en' : 'zh';
    setLang(nextLang);
    onUpdateMumGMSettings?.({ dashboardLanguage: nextLang });
  };

  // Mum Mission submit
  const handleSendMission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMissionTitle.trim()) return;

    sounds.playCorrect();
    confetti({ particleCount: 60, spread: 60 });
    onSendMumMission(newMissionTitle, newMissionDesc, missionRecipient);

    setNewMissionTitle('');
    setNewMissionDesc('');
  };

  // Reflection reply submit
  const handleConfirmReply = (refId: string) => {
    if (!replyText.trim()) return;
    sounds.playCorrect();
    onReplyReflection(refId, replyText, chosenBadge);
    setActiveReplyRefId(null);
    setReplyText('');
  };

  // Redemption approval submit
  const handleApprove = (redemptionId: string) => {
    sounds.playCoin();
    const feedback = approvalNotes[redemptionId] || (isZh ? '媽媽在香港批准了你的獎勵申請！繼續加油！❤️' : 'Approved from Hong Kong with love! Well done! ❤️');
    onApproveRedemption(redemptionId, feedback);
  };

  // Save Security Settings
  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playCorrect();
    onUpdateSecurity?.(securityForm);
    setSecuritySavedNotice(true);
    setTimeout(() => setSecuritySavedNotice(false), 3500);
  };

  // Save GM Settings
  const handleSaveGmConfig = () => {
    sounds.playCorrect();
    onUpdateMumGMSettings?.(gmConfig);
    setGmSavedNotice(true);
    setTimeout(() => setGmSavedNotice(false), 3500);
  };

  // Check Cloud Updates
  const handleCheckCloudUpdates = () => {
    sounds.playTap();
    setUpdateCheckStatus(isZh ? '正在連線至雲端題庫伺服器...' : 'Connecting to cloud syllabus server...');
    setTimeout(() => {
      setUpdateCheckStatus(
        isZh
          ? '✅ 已是最新版本！已同步：2026 香港名校期考真題題庫 (v2026.09) 及 Temuka 偵探第四章案情。'
          : '✅ Up to date! Synchronized: 2026 HK Exam Paper Bank (v2026.09) and Temuka Case Chapter 4.'
      );
      sounds.playCoin();
      setTimeout(() => setUpdateCheckStatus(null), 5000);
    }, 1200);
  };

  // Google Drive Manual Sync
  const handleSyncToDrive = async () => {
    sounds.playTap();
    setDriveSyncing(true);
    setDriveSyncNotice(null);

    try {
      let token = await getAccessToken();
      if (!token) {
        const signResult = await googleSignIn();
        token = signResult?.accessToken || null;
      }

      const activeDaughterZh = targetDaughter === 'sister_younger' ? '妹妹' : '姐姐';
      const formFolder = targetDaughter === 'sister_younger' ? 'Sister_Form1' : 'Sister_Form3';

      const csvContent = formatMathAnswerLogsCsv(mathAnswerLogs);
      const weakStrongJson = JSON.stringify(
        generateWeakStrongSummaryJson(mathAnswerLogs, activeDaughterZh),
        null,
        2
      );
      const progressJson = JSON.stringify(
        generateProgressTrackerJson(
          syllabusUnits[targetDaughter],
          targetDaughter === 'sister_younger' ? 'Form 1' : 'Form 3'
        ),
        null,
        2
      );

      // Upload files to Drive
      await uploadFileToDrive(
        `2026-09_${formFolder}.csv`,
        csvContent,
        'text/csv',
        `/RealLifeAdventureGame/Maths/${formFolder}/`
      );
      await uploadFileToDrive(
        `weak_strong_summary_${formFolder}.json`,
        weakStrongJson,
        'application/json',
        `/RealLifeAdventureGame/Maths/${formFolder}/`
      );
      await uploadFileToDrive(
        `progress_tracker_${formFolder}.json`,
        progressJson,
        'application/json',
        `/RealLifeAdventureGame/Maths/${formFolder}/`
      );

      sounds.playFanfare();
      confetti({ particleCount: 50, spread: 60 });
      setDriveSyncNotice(
        isZh
          ? `✅ 成功寫入 Google Drive！目錄：/RealLifeAdventureGame/Maths/${formFolder}/`
          : `✅ Successfully synced to Google Drive: /RealLifeAdventureGame/Maths/${formFolder}/`
      );
    } catch (err: any) {
      console.error(err);
      setDriveSyncNotice(
        isZh
          ? `⚠️ Google Drive 同步提示：${err.message || '請確認授權或直接點擊下方本地下載'}`
          : `⚠️ Google Drive Sync: ${err.message || 'Please authorize or use local download below'}`
      );
    } finally {
      setDriveSyncing(false);
    }
  };

  // Export Local CSV
  const handleExportCsv = () => {
    sounds.playTap();
    const formFolder = targetDaughter === 'sister_younger' ? 'Sister_Form1' : 'Sister_Form3';
    const csvContent = formatMathAnswerLogsCsv(mathAnswerLogs);
    downloadFileLocally(`2026-09_${formFolder}.csv`, csvContent, 'text/csv');
  };

  // Export Local Weak Strong JSON
  const handleExportWeakStrongJson = () => {
    sounds.playTap();
    const activeDaughterZh = targetDaughter === 'sister_younger' ? '妹妹' : '姐姐';
    const formFolder = targetDaughter === 'sister_younger' ? 'Sister_Form1' : 'Sister_Form3';
    const data = generateWeakStrongSummaryJson(mathAnswerLogs, activeDaughterZh);
    downloadFileLocally(
      `weak_strong_summary_${formFolder}.json`,
      JSON.stringify(data, null, 2),
      'application/json'
    );
  };

  // Export Local Progress JSON
  const handleExportProgressJson = () => {
    sounds.playTap();
    const formFolder = targetDaughter === 'sister_younger' ? 'Sister_Form1' : 'Sister_Form3';
    const data = generateProgressTrackerJson(
      syllabusUnits[targetDaughter],
      targetDaughter === 'sister_younger' ? 'Form 1' : 'Form 3'
    );
    downloadFileLocally(
      `progress_tracker_${formFolder}.json`,
      JSON.stringify(data, null, 2),
      'application/json'
    );
  };

  // Active daughter syllabus and logs
  const curSyllabus = syllabusUnits[targetDaughter] || [];
  const curDaughterZh = targetDaughter === 'sister_younger' ? '妹妹' : '姐姐';
  const curDaughterName = targetDaughter === 'sister_younger' ? 'Jasmine' : 'Jessie';
  const curFormName = targetDaughter === 'sister_younger' ? 'Form 1' : 'Form 3';

  // Analysis data for active daughter
  const weakStrongData = generateWeakStrongSummaryJson(mathAnswerLogs, curDaughterZh);

  // Group syllabus by the 3 official HK strands
  const strandsList = ['Number and Algebra', 'Measures, Shape and Space', 'Data Handling'] as const;
  const strandZhMap: Record<string, string> = {
    'Number and Algebra': '數與代數 (Number and Algebra)',
    'Measures, Shape and Space': '度量、圖形與空間 (Measures, Shape & Space)',
    'Data Handling': '數據處理 (Data Handling)',
  };

  const totalMasteredUnits = curSyllabus.filter(u => u.isCompleted || u.status === 'completed').length;
  const overallCurriculumPercent = Math.round((totalMasteredUnits / (curSyllabus.length || 1)) * 100);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      
      {/* 1. Header & Dual-Time Display */}
      <div className="bg-slate-850 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>
                {isZh
                  ? 'Game Master 控制台 · 香港 (HKT) ⇌ 紐西蘭 Temuka (NZST)'
                  : 'Game Master Console · Hong Kong (HKT) ⇌ New Zealand Temuka (NZST)'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] tracking-tight">
              {isZh ? '👑 媽媽守護看板：進度大於監控' : '👑 Mum\'s GM Console: Progress > Surveillance'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isZh
                ? '原則：Progress > Surveillance。不看即時 GPS，專注女兒的香港數學題庫掌握、Temuka 戶外探索、步數保底驚喜與獎勵審批。'
                : 'Core Principle: Progress > Surveillance. No real-time GPS tracking; focus on HK maths progress, outdoor footsteps, and family encouragement.'}
            </p>
          </div>

          {/* Language Switcher & Privacy Indicator */}
          <div className="flex flex-col items-end gap-2.5 shrink-0">
            <button
              onClick={handleToggleLanguage}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              title="Switch Dashboard Language"
            >
              <Languages className="w-4 h-4 text-amber-400" />
              <span>{isZh ? '切換為 English' : '切換為 繁體中文'}</span>
            </button>

            <div className="p-2.5 bg-slate-900/90 border border-slate-750 rounded-xl flex items-center gap-2 text-[11px] text-slate-300">
              <EyeOff className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{isZh ? '隱私保護：不顯示實時秒級 GPS' : 'Privacy: Real-time GPS disabled'}</span>
            </div>
          </div>
        </div>

        {/* Real Life Activity Zone Banner */}
        <div className="mt-5 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-750 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
            <div>
              <span className="font-bold text-white">{isZh ? 'Temuka 活動範圍：' : 'Temuka Activity Zone:'} </span>
              <span>Murray St ⇌ Princess St 溪畔步道 · Taumatakahu Stream · Temuka Domain &amp; Holiday Park · {isZh ? '最大邊界：Main Street' : 'Max boundary: Main Street'}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-amber-300 bg-amber-950/40 border border-amber-800/40 px-2.5 py-1 rounded-lg text-[11px] shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>{isZh ? '私人物業 Community Garden 不可進入' : 'Community Garden is off-limits'}</span>
          </div>
        </div>
      </div>

      {/* 2. Main Tab Navigation inside Mum Console */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => {
            sounds.playTap();
            setActiveMumTab('math_analytics');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeMumTab === 'math_analytics'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'bg-slate-850 text-slate-300 hover:text-white border border-slate-750'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>{isZh ? '🧮 每日數學與 Drive 記錄' : '🧮 Daily Maths & Drive Logs'}</span>
        </button>

        <button
          onClick={() => {
            sounds.playTap();
            setActiveMumTab('gm_settings');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeMumTab === 'gm_settings'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'bg-slate-850 text-slate-300 hover:text-white border border-slate-750'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>{isZh ? '⚙️ GM 設定控制台' : '⚙️ GM Controls & Settings'}</span>
        </button>

        <button
          onClick={() => {
            sounds.playTap();
            setActiveMumTab('missions');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeMumTab === 'missions'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'bg-slate-850 text-slate-300 hover:text-white border border-slate-750'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>{isZh ? '👑 媽媽特派任務' : '👑 Mum Missions'}</span>
        </button>

        <button
          onClick={() => {
            sounds.playTap();
            setActiveMumTab('reflections');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeMumTab === 'reflections'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'bg-slate-850 text-slate-300 hover:text-white border border-slate-750'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>{isZh ? '🌙 女兒每日反思' : '🌙 Daily Reflections'}</span>
        </button>

        <button
          onClick={() => {
            sounds.playTap();
            setActiveMumTab('moments');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeMumTab === 'moments'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'bg-slate-850 text-slate-300 hover:text-white border border-slate-750'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>{isZh ? '📸 分享時刻與回憶冊' : '📸 Moments & Scrapbook'}</span>
        </button>

        <button
          onClick={() => {
            sounds.playTap();
            setActiveMumTab('redemptions');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeMumTab === 'redemptions'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'bg-slate-850 text-slate-300 hover:text-white border border-slate-750'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>{isZh ? '🎁 獎勵兌換審批' : '🎁 Reward Approvals'}</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: 🧮 每日數學題 + Google Drive 記錄 + 強弱分析 */}
      {/* ======================================================== */}
      {activeMumTab === 'math_analytics' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Daughter Selection Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-850 p-4 rounded-2xl border border-slate-700">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <span>{isZh ? '當前審閱女兒：' : 'Selected Student:'}</span>
              <span className="text-amber-400 font-mono">{curDaughterName} ({curFormName})</span>
            </div>

            <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-750 text-xs">
              <button
                onClick={() => {
                  sounds.playTap();
                  setTargetDaughter('sister_younger');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  targetDaughter === 'sister_younger'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                👧 妹妹 Jasmine (Form 1)
              </button>
              <button
                onClick={() => {
                  sounds.playTap();
                  setTargetDaughter('sister_older');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  targetDaughter === 'sister_older'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                👩 姐姐 Jessie (Form 3)
              </button>
            </div>
          </div>

          {/* 媽媽報告「劃行」機制 (HK Curriculum Progress & Strikethrough Report) */}
          <div className="bg-slate-850 border border-slate-700 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-750 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                  <span>📋 {isZh ? `媽媽報告「劃行」機制 · ${curDaughterZh} (${curFormName}) 數學全進度` : `${curDaughterName} (${curFormName}) Maths Progress & Strikethrough`}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isZh
                    ? '✅ 已完成 · ━ 進行中 (文字帶橫線) · ☐ 未開始 · 點擊項目可手動切換狀態'
                    : '✅ Completed · ━ In Progress (with strikethrough) · ☐ Not started · Click to toggle'}
                </p>
              </div>

              <div className="flex items-center gap-3 bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-750 text-xs">
                <div className="text-slate-400">{isZh ? '整體掌握率：' : 'Overall Progress:'}</div>
                <div className="font-mono text-emerald-400 font-extrabold text-sm">{overallCurriculumPercent}%</div>
                <div className="text-slate-500 font-mono text-[11px]">{isZh ? '預計 2027 年 6 月完成' : 'Target: June 2027'}</div>
              </div>
            </div>

            {/* The 3 Strands breakdown with exact ASCII bar and strikethrough visual format */}
            <div className="space-y-4">
              {strandsList.map(strandName => {
                const unitsInStrand = curSyllabus.filter(u => u.strand === strandName);
                if (unitsInStrand.length === 0) return null;
                const completedInStrand = unitsInStrand.filter(u => u.isCompleted || u.status === 'completed');
                const percent = Math.round((completedInStrand.length / unitsInStrand.length) * 100);

                // Build ASCII bar [██████░░░░]
                const totalBlocks = 10;
                const filledBlocks = Math.round((percent / 100) * totalBlocks);
                const asciiBar = '█'.repeat(filledBlocks) + '░'.repeat(totalBlocks - filledBlocks);

                return (
                  <div key={strandName} className="bg-slate-900/90 rounded-2xl p-4 border border-slate-750 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 font-mono text-xs">
                      <div className="font-bold text-amber-300">
                        {isZh ? strandZhMap[strandName] : strandName}
                      </div>
                      <div className="flex items-center gap-2 text-slate-300 font-mono">
                        <span className="text-amber-400">[{asciiBar}]</span>
                        <span className="font-bold text-emerald-400">{percent}%</span>
                        <span className="text-slate-500 text-[11px]">({completedInStrand.length}/{unitsInStrand.length})</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {unitsInStrand.map(unit => {
                        const isDone = unit.isCompleted || unit.status === 'completed';
                        const isInProg = unit.status === 'in_progress';

                        return (
                          <div
                            key={unit.id}
                            onClick={() => onToggleUnitComplete?.(targetDaughter, unit.id)}
                            className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 transition-all cursor-pointer select-none ${
                              isDone
                                ? 'bg-slate-850/60 border-emerald-900/40 text-slate-400 hover:border-emerald-800'
                                : isInProg
                                ? 'bg-amber-950/20 border-amber-600/50 text-white shadow-sm ring-1 ring-amber-500/20'
                                : 'bg-slate-850/80 border-slate-750 text-slate-300 hover:border-slate-650'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="shrink-0 text-sm">
                                {isDone ? (
                                  <span className="text-emerald-400 font-bold">✅</span>
                                ) : isInProg ? (
                                  <span className="text-amber-400 font-bold">━</span>
                                ) : (
                                  <span className="text-slate-500">☐</span>
                                )}
                              </div>

                              <div className="truncate">
                                <div
                                  className={`truncate font-semibold ${
                                    isDone
                                      ? 'text-slate-300 font-medium'
                                      : isInProg
                                      ? 'line-through text-amber-300 decoration-amber-400 decoration-2 font-bold'
                                      : 'text-slate-300'
                                  }`}
                                >
                                  {unit.chapterNumber}. {isZh ? unit.nameZh : unit.nameEn}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                  {unit.unitCode} · {isZh ? unit.nameEn : unit.nameZh}
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0 text-right font-mono">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                                  isDone
                                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                                    : isInProg
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                                    : 'bg-slate-800 text-slate-500'
                                }`}
                              >
                                {isDone
                                  ? (isZh ? '已完成' : 'Completed')
                                  : isInProg
                                  ? (isZh ? '進行中' : 'In Progress')
                                  : (isZh ? '未開始' : 'Not started')}
                              </span>
                              <div className="text-[10px] text-slate-400 mt-1">
                                {unit.totalQuestionsMastered}/{unit.targetQuestions}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 強弱項分析 (Weak / Strong Areas Analysis) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Weak Areas */}
            <div className="bg-slate-850 border border-slate-700 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>{isZh ? '⚠️ 弱項預警 (Weak Areas)' : '⚠️ Weak Areas (Action Required)'}</span>
                </h4>
                <span className="text-[11px] text-slate-400 font-mono">
                  {isZh ? '正確率 < 60% 或作答時間過長' : 'Accuracy < 60% or slow'}
                </span>
              </div>

              {weakStrongData.weakAreas.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-900/60 text-xs text-slate-400 italic text-center">
                  {isZh ? '目前各課題掌握良好，暫無顯著弱項！' : 'No weak areas identified at present.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {weakStrongData.weakAreas.map((w, idx) => (
                    <div key={idx} className="p-3 bg-rose-950/20 border border-rose-800/40 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-white">{w.topic} ({w.topicZh})</div>
                        <div className="text-[11px] text-rose-300 mt-0.5">{w.issue}</div>
                      </div>
                      <div className="text-right font-mono text-[11px]">
                        <div className="text-rose-400 font-bold">{w.accuracy}</div>
                        <div className="text-slate-400">{w.avgTime}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-750 text-xs text-amber-200">
                <span className="font-bold text-amber-400">{isZh ? '💡 建議下一步練習：' : '💡 Suggested Practice: '}</span>
                <span>{weakStrongData.suggestedPractice}</span>
              </div>
            </div>

            {/* Strong Areas */}
            <div className="bg-slate-850 border border-slate-700 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                  <Star className="w-4 h-4 text-emerald-400" />
                  <span>{isZh ? '🌟 強項優勢 (Strong Areas)' : '🌟 Strong Areas (Mastered)'}</span>
                </h4>
                <span className="text-[11px] text-slate-400 font-mono">
                  {isZh ? '正確率 > 85% 且作答快' : 'Accuracy > 85% & Fast'}
                </span>
              </div>

              {weakStrongData.strongAreas.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-900/60 text-xs text-slate-400 italic text-center">
                  {isZh ? '持續積累答題紀錄中...' : 'Accumulating answer logs...'}
                </div>
              ) : (
                <div className="space-y-2">
                  {weakStrongData.strongAreas.map((s, idx) => (
                    <div key={idx} className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-white">{s.topic} ({s.topicZh})</div>
                        <div className="text-[11px] text-emerald-300 mt-0.5">{s.badge}</div>
                      </div>
                      <div className="text-right font-mono text-[11px]">
                        <div className="text-emerald-400 font-bold">{s.accuracy}</div>
                        <div className="text-slate-400">{s.avgTime}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-750 text-xs text-slate-300 flex items-center justify-between">
                <span>{isZh ? '累計已記錄作答題數：' : 'Total Logged Questions:'}</span>
                <span className="font-mono text-emerald-400 font-bold">{weakStrongData.totalQuestionsLogged} 題</span>
              </div>
            </div>
          </div>

          {/* Google Drive 自動寫入與檔案結構預覽 (Google Drive Auto-Sync) */}
          <div className="bg-slate-850 border border-slate-700 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-750 pb-3">
              <div>
                <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-amber-400" />
                  <span>{isZh ? 'Google Drive 自動寫入結構 (/RealLifeAdventureGame/)' : 'Google Drive Auto-Sync Structure'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isZh
                    ? '僅媽媽 Google Account 透過 OAuth 連接具備讀寫權限，女兒無直接 Access，保護個人私隱。'
                    : 'Private Google Drive folder structure. Daughter devices do not have direct access; secured by OAuth.'}
                </p>
              </div>

              {/* Action Buttons: Drive Sync & Local Export */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleSyncToDrive}
                  disabled={driveSyncing}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{driveSyncing ? (isZh ? '寫入中...' : 'Syncing...') : (isZh ? '寫入 Google Drive' : 'Sync to Drive')}</span>
                </button>

                <button
                  onClick={handleExportCsv}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                  title="Download CSV"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>2026-09.csv</span>
                </button>

                <button
                  onClick={handleExportWeakStrongJson}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                  title="Download Summary JSON"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Summary JSON</span>
                </button>
              </div>
            </div>

            {driveSyncNotice && (
              <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/40 text-xs text-amber-200 font-medium">
                {driveSyncNotice}
              </div>
            )}

            {/* Folder Tree Visual */}
            <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-750 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto">
              <div className="text-amber-400 font-bold">/RealLifeAdventureGame/</div>
              <div className="pl-4 text-slate-200">
                📁 Maths/
                <div className="pl-4 text-emerald-400">
                  📁 Sister_Form1/
                  <div className="pl-4 text-slate-400">📄 2026-09.csv</div>
                  <div className="pl-4 text-slate-400">📄 weak_strong_summary.json</div>
                  <div className="pl-4 text-slate-400">📄 progress_tracker.json</div>
                </div>
                <div className="pl-4 text-purple-400 mt-1">
                  📁 Sister_Form3/
                  <div className="pl-4 text-slate-400">📄 2026-09.csv</div>
                  <div className="pl-4 text-slate-400">📄 weak_strong_summary.json</div>
                  <div className="pl-4 text-slate-400">📄 progress_tracker.json</div>
                </div>
              </div>
              <div className="pl-4 text-slate-400 mt-1">📁 Photos/</div>
              <div className="pl-4 text-slate-400">📁 Reflections/</div>
              <div className="pl-4 text-slate-400">📁 FirstTimes/</div>
              <div className="pl-4 text-slate-400">📁 ShareMoments/</div>
              <div className="pl-4 text-slate-400">📁 Backups/ (2026-09 / 2026-10)</div>
            </div>
          </div>

          {/* 答題歷史記錄表 (Real-time Answer Log Table) */}
          <div className="bg-slate-850 border border-slate-700 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-750 pb-3">
              <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                <span>{isZh ? '每次答題實時流水記錄 (Answer Logs)' : 'Real-time Answer Log Stream'}</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {isZh ? '自動寫入 Google Drive 數據源' : 'Direct feed for Google Drive CSV'}
              </span>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-750 text-slate-400 text-[11px] font-mono">
                    <th className="pb-2 pr-3">Date</th>
                    <th className="pb-2 pr-3">Daughter</th>
                    <th className="pb-2 pr-3">Q-ID</th>
                    <th className="pb-2 pr-3">Topic (中英對照)</th>
                    <th className="pb-2 pr-3">Skill</th>
                    <th className="pb-2 pr-3">Result</th>
                    <th className="pb-2 pr-3">Time</th>
                    <th className="pb-2 pr-3">Attempts</th>
                    <th className="pb-2 pr-3">Difficulty</th>
                    <th className="pb-2 pr-3">Source</th>
                    <th className="pb-2">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {mathAnswerLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/50">
                      <td className="py-2.5 pr-3 font-mono text-slate-400">{log.date || log.dateStr}</td>
                      <td className="py-2.5 pr-3 font-bold text-white">{log.daughter}</td>
                      <td className="py-2.5 pr-3 font-mono text-amber-400">{log.questionId}</td>
                      <td className="py-2.5 pr-3">
                        <div className="font-medium text-slate-200">{log.topic || log.topicEn}</div>
                        <div className="text-[10px] text-slate-400">{log.topicZh}</div>
                      </td>
                      <td className="py-2.5 pr-3">
                        <div className="text-slate-300">{log.skill || log.skillEn}</div>
                        <div className="text-[10px] text-slate-400">{log.skillZh}</div>
                      </td>
                      <td className="py-2.5 pr-3 font-mono">
                        {log.isCorrect ? (
                          <span className="text-emerald-400 font-bold">✓ Correct</span>
                        ) : (
                          <span className="text-rose-400 font-bold">✗ Wrong</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-slate-300">{log.timeSpentSeconds}s</td>
                      <td className="py-2.5 pr-3 font-mono text-slate-400">{log.attempts}</td>
                      <td className="py-2.5 pr-3">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            log.difficulty === 'Hard'
                              ? 'bg-rose-500/20 text-rose-300'
                              : log.difficulty === 'Medium'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {log.difficulty}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-slate-400 text-[11px]">{log.source}</td>
                      <td className="py-2.5 text-slate-300 text-[11px] max-w-xs truncate">{log.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: ⚙️ GM 設定控制台 (GM Settings: Missions, Rewards, Maths, Walking, System) */}
      {/* ======================================================== */}
      {activeMumTab === 'gm_settings' && (
        <div className="space-y-6 animate-in fade-in duration-200">

          {/* Section A: 任務設定 (Mission Settings) */}
          <div className="bg-slate-850 border border-slate-700 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-750 pb-3">
              <h3 className="text-sm sm:text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
                <Send className="w-4 h-4 text-amber-400" />
                <span>{isZh ? '1. 任務設定 (Chore & Family Missions)' : '1. Mission & Chore Settings'}</span>
              </h3>
              <span className="text-xs text-slate-400">
                {isZh ? '家務、家庭幸運抽獎池與 Mum Mission' : 'Family missions & lucky pool'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">{isZh ? '祖父母家務任務發布時間' : 'Mission Schedule'}</label>
                <input
                  type="text"
                  value="每天早上 08:00 (NZST)"
                  readOnly
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl p-2.5 text-slate-300 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">{isZh ? 'Family Lucky Draw 抽獎池' : 'Lucky Draw Pool'}</label>
                <input
                  type="text"
                  value="週末自選外賣晚餐 · 奇異果園野餐日 · 免一次收拾特權"
                  readOnly
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl p-2.5 text-slate-300"
                />
              </div>
            </div>
          </div>

          {/* Section B: 獎勵設定 (Reward Settings) */}
          <div className="bg-slate-850 border border-slate-700 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-750 pb-3">
              <h3 className="text-sm sm:text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-400" />
                <span>{isZh ? '2. 獎勵設定 (Reward Catalog & Rates)' : '2. Reward Catalog & Rates'}</span>
              </h3>
              <span className="text-xs text-slate-400">
                {isZh ? '金幣定價、XP 兌換率與神秘寶盒' : 'Pricing & mystery pool'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">{isZh ? 'XP 升級比例 (Base)' : 'XP Level Multiplier'}</label>
                <div className="p-2.5 bg-slate-900 border border-slate-750 rounded-xl font-mono text-amber-400">
                  1.3x Per Level (Lv.7 需 1000 XP)
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">{isZh ? 'Lucky Ticket 抽中金幣機率' : 'Ticket Win Rate'}</label>
                <div className="p-2.5 bg-slate-900 border border-slate-750 rounded-xl font-mono text-emerald-400">
                  {gmConfig.walkingSurpriseProbability || 35}% (保底加權)
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">{isZh ? '每日金幣兌換上限' : 'Daily Reward Cap'}</label>
                <div className="p-2.5 bg-slate-900 border border-slate-750 rounded-xl font-mono text-slate-200">
                  3 次兌換 / 每人每日
                </div>
              </div>
            </div>
          </div>

          {/* Section C: 數學設定 (Maths Settings) */}
          <div className="bg-slate-850 border border-slate-700 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-750 pb-3">
              <h3 className="text-sm sm:text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>{isZh ? '3. 數學設定 (Maths Difficulty & Challenges)' : '3. Maths Settings & Toggles'}</span>
              </h3>
              <span className="text-xs text-slate-400">
                {isZh ? '每日題數、Speed Challenge 與 BOSS 題' : 'Daily count, speed & boss'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">{isZh ? '每日數學題數 (預設 10 題)' : 'Daily Questions Count'}</label>
                <select
                  value={gmConfig.mathDailyCount}
                  onChange={e => setGmConfig(prev => ({ ...prev, mathDailyCount: Number(e.target.value) }))}
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl p-2.5 text-white font-mono"
                >
                  <option value={5}>5 題 (輕鬆適應)</option>
                  <option value={10}>10 題 (香港課程標準預設)</option>
                  <option value={15}>15 題 (強化衝刺)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">{isZh ? 'Speed Challenge 速算限時' : 'Speed Challenge'}</label>
                <select
                  value={gmConfig.speedChallengeEnabled ? 'true' : 'false'}
                  onChange={e => setGmConfig(prev => ({ ...prev, speedChallengeEnabled: e.target.value === 'true' }))}
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl p-2.5 text-white font-mono"
                >
                  <option value="true">{isZh ? '✅ 開啟 (姐姐 5 分鐘計時 +10 金幣)' : '✅ Enabled (Jessie 5-min timer)'}</option>
                  <option value="false">{isZh ? '❌ 關閉' : '❌ Disabled'}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">{isZh ? '第 10 題 BOSS 題終極考驗' : 'BOSS Question'}</label>
                <select
                  value={gmConfig.bossQuestionEnabled ? 'true' : 'false'}
                  onChange={e => setGmConfig(prev => ({ ...prev, bossQuestionEnabled: e.target.value === 'true' }))}
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl p-2.5 text-white font-mono"
                >
                  <option value="true">{isZh ? '✅ 開啟 (涵蓋名校壓軸挑戰題)' : '✅ Enabled (Authentic HK Exam Finale)'}</option>
                  <option value="false">{isZh ? '❌ 關閉' : '❌ Disabled'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section D: 步行設定 (Walking Settings) */}
          <div className="bg-slate-850 border border-slate-700 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-750 pb-3">
              <h3 className="text-sm sm:text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
                <Footprints className="w-4 h-4 text-emerald-400" />
                <span>{isZh ? '4. 步行設定 (Walking Targets & Pity Mechanism)' : '4. Walking Targets & Surprises'}</span>
              </h3>
              <span className="text-xs text-slate-400">
                {isZh ? '隨機驚喜機率、每日驚喜上限與保底' : 'Random surprise & pity cap'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">{isZh ? '妹妹每日步數目標' : 'Jasmine Step Target'}</label>
                <input
                  type="number"
                  value={gmConfig.dailyStepTargetYounger}
                  onChange={e => setGmConfig(prev => ({ ...prev, dailyStepTargetYounger: Number(e.target.value) }))}
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">{isZh ? '姐姐每日步數目標' : 'Jessie Step Target'}</label>
                <input
                  type="number"
                  value={gmConfig.dailyStepTargetOlder}
                  onChange={e => setGmConfig(prev => ({ ...prev, dailyStepTargetOlder: Number(e.target.value) }))}
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">{isZh ? '隨機驚喜機率 (%)' : 'Surprise Rate (%)'}</label>
                <input
                  type="number"
                  value={gmConfig.walkingSurpriseProbability}
                  onChange={e => setGmConfig(prev => ({ ...prev, walkingSurpriseProbability: Number(e.target.value) }))}
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">{isZh ? '保底步數 (必出驚喜)' : 'Pity Guarantee Steps'}</label>
                <input
                  type="number"
                  value={gmConfig.pityGuaranteedSteps}
                  onChange={e => setGmConfig(prev => ({ ...prev, pityGuaranteedSteps: Number(e.target.value) }))}
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl p-2.5 text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section E: 系統設定與自動更新 (System & Auto-Update) */}
          <div className="bg-slate-850 border border-slate-700 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-750 pb-3">
              <h3 className="text-sm sm:text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-cyan-400" />
                <span>{isZh ? '5. 系統設定與 App 自動更新 (System & Cloud Sync)' : '5. System & Auto-Update'}</span>
              </h3>
              <span className="text-xs text-slate-400">
                {isZh ? '雲端題庫、Wi-Fi 備份與版本控制' : 'Question bank & Wi-Fi sync'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-750 space-y-2">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>{isZh ? '雲端內容與題庫自動更新' : 'Auto Cloud Update'}</span>
                  <input
                    type="checkbox"
                    checked={gmConfig.autoUpdateEnabled}
                    onChange={e => setGmConfig(prev => ({ ...prev, autoUpdateEnabled: e.target.checked }))}
                    className="w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  {isZh
                    ? 'Wi-Fi 連接時自動下載最新香港真題、Temuka 戶外偵探案件與新獎勵，無需女兒手動更新。'
                    : 'Automatically downloads new Hong Kong maths exam questions and detective chapters over Wi-Fi.'}
                </p>
                <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>{isZh ? '題庫版本：' : 'Bank Version:'} <strong className="text-amber-400">{gmConfig.cloudQuestionBankVersion}</strong></span>
                  <button
                    onClick={handleCheckCloudUpdates}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-amber-300 rounded border border-slate-700 cursor-pointer font-sans"
                  >
                    {isZh ? '檢查更新' : 'Check Now'}
                  </button>
                </div>
                {updateCheckStatus && (
                  <div className="p-2 bg-slate-850 rounded border border-amber-500/40 text-[11px] text-amber-300 font-medium">
                    {updateCheckStatus}
                  </div>
                )}
              </div>

              <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-750 space-y-2">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>{isZh ? 'Wi-Fi Only Sync (僅 Wi-Fi 同步)' : 'Wi-Fi Only Sync'}</span>
                  <input
                    type="checkbox"
                    checked={gmConfig.wifiOnlySync}
                    onChange={e => setGmConfig(prev => ({ ...prev, wifiOnlySync: e.target.checked }))}
                    className="w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  {isZh
                    ? '節省紐西蘭流動數據，在戶外離線暫存於 localStorage，回到家連線 Wi-Fi 時一次過安全同步。'
                    : 'Saves New Zealand mobile data. Caches offline actions and syncs safely once connected to Wi-Fi.'}
                </p>
                <div className="pt-2 text-[11px] font-mono text-slate-400">
                  <span>{isZh ? 'Google Drive 備份頻率：' : 'Drive Backup:'} <strong>{gmConfig.backupFrequency || 'Daily (每日)'}</strong></span>
                </div>
              </div>
            </div>

            {/* Save GM Config Button */}
            <div className="pt-2 flex items-center justify-end gap-3">
              {gmSavedNotice && (
                <span className="text-xs text-emerald-400 font-medium animate-in fade-in">
                  ✓ {isZh ? 'Game Master 設定已成功儲存！' : 'GM Settings saved successfully!'}
                </span>
              )}
              <button
                onClick={handleSaveGmConfig}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow"
              >
                {isZh ? '儲存 GM 控制台設定' : 'Save GM Settings'}
              </button>
            </div>
          </div>

          {/* Section F: 女兒帳戶 PIN 與防偷換帳號設置 (PIN Security) */}
          <div className="bg-slate-850 border border-slate-700 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-750 pb-3">
              <h3 className="text-sm sm:text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{isZh ? '6. 女兒帳戶密碼與防作弊防偷換設置' : '6. Daughter PIN & Anti-Cheating Lock'}</span>
              </h3>
              <span className="text-xs text-slate-400">
                {isZh ? '防止偷登入妹妹帳戶做簡單題目' : 'Prevents switching to easier questions'}
              </span>
            </div>

            <form onSubmit={handleSaveSecurity} className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-750">
                <div>
                  <div className="font-bold text-white">{isZh ? '啟用角色切換 PIN 密碼保護' : 'Enable Role Switch PIN Protection'}</div>
                  <div className="text-[11px] text-slate-400">{isZh ? '切換任何帳戶時必須輸入對應 4 位數字密碼' : 'Requires 4-digit passcode upon switching roles'}</div>
                </div>
                <input
                  type="checkbox"
                  checked={securityForm.pinProtectionEnabled}
                  onChange={e => setSecurityForm(prev => ({ ...prev, pinProtectionEnabled: e.target.checked }))}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">{isZh ? '媽媽專用 PIN (預設 8888)' : 'Mum PIN (Default 8888)'}</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={securityForm.mumPin}
                    onChange={e => setSecurityForm(prev => ({ ...prev, mumPin: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-750 rounded-xl p-2.5 text-white font-mono tracking-widest text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">{isZh ? '姐姐 Jessie PIN (預設 5678)' : 'Jessie PIN (Default 5678)'}</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={securityForm.jessiePin}
                    onChange={e => setSecurityForm(prev => ({ ...prev, jessiePin: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-750 rounded-xl p-2.5 text-white font-mono tracking-widest text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">{isZh ? '妹妹 Jasmine PIN (預設 1234)' : 'Jasmine PIN (Default 1234)'}</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={securityForm.jasminePin}
                    onChange={e => setSecurityForm(prev => ({ ...prev, jasminePin: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-750 rounded-xl p-2.5 text-white font-mono tracking-widest text-center"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                {securitySavedNotice && (
                  <span className="text-xs text-emerald-400 font-medium animate-in fade-in">
                    ✓ {isZh ? '密碼安全設置已儲存生效！' : 'PIN Security updated successfully!'}
                  </span>
                )}
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 rounded-xl font-bold text-xs cursor-pointer"
                >
                  {isZh ? '更新防偷登入密碼' : 'Update Security PINs'}
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: 👑 媽媽特派任務 (Mum Missions) */}
      {/* ======================================================== */}
      {activeMumTab === 'missions' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-slate-850 border border-slate-700 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
              <Send className="w-5 h-5 text-amber-400" />
              <span>{isZh ? '發布全新【媽媽特派任務】(Mum Mission Dispatch)' : 'Dispatch New Mum Mission'}</span>
            </h3>
            <p className="text-xs text-slate-400">
              {isZh
                ? '在香港自訂特派任務，直接同步至紐西蘭女兒的每日任務列表中（獎勵高達 +90 XP · +30 🪙）！'
                : 'Custom mission dispatched directly from Hong Kong to daughter mission lists.'}
            </p>

            <form onSubmit={handleSendMission} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-slate-300 font-bold">{isZh ? '任務標題 (可用中文)' : 'Mission Title'}</label>
                  <input
                    type="text"
                    placeholder={isZh ? '例：幫嫲嫲整理廚房新鮮蔬菜、拍攝 Taumatakahu 溪畔野花' : 'e.g. Help grandma arrange fresh vegetables'}
                    value={newMissionTitle}
                    onChange={e => setNewMissionTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-750 rounded-xl p-3 text-white font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">{isZh ? '指派對象' : 'Recipient'}</label>
                  <select
                    value={missionRecipient}
                    onChange={e => setMissionRecipient(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-750 rounded-xl p-3 text-white font-mono"
                  >
                    <option value="both">{isZh ? '兩姐妹共同 (+30 🪙 各自)' : 'Both Sisters'}</option>
                    <option value="sister_younger">👧 妹妹 Jasmine (Form 1)</option>
                    <option value="sister_older">👩 姐姐 Jessie (Form 3)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">{isZh ? '任務詳情與媽媽叮囑' : 'Instructions & Encouragement'}</label>
                <textarea
                  rows={3}
                  placeholder={isZh ? '寫低具體做法，或者想女兒拍攝咩照片給媽媽看...' : 'Write instructions or photo requests...'}
                  value={newMissionDesc}
                  onChange={e => setNewMissionDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl p-3 text-white font-medium resize-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newMissionTitle.trim()}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow"
                >
                  <Send className="w-4 h-4" />
                  <span>{isZh ? '發布媽媽特派任務' : 'Dispatch Mission'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: 🌙 女兒每日反思回覆 (Daily Reflections) */}
      {/* ======================================================== */}
      {activeMumTab === 'reflections' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-slate-850 border border-slate-700 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-750 pb-3">
              <div>
                <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-amber-400" />
                  <span>{isZh ? '女兒每日雙語反思與心聲 (Daily Reflections)' : 'Daughters\' Daily Reflections'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isZh
                    ? '女兒可以用英文回覆，媽媽可以用中文留言回覆，App 不強迫任何一邊轉語言。'
                    : 'Daughters reflect in English, Mum replies in Chinese. Natural bilingual family communication.'}
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">共 {reflections.length} 篇反思紀錄</span>
            </div>

            <div className="space-y-4">
              {reflections.map(ref => {
                const authorName = ref.userId === 'sister_younger' ? 'Jasmine (妹妹)' : 'Jessie (姐姐)';
                return (
                  <div key={ref.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-750 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-bold text-white">
                        <span>{ref.userId === 'sister_younger' ? '👧' : '👩'} {authorName}</span>
                        <span className="text-slate-400 font-mono text-[11px]">{ref.date} ({ref.submittedAt})</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-mono text-[11px]">
                        心情：{ref.mood}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-300">
                      <div className="p-2.5 bg-slate-850 rounded-xl">
                        <div className="text-[10px] text-emerald-400 font-bold">✨ 今日最開心：</div>
                        <div className="mt-1">{ref.highlightHappy}</div>
                      </div>
                      <div className="p-2.5 bg-slate-850 rounded-xl">
                        <div className="text-[10px] text-amber-400 font-bold">❤️ 有感覺的事：</div>
                        <div className="mt-1">{ref.highlightMeaningful}</div>
                      </div>
                      <div className="p-2.5 bg-slate-850 rounded-xl">
                        <div className="text-[10px] text-purple-400 font-bold">💪 辛苦/學到嘅事：</div>
                        <div className="mt-1">{ref.highlightHard}</div>
                      </div>
                    </div>

                    {/* Mum's Existing Reply */}
                    {ref.mumReply ? (
                      <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200">
                        <div className="font-bold text-amber-400 flex items-center justify-between">
                          <span>💌 媽媽的回覆 ({ref.mumReply.mumBadge}) · {ref.mumReply.repliedAt}</span>
                        </div>
                        <div className="mt-1 leading-relaxed">{ref.mumReply.replyText}</div>
                      </div>
                    ) : (
                      <div>
                        {activeReplyRefId === ref.id ? (
                          <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 space-y-2.5 animate-in fade-in">
                            <textarea
                              rows={2}
                              placeholder={isZh ? '寫低媽媽溫暖的鼓勵留言（可用中文，女兒睇到中文）...' : 'Write an encouraging message in Chinese...'}
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-750 rounded-lg p-2 text-xs text-white resize-none"
                            />
                            <div className="flex items-center justify-between">
                              <select
                                value={chosenBadge}
                                onChange={e => setChosenBadge(e.target.value)}
                                className="bg-slate-900 border border-slate-750 rounded-lg px-2 py-1 text-xs text-amber-300"
                              >
                                <option value="🌟 媽媽的超級誇獎星">🌟 媽媽的超級誇獎星</option>
                                <option value="🌸 溫暖守護愛心勳章">🌸 溫暖守護愛心勳章</option>
                                <option value="👑 獨立成長先鋒徽章">👑 獨立成長先鋒徽章</option>
                              </select>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => setActiveReplyRefId(null)}
                                  className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                                >
                                  取消
                                </button>
                                <button
                                  onClick={() => handleConfirmReply(ref.id)}
                                  className="px-3 py-1 bg-amber-500 text-slate-950 rounded-lg font-bold text-xs cursor-pointer"
                                >
                                  傳送回覆
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              sounds.playTap();
                              setActiveReplyRefId(ref.id);
                              setReplyText('');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-500/30 text-xs font-medium cursor-pointer"
                          >
                            💬 回覆女兒心聲 (+徽章)
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: 📸 分享時刻與回憶冊 (Moments & Scrapbook) */}
      {/* ======================================================== */}
      {activeMumTab === 'moments' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-slate-850 border border-slate-700 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-750 pb-3">
              <div>
                <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
                  <Camera className="w-5 h-5 text-amber-400" />
                  <span>{isZh ? '紐西蘭生活足跡 · 分享時刻與影像審查' : 'Temuka Footprints & Shared Moments'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isZh
                    ? '兩姐妹在 Temuka 與 Christchurch 記錄的生活片段，媽媽可點讚、書籤入冊並同步至 Google Drive。'
                    : 'Photos and memories from Temuka & Christchurch. Curate and sync to Google Drive.'}
                </p>
              </div>

              <button
                onClick={() => setShowScrapbookPreview(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
              >
                <BookOpen className="w-4 h-4" />
                <span>{isZh ? '預覽家庭回憶冊 (第一章)' : 'Preview Family Memory Book'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sharedMoments.map(m => {
                const author = m.userId === 'sister_younger' ? 'Jasmine (妹妹)' : 'Jessie (姐姐)';
                return (
                  <div key={m.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-750 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <span>{m.userId === 'sister_younger' ? '👧' : '👩'}</span>
                          <span>{author}</span>
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">{m.dateStr}</span>
                      </div>

                      {m.photoUrl && (
                        <div className="rounded-xl overflow-hidden aspect-video bg-slate-950 border border-slate-800">
                          <img src={m.photoUrl} alt="Moment" className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="text-xs text-slate-200 leading-relaxed font-medium">
                        {m.titleOrEvent}
                      </div>

                      <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 bg-slate-850 px-2 py-0.5 rounded">
                          <MapPin className="w-3 h-3 text-rose-400" />
                          <span>{m.location}</span>
                        </span>
                        <span>心情：{m.mood}</span>
                        {m.companions?.length > 0 && <span>同行：{m.companions.join(', ')}</span>}
                      </div>
                    </div>

                    {/* Mum Reaction Bar */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      {m.mumReaction?.liked ? (
                        <span className="text-rose-400 font-bold flex items-center gap-1 text-[11px]">
                          <Heart className="w-3.5 h-3.5 fill-current" />
                          <span>媽媽已點讚愛心 (+10 XP)</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            sounds.playCoin();
                            onMumReactMoment?.(m.id, true, undefined, true, true);
                          }}
                          className="px-3 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Heart className="w-3.5 h-3.5" />
                          <span>點讚 + 送金幣 (+5🪙)</span>
                        </button>
                      )}

                      {m.mumReaction?.bookmarkedForScrapbook && (
                        <span className="text-amber-400 font-mono text-[10px] flex items-center gap-1">
                          <Bookmark className="w-3 h-3 fill-current" />
                          <span>已收錄回憶冊</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: 🎁 獎勵兌換審批 (Reward Approvals) */}
      {/* ======================================================== */}
      {activeMumTab === 'redemptions' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-slate-850 border border-slate-700 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-750 pb-3">
              <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-400" />
                <span>{isZh ? '女兒獎勵兌換審批申請清單' : 'Reward Redemption Approvals'}</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                待審核：{redemptions.filter(r => r.status === 'pending_gm').length} 件
              </span>
            </div>

            <div className="space-y-3">
              {redemptions.map(rec => {
                const isPending = rec.status === 'pending_gm';
                const requester = rec.userId === 'sister_younger' ? 'Jasmine (妹妹)' : 'Jessie (姐姐)';
                return (
                  <div
                    key={rec.id}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                      isPending
                        ? 'bg-amber-950/20 border-amber-600/50 text-white'
                        : 'bg-slate-900 border-slate-750 text-slate-300'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-bold">
                        <span>{requester}</span>
                        <span className="text-amber-400">兌換：{rec.rewardTitle}</span>
                        <span className="text-slate-400 font-mono">(-{rec.cost} 🪙)</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        申請時間：{rec.requestedAt} · 狀態：
                        <strong className={isPending ? 'text-amber-400' : 'text-emerald-400'}>
                          {isPending ? '待媽媽批准' : '媽媽已批准 ✓'}
                        </strong>
                      </div>
                      {rec.gmFeedback && (
                        <div className="text-[11px] text-emerald-300 italic">
                          "{rec.gmFeedback}"
                        </div>
                      )}
                    </div>

                    {isPending && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleApprove(rec.id)}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow"
                        >
                          <Check className="w-4 h-4" />
                          <span>批准申請</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Scrapbook Chapter 1 Preview */}
      {showScrapbookPreview && (
        <ScrapbookPreview
          moments={sharedMoments}
          onClose={() => setShowScrapbookPreview(false)}
        />
      )}

    </div>
  );
};
