import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Role, DailyReflection } from '../types';
import { sounds } from '../utils/sound';
import {
  Moon,
  Sparkles,
  Heart,
  Smile,
  Mic,
  MicOff,
  Send,
  Languages,
  CheckCircle2,
  Award,
  Volume2
} from 'lucide-react';

interface ReflectionTabProps {
  activeRole: Role;
  reflections: DailyReflection[];
  onSubmitReflection: (reflection: Omit<DailyReflection, 'id' | 'submittedAt'>) => void;
}

export const ReflectionTab: React.FC<ReflectionTabProps> = ({
  activeRole,
  reflections,
  onSubmitReflection,
}) => {
  const [language, setLanguage] = useState<'zh' | 'en'>('en');
  const [mood, setMood] = useState<'joyful' | 'curious' | 'peaceful' | 'tired' | 'excited'>('joyful');
  const [happyText, setHappyText] = useState('');
  const [meaningfulText, setMeaningfulText] = useState('');
  const [hardOrLearnedText, setHardOrLearnedText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVoiceNote, setRecordedVoiceNote] = useState<string | null>(null);

  const myReflections = reflections.filter(r => r.userId === activeRole);

  const handleToggleVoice = () => {
    sounds.playTap();
    if (!isRecording) {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setRecordedVoiceNote('voice_reflection_' + Date.now() + '.webm');
        sounds.playClueFound();
      }, 3500);
    } else {
      setIsRecording(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!happyText.trim() && !meaningfulText.trim()) return;

    sounds.playCorrect();
    sounds.playFanfare();
    confetti({ particleCount: 70, spread: 70 });

    onSubmitReflection({
      date: new Date().toISOString().split('T')[0],
      userId: activeRole,
      language,
      highlightHappy: happyText,
      highlightMeaningful: meaningfulText,
      highlightHard: hardOrLearnedText,
      mood,
      hasAudioClip: !!recordedVoiceNote,
      audioNoteUrl: recordedVoiceNote || undefined,
    });

    setHappyText('');
    setMeaningfulText('');
    setHardOrLearnedText('');
    setRecordedVoiceNote(null);
  };

  const moodsList = [
    { key: 'joyful' as const, label: '✨ Happy', emoji: '😄' },
    { key: 'curious' as const, label: '🔍 Curious', emoji: '🧐' },
    { key: 'excited' as const, label: '⚡ Excited', emoji: '🤩' },
    { key: 'peaceful' as const, label: '💛 Peaceful', emoji: '😌' },
    { key: 'tired' as const, label: '😴 Tired', emoji: '🥱' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      
      {/* Header Banner */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-400">
              <Moon className="w-4 h-4 text-purple-400" />
              <span>Daily Reflection</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
              Evening Reflection
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Three quick notes or a voice recording about what happened today. Mum reviews and leaves comments from Hong Kong.
            </p>
          </div>

          {/* Language Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-700">
            <button
              onClick={() => {
                sounds.playTap();
                setLanguage('en');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                language === 'en'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Languages className="w-3.5 h-3.5" />
              <span>🇬🇧 English</span>
            </button>
            <button
              onClick={() => {
                sounds.playTap();
                setLanguage('zh');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                language === 'zh'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Languages className="w-3.5 h-3.5" />
              <span>🇨🇳 中文</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reflection Form */}
      <form onSubmit={handleSubmit} className="bg-slate-850 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        
        {/* Mood Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300">
            {language === 'zh' ? '選擇今日心情：' : 'Today\'s Mood:'}
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {moodsList.map(m => (
              <button
                key={m.key}
                type="button"
                onClick={() => {
                  sounds.playTap();
                  setMood(m.key);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border cursor-pointer flex items-center gap-1.5 ${
                  mood === m.key
                    ? 'bg-purple-500/20 border-purple-400 text-purple-300 font-bold ring-1 ring-purple-400'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{m.emoji}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Question 1: Happy */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>
              {language === 'zh' ? '✨ 今日最開心／最興奮嘅一件事：' : '✨ Best / Most Exciting Moment Today:'}
            </span>
          </label>
          <textarea
            value={happyText}
            onChange={e => setHappyText(e.target.value)}
            placeholder={
              language === 'zh'
                ? '例：在 Temuka Domain 散步時看到鴨子，下午吃了點心...'
                : 'e.g. Cleared all 10 math questions quickly, and had a great walk outside...'
            }
            rows={2}
            className="w-full p-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-400"
            required
          />
        </div>

        {/* Question 2: Meaningful */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
            <Heart className="w-4 h-4" />
            <span>
              {language === 'zh' ? '💛 今日一件有意義嘅事：' : '💛 Something Meaningful Today:'}
            </span>
          </label>
          <textarea
            value={meaningfulText}
            onChange={e => setMeaningfulText(e.target.value)}
            placeholder={
              language === 'zh'
                ? '例：幫 Grandpa 一起打理後院花草...'
                : 'e.g. Helped Grandma water the outdoor plants...'
            }
            rows={2}
            className="w-full p-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-400"
            required
          />
        </div>

        {/* Question 3: Hard or Learned */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
            <Smile className="w-4 h-4" />
            <span>
              {language === 'zh' ? '🧠 今日最難／學到嘅一件事：' : '🧠 Hardest Part or Key Thing Learned:'}
            </span>
          </label>
          <textarea
            value={hardOrLearnedText}
            onChange={e => setHardOrLearnedText(e.target.value)}
            placeholder={
              language === 'zh'
                ? '例：數學第 8 題有向數計算卡住了，重新看解題步驟後做對了。'
                : 'e.g. Figured out the geometry question after checking the marking scheme...'
            }
            rows={2}
            className="w-full p-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-400"
          />
        </div>

        {/* Audio Note Option */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-colors ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse'
                  : recordedVoiceNote
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {isRecording ? <Mic className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <div>
              <div className="text-xs font-bold text-white">
                {isRecording
                  ? 'Recording voice note (auto-saves in 3s)...'
                  : recordedVoiceNote
                  ? 'Voice note attached (12s audio)'
                  : 'Voice Note for Mum (Optional)'}
              </div>
              <div className="text-[11px] text-slate-400">
                Mum can listen to your voice note from Hong Kong.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleVoice}
            className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg cursor-pointer"
          >
            {isRecording ? 'Stop' : recordedVoiceNote ? 'Re-record' : 'Record Audio'}
          </button>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex items-center justify-between">
          <span className="text-xs text-amber-300 font-mono">
            Reward: +50 XP · +15 Coins
          </span>

          <button
            type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer active:scale-95 transition-transform flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Submit Reflection</span>
          </button>
        </div>

      </form>

      {/* Past Reflections & Mum Feedback */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
          <span>Past Reflections &amp; Mum's Notes ({myReflections.length})</span>
        </h2>

        <div className="space-y-4">
          {myReflections.map(ref => (
            <div key={ref.id} className="bg-slate-850 border border-slate-700/80 rounded-3xl p-6 space-y-4 shadow-md">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-700/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white font-mono">{ref.date}</span>
                  <span>·</span>
                  <span className="text-purple-300">{ref.language === 'zh' ? '🇨🇳 中文' : '🇬🇧 English'}</span>
                </div>
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Recorded
                </span>
              </div>

              <div className="space-y-2 text-xs sm:text-sm text-slate-200">
                <p><span className="text-amber-300 font-bold">✨ Best: </span>{ref.highlightHappy}</p>
                <p><span className="text-rose-300 font-bold">💛 Meaningful: </span>{ref.highlightMeaningful}</p>
                {ref.highlightHard && (
                  <p><span className="text-emerald-300 font-bold">🧠 Challenge / Learned: </span>{ref.highlightHard}</p>
                )}
              </div>

              {/* Mum Reply Stamp */}
              {ref.mumReply ? (
                <div className="mt-4 p-4 rounded-2xl bg-amber-950/30 border border-amber-800/40 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>Mum's Note · {ref.mumReply.mumBadge}</span>
                    </span>
                    <span className="font-mono text-slate-400 text-[11px]">{ref.mumReply.repliedAt}</span>
                  </div>
                  <p className="text-xs text-amber-100/90 leading-relaxed font-medium">
                    {ref.mumReply.replyText}
                  </p>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic">
                  Awaiting review from Mum.
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
