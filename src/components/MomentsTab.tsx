import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Role, SharedMoment, MomentMood } from '../types';
import { sounds } from '../utils/sound';
import { ScrapbookPreview } from './ScrapbookPreview';
import {
  Camera,
  Mic,
  Palette,
  Heart,
  Sparkles,
  MapPin,
  Users,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Award,
  BookOpen,
  Filter,
  Plus,
  Send,
  Volume2,
  Calendar,
  X,
  Star,
  Check,
  Layers
} from 'lucide-react';

interface MomentsTabProps {
  activeRole: Role;
  sharedMoments: SharedMoment[];
  onSubmitMoment: (momentData: Omit<SharedMoment, 'id' | 'submittedAt' | 'dateStr' | 'xpAwarded' | 'coinsAwarded' | 'aiReview'>) => void;
  onMumReact?: (momentId: string, liked: boolean, comment?: string, extraBonus?: boolean, bookmark?: boolean) => void;
}

export const MomentsTab: React.FC<MomentsTabProps> = ({
  activeRole,
  sharedMoments,
  onSubmitMoment,
}) => {
  const isYounger = activeRole === 'sister_younger';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form states
  const [isCreating, setIsCreating] = useState(false);
  const [eventText, setEventText] = useState('');
  const [locationText, setLocationText] = useState('');
  const [selectedCompanions, setSelectedCompanions] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<MomentMood>('😍');
  const [evidenceType, setEvidenceType] = useState<'photo' | 'voice' | 'drawing' | undefined>(undefined);
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [voiceRecorded, setVoiceRecorded] = useState<boolean>(false);
  const [drawingNote, setDrawingNote] = useState<string>('');
  const [filterRole, setFilterRole] = useState<'all' | 'sister_younger' | 'sister_older' | 'bookmarked'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'feed' | 'scrapbook'>('feed');

  // Bookmarked moments for Scrapbook
  const bookmarkedCount = sharedMoments.filter(m => m.mumReaction?.bookmarkedForScrapbook).length;

  // Companion options based on language
  const companionOptions = [
    '👩 Grandma',
    '👴 Grandpa',
    '👧 Cousin (Girl)',
    '👦 Cousin (Boy)',
    '🎒 Friends / Classmates',
    '👤 Other',
  ];

  const moodOptions: MomentMood[] = ['😍', '😮', '😅', '🤩', '😌'];

  // Check today's submission count for current role
  const todayDateStr = new Date().toISOString().split('T')[0];
  const userTodayMoments = sharedMoments.filter(
    m => m.userId === activeRole && m.dateStr === todayDateStr
  );
  const todayCount = userTodayMoments.length;
  const isLimitReached = todayCount >= 3;

  // AI Duplicate Detection: Check similarity with recent shares (within 7 days)
  const recentUserShares = sharedMoments.filter(m => m.userId === activeRole);
  const duplicateWarning = React.useMemo(() => {
    if (!eventText.trim() || eventText.length < 5) return null;
    const lower = eventText.toLowerCase();

    for (const past of recentUserShares) {
      const pastLower = past.titleOrEvent.toLowerCase();
      // Check significant keyword overlap
      const sharedWords = ['auntie', 'christchurch', '表妹', '畫畫', '散步', '公園', 'domain', 'holiday park'];
      let matchCount = 0;
      for (const w of sharedWords) {
        if (lower.includes(w) && pastLower.includes(w)) matchCount++;
      }

      if (matchCount >= 2 || (lower.includes('auntie') && pastLower.includes('auntie'))) {
        return {
          pastDate: past.dateStr,
          pastText: past.titleOrEvent,
        };
      }
    }
    return null;
  }, [eventText, recentUserShares]);

  // AI "First Time" Detection
  const isFirstTimeBreakthrough = React.useMemo(() => {
    const lower = (eventText + ' ' + locationText).toLowerCase();
    return lower.includes('第一次') || lower.includes('first time') || lower.includes('首次') || lower.includes('自己一個人搭');
  }, [eventText, locationText]);

  const handleToggleCompanion = (comp: string) => {
    sounds.playTap();
    if (selectedCompanions.includes(comp)) {
      setSelectedCompanions(selectedCompanions.filter(c => c !== comp));
    } else {
      setSelectedCompanions([...selectedCompanions, comp]);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    sounds.playTap();
    const reader = new FileReader();
    reader.onload = uploadEvent => {
      setPhotoDataUrl(uploadEvent.target?.result as string);
      setEvidenceType('photo');
    };
    reader.readAsDataURL(file);
  };

  const handleSimulatePhoto = () => {
    sounds.playTap();
    // High quality sample photo of Christchurch / Temuka family outing
    setPhotoDataUrl('https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=600&q=80');
    setEvidenceType('photo');
  };

  const handleSimulateVoice = () => {
    sounds.playTap();
    setVoiceRecorded(true);
    setEvidenceType('voice');
  };

  const handleSimulateDrawing = () => {
    sounds.playTap();
    setDrawingNote('🎨 日漫手繪草稿：與表妹創作的可愛漫畫角色');
    setEvidenceType('drawing');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventText.trim() || !locationText.trim()) {
      setToastMessage(isYounger ? '請填寫「係咩事」同「喺邊度」呀～' : 'Please fill in what happened and where!');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (isLimitReached) {
      setToastMessage(isYounger ? '今日已達 3 次分享上限，留返聽日再記錄生活點滴啦～' : 'Daily limit of 3 moments reached for today!');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    sounds.playFanfare();
    confetti({ particleCount: 70, spread: 60 });

    onSubmitMoment({
      userId: activeRole,
      titleOrEvent: eventText.trim(),
      location: locationText.trim(),
      companions: selectedCompanions.length > 0 ? selectedCompanions : [isYounger ? '自己' : 'Myself'],
      mood: selectedMood,
      evidenceType: photoDataUrl ? 'photo' : voiceRecorded ? 'voice' : drawingNote ? 'drawing' : undefined,
      photoUrl: photoDataUrl || undefined,
      voiceNoteUrl: voiceRecorded ? 'simulated_voice_note.m4a' : undefined,
      drawingDataUrl: drawingNote || undefined,
    });

    // Reset form
    setEventText('');
    setLocationText('');
    setSelectedCompanions([]);
    setSelectedMood('😍');
    setEvidenceType(undefined);
    setPhotoDataUrl('');
    setVoiceRecorded(false);
    setDrawingNote('');
    setIsCreating(false);

    setToastMessage(
      isYounger
        ? '🎉 成功分享！獲得 +20 XP 與 +8 金幣！已存入生活回憶冊素材庫～'
        : '🎉 Moment shared successfully! Earned +20 XP and +8 Coins!'
    );
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filter moments
  const filteredMoments = sharedMoments.filter(m => {
    if (filterRole === 'bookmarked') return m.mumReaction?.bookmarkedForScrapbook;
    if (filterRole === 'sister_younger') return m.userId === 'sister_younger';
    if (filterRole === 'sister_older') return m.userId === 'sister_older';
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 bg-amber-500 text-slate-950 rounded-2xl font-bold text-xs flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="cursor-pointer font-black ml-2">✕</button>
        </div>
      )}

      {/* Top Navigation Switcher: Moments Feed vs Scrapbook Preview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-2 rounded-2xl border border-slate-700/80 shadow-md">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sounds.playTap();
              setActiveSubTab('feed');
            }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'feed'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>📸 Moments Feed</span>
          </button>

          <button
            onClick={() => {
              sounds.playTap();
              setActiveSubTab('scrapbook');
            }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'scrapbook'
                ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 shadow-lg font-extrabold'
                : 'text-amber-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>📖 Chapter 1 Scrapbook</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-950/40 text-amber-200 border border-amber-400/30">
              {bookmarkedCount} entries · Drive synced
            </span>
          </button>
        </div>

        {activeSubTab === 'feed' ? (
          <div className="text-xs text-slate-400 px-2 flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Moments sync · Max 3 posts daily</span>
          </div>
        ) : (
          <div className="text-xs text-amber-400/90 px-2 font-mono flex items-center gap-1.5">
            <span>Google Drive connected</span>
          </div>
        )}
      </div>

      {/* Conditional Subtab View */}
      {activeSubTab === 'scrapbook' ? (
        <ScrapbookPreview
          moments={sharedMoments}
          activeRole={activeRole}
        />
      ) : (
        <>
          {/* Header Banner */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                  <Camera className="w-4 h-4" />
                  <span>📸 Share a Moment · Life Highlights</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
                  Capture Everyday Moments &amp; Outings
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Everyday moments around Temuka, trips with Grandma, drawing in the garden, or visiting relatives—share a quick photo and note for the family memory book.
                </p>
              </div>

              {/* Quick Action Button & Daily Limit Meter */}
              <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                <button
                  onClick={() => {
                    sounds.playTap();
                    setIsCreating(!isCreating);
                  }}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  {isCreating ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{isCreating ? 'Close' : 'Share a Moment'}</span>
                </button>

                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                  <span>Shared today:</span>
                  <strong className={todayCount >= 3 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {todayCount} / 3 posts
                  </strong>
                  {todayCount >= 3 && <span className="text-[10px] text-rose-400">(Max reached)</span>}
                </div>
              </div>
            </div>

            {/* Feature Comparison Notice */}
            <div className="mt-5 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Guide: </strong>"First Time" = milestone events (+50~200 XP). "Share a Moment" = daily photos, outings, and projects (+20 XP +8 Coins).
                </span>
              </div>
              <button
                onClick={() => {
                  sounds.playTap();
                  setActiveSubTab('scrapbook');
                }}
                className="text-amber-300 hover:text-white underline text-xs font-semibold cursor-pointer"
              >
                View Chapter 1 Scrapbook ({bookmarkedCount} entries) →
              </button>
            </div>
          </div>

      {/* Creation Modal / Form Card */}
      {isCreating && (
        <div className="bg-slate-850 border border-amber-500/40 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white font-['Outfit']">
                {isYounger ? '📸 今日我想分享⋯⋯' : '📸 Share a Moment'}
              </h2>
            </div>
            <button
              onClick={() => setIsCreating(false)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* 1. What happened */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span>📝 What happened?</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  e.g. Grandma took us to Christchurch for the weekend.
                </span>
              </label>
              <textarea
                rows={2}
                value={eventText}
                onChange={e => setEventText(e.target.value)}
                placeholder="Describe what happened, where you went, or what you created..."
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* AI Duplicate Detection Warning */}
            {duplicateWarning && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-600/50 text-xs space-y-1 text-amber-200">
                <div className="font-bold flex items-center gap-1.5 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>AI Comparison Note:</span>
                </div>
                <p>
                  You shared a similar event on <strong className="font-mono text-white">{duplicateWarning.pastDate}</strong> ("{duplicateWarning.pastText.slice(0, 25)}..."). Feel free to add any new details!
                </p>
              </div>
            )}

            {/* AI "First Time" Upgrade Suggestion */}
            {isFirstTimeBreakthrough && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/60 text-xs space-y-1 text-amber-200">
                <div className="font-bold flex items-center gap-1.5 text-amber-300">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>🌟 First Time Achievement Detected!</span>
                </div>
                <p>
                  This appears to be a brand new milestone! Milestone bonus applied.
                </p>
              </div>
            )}

            {/* 2. Where */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200">
                📍 Where?
              </label>
              <input
                type="text"
                value={locationText}
                onChange={e => setLocationText(e.target.value)}
                placeholder="e.g. Murray St backyard / Temuka Domain / Christchurch"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* 3. With Whom */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200">
                👥 With whom?
              </label>
              <div className="flex flex-wrap gap-2">
                {companionOptions.map(comp => {
                  const isSelected = selectedCompanions.includes(comp);
                  return (
                    <button
                      key={comp}
                      type="button"
                      onClick={() => handleToggleCompanion(comp)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                          : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      {comp}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Evidence (Photo / Voice / Drawing) */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">
                  📸 Evidence (+5 XP &amp; +3 Coins)
                </span>
                <span className="text-[11px] text-slate-400">Photo · Audio · Drawing</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    evidenceType === 'photo'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span className="text-xs">Add Photo</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={handleSimulateVoice}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    evidenceType === 'voice'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  <span className="text-xs">{voiceRecorded ? 'Voice Recorded' : 'Voice'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSimulateDrawing}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    evidenceType === 'drawing'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Palette className="w-4 h-4" />
                  <span className="text-xs">{drawingNote ? 'Drawing Added' : 'Drawing'}</span>
                </button>
              </div>

              {/* Photo preview or quick sample */}
              {photoDataUrl && (
                <div className="relative w-36 h-28 rounded-xl overflow-hidden border border-amber-400/50 mt-2">
                  <img src={photoDataUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoDataUrl('');
                      setEvidenceType(undefined);
                    }}
                    className="absolute top-1 right-1 w-5 h-5 bg-slate-950/80 text-white rounded-full flex items-center justify-center text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}

              {!photoDataUrl && (
                <button
                  type="button"
                  onClick={handleSimulatePhoto}
                  className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                >
                  📷 Use sample Temuka Domain / Christchurch photo
                </button>
              )}
            </div>

            {/* 5. Mood Selection */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-slate-200">
                😄 Mood?
              </label>
              <div className="flex items-center gap-3">
                {moodOptions.map(mood => (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      setSelectedMood(mood);
                    }}
                    className={`w-11 h-11 rounded-2xl text-xl flex items-center justify-center transition-transform cursor-pointer ${
                      selectedMood === mood
                        ? 'bg-amber-500/30 border-2 border-amber-400 scale-110 shadow-lg'
                        : 'bg-slate-900 border border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Reward: <strong className="text-amber-400 font-mono">{evidenceType ? '+20 XP · +8 🪙' : '+15 XP · +5 🪙'}</strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!eventText.trim() || !locationText.trim()}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl shadow cursor-pointer transition-transform active:scale-95 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Moment</span>
                </button>
              </div>
            </div>

          </form>
        </div>
      )}

      {/* Filter and Timeline Feed Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold text-white font-['Outfit']">
            Moments Feed
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            ({sharedMoments.length} entries)
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-850 p-1 rounded-xl border border-slate-700 text-xs overflow-x-auto">
          <button
            onClick={() => {
              sounds.playTap();
              setFilterRole('all');
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterRole === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => {
              sounds.playTap();
              setFilterRole('sister_younger');
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterRole === 'sister_younger'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            👧 Jasmine
          </button>
          <button
            onClick={() => {
              sounds.playTap();
              setFilterRole('sister_older');
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterRole === 'sister_older'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            👩 Jessie
          </button>
          <button
            onClick={() => {
              sounds.playTap();
              setFilterRole('bookmarked');
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterRole === 'bookmarked'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⭐ Scrapbook Picks
          </button>
        </div>
      </div>

      {/* Feed List */}
      <div className="space-y-4">
        {filteredMoments.length === 0 ? (
          <div className="p-8 text-center bg-slate-850/60 rounded-3xl border border-slate-800 text-slate-400 space-y-2">
            <Camera className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm">No shared moments yet. Click "Share a Moment" to log a photo or note!</p>
          </div>
        ) : (
          filteredMoments.map(moment => {
            const isYoungerAuthor = moment.userId === 'sister_younger';
            const authorName = isYoungerAuthor ? 'Jasmine' : 'Jessie';
            const hasMumBonus = moment.mumReaction?.extraXp;

            return (
              <div
                key={moment.id}
                className="p-5 sm:p-6 rounded-3xl bg-slate-800/90 border border-slate-700/80 space-y-4 shadow-lg transition-all hover:border-slate-600"
              >
                {/* Author, Date & Mood Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{isYoungerAuthor ? '🕵️‍♀️' : '🦊'}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{authorName}</span>
                        <span className="text-xl" title="Mood">{moment.mood}</span>
                        {moment.mumReaction?.bookmarkedForScrapbook && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-300" />
                            Scrapbook Pick
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-mono">{moment.dateStr} {moment.submittedAt}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-slate-300 font-medium">
                          <MapPin className="w-3 h-3 text-rose-400" />
                          {moment.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-emerald-400">
                      +{moment.xpAwarded} XP · +{moment.coinsAwarded} 🪙
                    </div>
                    {hasMumBonus && (
                      <div className="text-[10px] text-amber-400 font-mono">
                        Mum bonus +{moment.mumReaction?.extraXp} XP
                      </div>
                    )}
                  </div>
                </div>

                {/* Main Content & Companions */}
                <div className="space-y-2">
                  <p className="text-sm text-slate-100 leading-relaxed font-sans font-medium whitespace-pre-line">
                    {moment.titleOrEvent}
                  </p>

                  {/* Companion tags */}
                  {moment.companions && moment.companions.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Users className="w-3 h-3" /> With:
                      </span>
                      {moment.companions.map((comp, cIdx) => (
                        <span
                          key={cIdx}
                          className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700/80 text-[11px] text-slate-300"
                        >
                          {comp}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Photo / Voice Note / Drawing Evidence Display */}
                {moment.photoUrl && (
                  <div className="rounded-2xl overflow-hidden border border-slate-700/80 max-h-72 bg-slate-950">
                    <img
                      src={moment.photoUrl}
                      alt="Moment evidence"
                      className="w-full h-full object-cover max-h-72"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                {moment.voiceNoteUrl && !moment.photoUrl && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 flex items-center gap-3 text-xs text-slate-200">
                    <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>🎙️ Voice Note synced to Drive</span>
                  </div>
                )}

                {moment.drawingDataUrl && !moment.photoUrl && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-amber-800/40 text-xs text-amber-200 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-amber-400" />
                    <span>{moment.drawingDataUrl}</span>
                  </div>
                )}

                {/* AI Review Status Pill */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-700/50 pt-2.5">
                  <div className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{moment.aiReview.feedbackMessage || 'Verified'}</span>
                  </div>

                  {/* Mum Heart / Encouragement Card */}
                  {moment.mumReaction?.liked && (
                    <div className="flex items-center gap-1 text-rose-400 font-bold">
                      <Heart className="w-3.5 h-3.5 fill-rose-400" />
                      <span>Mum Liked</span>
                    </div>
                  )}
                </div>

                {/* Mum Reply Card if present */}
                {moment.mumReaction?.encouragement && (
                  <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-700/40 text-xs space-y-1">
                    <div className="flex items-center justify-between text-amber-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                        <span>Mum's Note</span>
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {moment.mumReaction.reactedAt}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed pl-5">
                      {moment.mumReaction.encouragement}
                    </p>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>
        </>
      )}

    </div>
  );
};
