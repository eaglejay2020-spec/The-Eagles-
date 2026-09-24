import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Role, AdventureQuest, AdventureCheckpoint } from '../types';
import { ASSET_IMAGES } from '../data/initialData';
import { sounds } from '../utils/sound';
import {
  Compass,
  FileSearch,
  Camera,
  Key,
  Shield,
  CheckCircle2,
  Lock,
  Sparkles,
  Trophy,
  Users,
  Eye,
  Send,
  AlertTriangle
} from 'lucide-react';

interface AdventureTabProps {
  activeRole: Role;
  quests: AdventureQuest[];
  onCompleteCheckpoint: (questId: string, checkpointId: string, photoUrl?: string, note?: string) => void;
  onClaimTreasure: (questId: string) => void;
}

export const AdventureTab: React.FC<AdventureTabProps> = ({
  activeRole,
  quests,
  onCompleteCheckpoint,
  onClaimTreasure,
}) => {
  const isYounger = activeRole === 'sister_younger';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filter available quests for active role or co-op
  const availableQuests = quests.filter(
    q => q.targetRole === activeRole || q.targetRole === 'both'
  );

  const [selectedQuestId, setSelectedQuestId] = useState<string>(
    availableQuests[0]?.id || quests[0]?.id
  );

  const activeQuest = quests.find(q => q.id === selectedQuestId) || quests[0];

  // Active checkpoint for submission modal
  const [activeCheckpoint, setActiveCheckpoint] = useState<AdventureCheckpoint | null>(null);
  const [cipherInput, setCipherInput] = useState('');
  const [textEvidenceInput, setTextEvidenceInput] = useState('');
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string>('');
  const [cipherError, setCipherError] = useState(false);

  const handleOpenCheckpoint = (cp: AdventureCheckpoint) => {
    sounds.playTap();
    setActiveCheckpoint(cp);
    setCipherInput('');
    setTextEvidenceInput(cp.userNote || '');
    setCapturedPhotoUrl(cp.photoDataUrl || '');
    setCipherError(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    sounds.playTap();
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setCapturedPhotoUrl(uploadEvent.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSimulatePhoto = () => {
    sounds.playTap();
    // Use fallback high-res generated asset
    setCapturedPhotoUrl(ASSET_IMAGES.adventureMap);
  };

  const handleSubmitEvidence = () => {
    if (!activeCheckpoint) return;

    // Check cipher verification if needed
    if (activeCheckpoint.verificationType === 'cipher') {
      if (cipherInput.trim() !== activeCheckpoint.cipherAnswer?.trim()) {
        sounds.playTap();
        setCipherError(true);
        return;
      }
    }

    sounds.playCorrect();
    onCompleteCheckpoint(
      activeQuest.id,
      activeCheckpoint.id,
      capturedPhotoUrl,
      textEvidenceInput || (activeCheckpoint.verificationType === 'cipher' ? `Solved cipher: ${cipherInput}` : 'Completed field task')
    );

    setActiveCheckpoint(null);

    // Check if this was the last checkpoint
    const updatedCheckpoints = activeQuest.checkpoints.map(cp =>
      cp.id === activeCheckpoint.id ? { ...cp, isCompleted: true } : cp
    );
    const allDone = updatedCheckpoints.every(cp => cp.isCompleted);

    if (allDone) {
      sounds.playChestOpen();
      confetti({ particleCount: 90, spread: 80 });
      onClaimTreasure(activeQuest.id);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      
      {/* Header Banner */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
              {isYounger ? (
                <>
                  <FileSearch className="w-4 h-4" />
                  <span>Detective Case File · Temuka</span>
                </>
              ) : (
                <>
                  <Compass className="w-4 h-4" />
                  <span>Outdoor Landmark Treasure Hunt · Temuka</span>
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
              {isYounger ? 'Clue → Evidence → Cipher → Solution' : 'Clue → Bearing → Measurement → Unlock'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              {isYounger
                ? 'Search along Murray St, Princess St, Taumatakahu Stream Walkway and Temuka Domain. Stay outside the Community Garden fence!'
                : 'Use Temuka Domain and stream walkways to observe landmark angles and measure coordinates.'}
            </p>
          </div>

          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-amber-500/30 shrink-0 shadow-lg">
            <img
              src={ASSET_IMAGES.adventureMap}
              alt="Adventure Map"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Real Life Temuka Location & Safe Boundary Info Card */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Exploration Area: Temuka Walkways &amp; Domain</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-300 bg-rose-950/40 border border-rose-800/40 px-2.5 py-0.5 rounded-lg text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Strict Rule: Community Garden CANNOT be entered (path only) · Max limit: Main Street</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-300 flex flex-wrap gap-x-4 gap-y-1 font-medium">
            <span>📍 <strong>Murray St</strong> (starting point)</span>
            <span>📍 <strong>Princess St</strong> (creek junction)</span>
            <span>📍 <strong>Taumatakahu Stream</strong> walkway</span>
            <span>📍 <strong>Allan Jones Walkway</strong></span>
            <span>📍 <strong>Temuka Domain</strong> (historic trees)</span>
            <span>📍 <strong>Holiday Park</strong> (grounds boundary)</span>
            <span>📍 <strong>Main Street</strong> (maximum distance boundary)</span>
          </div>
        </div>

        {/* Quest Tabs */}
        <div className="mt-6 pt-5 border-t border-slate-700/60 flex items-center gap-2 overflow-x-auto">
          {availableQuests.map(quest => (
            <button
              key={quest.id}
              onClick={() => {
                sounds.playTap();
                setSelectedQuestId(quest.id);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-2 border ${
                selectedQuestId === quest.id
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                  : 'bg-slate-900/60 hover:bg-slate-750 text-slate-300 border-slate-700'
              }`}
            >
              {quest.category === 'detective_case' ? (
                <FileSearch className="w-3.5 h-3.5" />
              ) : quest.category === 'co_op_mystery' ? (
                <Users className="w-3.5 h-3.5" />
              ) : (
                <Compass className="w-3.5 h-3.5" />
              )}
              <span>{quest.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Detective Suspects Brief */}
      {activeQuest.caseBrief && (
        <div className="bg-slate-850 border border-amber-900/40 rounded-3xl p-6 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <FileSearch className="w-4 h-4" />
              <span>Case Item: 【{activeQuest.caseBrief.mysteryItem}】</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              3 Persons of Interest Statements
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {activeQuest.caseBrief.suspects.map((suspect, sIdx) => (
              <div key={sIdx} className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-700/60 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{suspect.name}</span>
                  {suspect.isSuspect ? (
                    <span className="text-[10px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-700/60">
                      Primary Suspect
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Alibi Verified</span>
                  )}
                </div>
                <p className="text-slate-400 leading-snug">
                  <span className="text-slate-300">Habit: </span>{suspect.trait}
                </p>
                <p className="text-slate-400 leading-snug">
                  <span className="text-slate-300">Alibi: </span>{suspect.alibi}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Checkpoints Flow */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center justify-between">
          <span>Checkpoints</span>
          <span className="text-xs font-mono text-slate-400">
            Reward: +{activeQuest.xpReward} XP &amp; +{activeQuest.coinsReward} Coins
          </span>
        </h2>

        <div className="space-y-3">
          {activeQuest.checkpoints.map((cp, idx) => {
            const isDone = cp.isCompleted;
            const canStart = idx === 0 || activeQuest.checkpoints[idx - 1].isCompleted;

            return (
              <div
                key={cp.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isDone
                    ? 'bg-slate-800/90 border-emerald-900/60'
                    : canStart
                    ? 'bg-slate-800/90 border-amber-500/40 shadow-lg shadow-amber-500/5'
                    : 'bg-slate-850/40 border-slate-800 opacity-60'
                }`}
              >
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-amber-400 text-xs font-bold font-mono flex items-center justify-center border border-slate-700">
                      {cp.stepNumber}
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      {cp.title}
                    </h3>
                  </div>

                  {/* Hint */}
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60 text-xs text-amber-200/90 font-mono">
                    <span className="font-bold text-amber-400">🔍 Clue Hint: </span> {cp.hint}
                  </div>

                  <p className="text-xs text-slate-300">
                    <span className="font-semibold text-slate-200">Field Task: </span>{cp.taskPrompt}
                  </p>

                  {cp.userNote && (
                    <div className="text-xs text-emerald-300/90 bg-emerald-950/30 p-2 rounded-lg border border-emerald-800/40">
                      ✅ Evidence Log: {cp.userNote}
                    </div>
                  )}
                </div>

                {/* Right Action */}
                <div className="shrink-0 self-end sm:self-center">
                  {isDone ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-800/60">
                      <CheckCircle2 className="w-4 h-4" />
                      Completed
                    </span>
                  ) : canStart ? (
                    <button
                      onClick={() => handleOpenCheckpoint(cp)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow cursor-pointer transition-transform active:scale-95 flex items-center gap-1.5"
                    >
                      <span>Submit Clue</span>
                      {cp.verificationType === 'photo' ? (
                        <Camera className="w-3.5 h-3.5" />
                      ) : (
                        <Key className="w-3.5 h-3.5" />
                      )}
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Lock className="w-3.5 h-3.5" />
                      Locked
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety Notice */}
      <div className="p-4 bg-slate-850 rounded-2xl border border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Safety: Stay on pedestrian paths along Murray St, Princess St and Temuka Domain. Stay outside the private Community Garden. Max boundary: Main Street.</span>
        </div>
      </div>

      {/* Checkpoint Evidence Submission Modal */}
      {activeCheckpoint && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-850 border border-slate-700 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <FileSearch className="w-4 h-4 text-amber-400" />
                <span>Step {activeCheckpoint.stepNumber}: Submit Evidence &amp; Answer</span>
              </div>
              <button
                onClick={() => setActiveCheckpoint(null)}
                className="text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-xs text-slate-300">
                <span className="font-bold text-amber-400">Task: </span>
                {activeCheckpoint.taskPrompt}
              </div>

              {/* Photo Upload Mode */}
              {activeCheckpoint.verificationType === 'photo' && (
                <div className="space-y-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />

                  {capturedPhotoUrl ? (
                    <div className="relative rounded-2xl overflow-hidden border border-amber-500/40 h-48 bg-slate-900">
                      <img
                        src={capturedPhotoUrl}
                        alt="Uploaded Evidence"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-2 right-2 px-3 py-1 bg-black/60 text-white rounded-lg text-xs hover:bg-black/80"
                      >
                        Retake Photo
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-6 rounded-2xl border-2 border-dashed border-slate-700 hover:border-amber-400/60 bg-slate-900 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
                      >
                        <Camera className="w-8 h-8 text-amber-400" />
                        <span className="text-xs font-semibold">Take photo or select from album</span>
                      </button>
                      <button
                        onClick={handleSimulatePhoto}
                        className="text-xs text-slate-500 hover:text-slate-400 underline self-center"
                      >
                        (Quick simulate photo test)
                      </button>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-medium">Notes &amp; Location Details:</label>
                    <textarea
                      value={textEvidenceInput}
                      onChange={e => setTextEvidenceInput(e.target.value)}
                      placeholder="e.g. Found a smooth river stone along Taumatakahu Stream path..."
                      rows={2}
                      className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              )}

              {/* Cipher Input Mode */}
              {activeCheckpoint.verificationType === 'cipher' && (
                <div className="space-y-3">
                  {activeCheckpoint.riddleOrMathClue && (
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 text-xs font-mono text-amber-300">
                      {activeCheckpoint.riddleOrMathClue}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-medium">Enter Cipher / Number Code:</label>
                    <input
                      type="text"
                      value={cipherInput}
                      onChange={e => {
                        setCipherInput(e.target.value);
                        setCipherError(false);
                      }}
                      placeholder="e.g. 16"
                      className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {cipherError && (
                    <p className="text-xs text-rose-400 font-mono">
                      ❌ Incorrect cipher code. Please recalculate!
                    </p>
                  )}
                </div>
              )}

              {/* Text Conclusion Mode */}
              {activeCheckpoint.verificationType === 'text' && (
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-medium">Detective Note / Solution:</label>
                  <textarea
                    value={textEvidenceInput}
                    onChange={e => setTextEvidenceInput(e.target.value)}
                    placeholder="Write your observation or clue finding..."
                    rows={3}
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setActiveCheckpoint(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitEvidence}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow cursor-pointer active:scale-95 transition-transform"
              >
                Submit Evidence
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
