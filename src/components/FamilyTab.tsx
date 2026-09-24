import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Role, FamilyMission } from '../types';
import { sounds } from '../utils/sound';
import {
  Heart,
  Dices,
  CheckCircle2,
  Sparkles,
  Camera,
  Coffee,
  MessageCircle,
  Flower2,
  Send,
  Plus
} from 'lucide-react';

interface FamilyTabProps {
  activeRole: Role;
  missions: FamilyMission[];
  onCompleteMission: (missionId: string, note?: string) => void;
  onAddLuckyDrawMission: (drawnMission: FamilyMission) => void;
}

const FAMILY_LUCKY_DRAW_POOL = [
  {
    title: 'Make warm lemon honey water for Grandma',
    description: 'Prepare a warm mug with lemon and honey and bring it to Grandma.',
    recipient: 'Grandma' as const,
    xpReward: 70,
    coinsReward: 20,
  },
  {
    title: 'Fold and bring inside the laundry',
    description: 'Check the outdoor clothesline before evening, bring clothes in and fold them.',
    recipient: 'Both Grandparents' as const,
    xpReward: 80,
    coinsReward: 25,
  },
  {
    title: 'Check garden lawn and clear twigs',
    description: 'Walk around the lawn and pick up fallen twigs or debris for Grandpa.',
    recipient: 'Grandpa' as const,
    xpReward: 75,
    coinsReward: 20,
  },
  {
    title: 'Slice fresh fruit for the family',
    description: 'Wash and slice apples or kiwifruit to share for afternoon tea.',
    recipient: 'Both Grandparents' as const,
    xpReward: 85,
    coinsReward: 25,
  },
  {
    title: 'Chat with Grandpa or Grandma for 10 minutes',
    description: 'Ask them about a place they enjoyed in Hong Kong or early days in Temuka.',
    recipient: 'Both Grandparents' as const,
    xpReward: 90,
    coinsReward: 30,
  },
];

export const FamilyTab: React.FC<FamilyTabProps> = ({
  activeRole,
  missions,
  onCompleteMission,
  onAddLuckyDrawMission,
}) => {
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [completionNote, setCompletionNote] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [drawnResult, setDrawnResult] = useState<any | null>(null);

  const handleStartLuckyDraw = () => {
    sounds.playTap();
    setIsSpinning(true);
    setDrawnResult(null);

    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * FAMILY_LUCKY_DRAW_POOL.length);
      const picked = FAMILY_LUCKY_DRAW_POOL[randomIndex];
      setIsSpinning(false);
      setDrawnResult(picked);
      sounds.playClueFound();
    }, 1200);
  };

  const handleAcceptDrawnMission = () => {
    if (!drawnResult) return;
    sounds.playTap();
    const newMission: FamilyMission = {
      id: 'drawn_' + Date.now(),
      title: drawnResult.title,
      description: drawnResult.description,
      recipient: drawnResult.recipient,
      xpReward: drawnResult.xpReward,
      coinsReward: drawnResult.coinsReward,
      isCompleted: false,
      isWeeklyLuckyDraw: true,
    };
    onAddLuckyDrawMission(newMission);
    setDrawnResult(null);
  };

  const handleConfirmDone = (missionId: string) => {
    sounds.playCorrect();
    sounds.playCoin();
    confetti({ particleCount: 60, spread: 60 });
    onCompleteMission(missionId, completionNote || 'Completed task.');
    setCompletingId(null);
    setCompletionNote('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      
      {/* Header Banner */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-400">
              <Heart className="w-4 h-4 fill-rose-400" />
              <span>Family Missions · Grandparents &amp; Mum</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
              Daily Family Tasks
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Help Grandpa and Grandma with practical chores around the home and garden. Earn coins and XP for your efforts.
            </p>
          </div>

          {/* Family Lucky Draw Trigger Button */}
          <button
            onClick={handleStartLuckyDraw}
            disabled={isSpinning}
            className="px-4 py-2.5 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-2xl shadow-lg flex items-center gap-2 cursor-pointer transition-transform active:scale-95 whitespace-nowrap"
          >
            <Dices className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>{isSpinning ? 'Spinning...' : '🎲 Draw Weekly Family Deed'}</span>
          </button>
        </div>
      </div>

      {/* Lucky Draw Result Modal */}
      {drawnResult && (
        <div className="bg-gradient-to-br from-rose-950/50 via-slate-850 to-slate-900 border-2 border-rose-500/60 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>🎲 Weekly Family Deed Drawn!</span>
            </span>
            <button
              onClick={() => setDrawnResult(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕ Dismiss
            </button>
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white">
              {drawnResult.title}
            </h3>
            <p className="text-xs text-slate-300">
              {drawnResult.description}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 text-xs">
            <span className="font-mono text-amber-300">
              Reward: +{drawnResult.xpReward} XP · +{drawnResult.coinsReward} Coins
            </span>
            <button
              onClick={handleAcceptDrawnMission}
              className="px-5 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl shadow cursor-pointer active:scale-95 transition-transform"
            >
              Accept Mission
            </button>
          </div>
        </div>
      )}

      {/* Missions List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center justify-between">
          <span>Today's Family Missions</span>
          <span className="text-xs text-slate-400 font-normal">
            Complete to earn XP &amp; Coins
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {missions.map(mission => {
            const isDone = mission.isCompleted;

            return (
              <div
                key={mission.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isDone
                    ? 'bg-slate-850/70 border-emerald-900/50'
                    : mission.isMumMission
                    ? 'bg-slate-800/90 border-amber-500/50 shadow-lg shadow-amber-500/5'
                    : 'bg-slate-800/90 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-700/60">
                      Target: {mission.recipient}
                    </span>

                    {isDone ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-800/40">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Completed
                      </span>
                    ) : (
                      <span className="text-xs text-amber-400 font-mono">
                        +{mission.xpReward} XP · +{mission.coinsReward} 🪙
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">
                      {mission.title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {mission.description}
                    </p>
                  </div>

                  {mission.completedNote && (
                    <div className="text-xs bg-slate-900/90 text-emerald-300 p-2.5 rounded-xl border border-slate-700/50">
                      💬 Note: {mission.completedNote}
                    </div>
                  )}
                </div>

                {/* Bottom Action */}
                <div className="pt-4 mt-3 border-t border-slate-700/60 flex items-center justify-between">
                  {isDone ? (
                    <span className="text-xs text-emerald-400 font-medium">
                      Mission completed
                    </span>
                  ) : completingId === mission.id ? (
                    <div className="w-full space-y-2">
                      <input
                        type="text"
                        value={completionNote}
                        onChange={e => setCompletionNote(e.target.value)}
                        placeholder="Add a quick note (e.g. Cleared back lawn debris)"
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setCompletingId(null)}
                          className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleConfirmDone(mission.id)}
                          className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow cursor-pointer active:scale-95 transition-transform"
                        >
                          Confirm Done
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        sounds.playTap();
                        setCompletingId(mission.id);
                        setCompletionNote('');
                      }}
                      className="w-full py-2 bg-slate-700 hover:bg-slate-650 hover:text-white text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Mark as Done</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
