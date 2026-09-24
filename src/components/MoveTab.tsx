import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Role, MoveState, WalkingMilestone } from '../types';
import { sounds } from '../utils/sound';
import {
  Footprints,
  Zap,
  Gift,
  Map,
  Key,
  Bell,
  CloudRain,
  Sun,
  ShieldCheck,
  Plus,
  Play,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface MoveTabProps {
  activeRole: Role;
  moveState: MoveState;
  milestones: WalkingMilestone[];
  onAddSteps: (stepsToAdd: number) => void;
  onToggleIndoorMode: () => void;
  onClaimMilestone: (stepThreshold: number) => void;
  onClaimSuddenBonus: () => void;
}

export const MoveTab: React.FC<MoveTabProps> = ({
  activeRole,
  moveState,
  milestones,
  onAddSteps,
  onToggleIndoorMode,
  onClaimMilestone,
  onClaimSuddenBonus,
}) => {
  const isYounger = activeRole === 'sister_younger';
  const [isSimulatingWalk, setIsSimulatingWalk] = useState(false);

  const stepsPercent = Math.min(100, Math.round((moveState.currentSteps / moveState.targetSteps) * 100));

  const handleSimulateSteps = (count: number) => {
    sounds.playTap();
    onAddSteps(count);

    // Check if sudden bonus reached
    if (
      moveState.activeBonusMission &&
      moveState.activeBonusMission.stepsRemaining <= count
    ) {
      sounds.playChestOpen();
      confetti({ particleCount: 60, spread: 60 });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      
      {/* Header Banner */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <Footprints className="w-4 h-4" />
              <span>{isYounger ? 'Outdoor Detective Patrol Steps' : 'Daily Walking & Steps'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
              "Keep walking, something might happen!"
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Walk along Murray St, Princess St, Taumatakahu stream walkway, and Temuka Domain. Stay outside the Community Garden. Maximum boundary: Main Street.
            </p>
          </div>

          {/* Weather / Indoor Safety Mode Toggle */}
          <button
            onClick={() => {
              sounds.playTap();
              onToggleIndoorMode();
            }}
            className={`px-3.5 py-2 rounded-2xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
              moveState.isIndoorMode
                ? 'bg-blue-950/60 border-blue-600 text-blue-300 shadow-md'
                : 'bg-slate-700/60 border-slate-600 text-slate-300 hover:bg-slate-750'
            }`}
          >
            {moveState.isIndoorMode ? (
              <>
                <CloudRain className="w-4 h-4 text-blue-400" />
                <span>🌧️ Rainy Indoor Pacing Mode Active</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Switch to Indoor Pacing Mode</span>
              </>
            )}
          </button>
        </div>

        {/* Steps Gauge */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white">
                  {moveState.currentSteps.toLocaleString()}
                </span>
                <span className="text-slate-400 text-sm ml-2 font-mono">
                  / {moveState.targetSteps.toLocaleString()} Steps
                </span>
              </div>
              <span className="text-sm font-mono font-bold text-amber-400">
                {stepsPercent}%
              </span>
            </div>

            {/* Step Progress Bar */}
            <div className="w-full bg-slate-900 rounded-full h-3.5 overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-emerald-500 via-amber-400 to-yellow-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${stepsPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1 font-mono">
              <span>Start 0</span>
              <span>1k Mission</span>
              <span>2k Chest</span>
              <span>3k Map</span>
              <span>4k Garden Border</span>
              <span>5k Holiday Park</span>
            </div>
          </div>

          {/* Quick Step Logging Controls */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-700/60 space-y-2">
            <div className="text-xs font-bold text-slate-300">Log Real Walk Steps:</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleSimulateSteps(500)}
                className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border border-slate-700 cursor-pointer active:scale-95 transition-transform"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+500 Steps</span>
              </button>
              <button
                onClick={() => handleSimulateSteps(1000)}
                className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border border-slate-700 cursor-pointer active:scale-95 transition-transform"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+1,000 Steps</span>
              </button>
            </div>
            <button
              onClick={() => handleSimulateSteps(1500)}
              className="w-full p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform shadow-md"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Finished Walk Loop (+1,500 Steps)</span>
            </button>
          </div>

        </div>
      </div>

      {/* Sudden Bonus Mission Card */}
      {moveState.activeBonusMission && (
        <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-slate-800 border-2 border-amber-400 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/30 flex items-center justify-center text-amber-300">
                <Zap className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  ⚡ SUDDEN BONUS MISSION
                </div>
                <h3 className="text-lg font-bold text-white">
                  {moveState.activeBonusMission.description}
                </h3>
              </div>
            </div>

            {moveState.activeBonusMission.stepsRemaining <= 0 ? (
              <button
                onClick={() => {
                  sounds.playChestOpen();
                  confetti({ particleCount: 70, spread: 70 });
                  onClaimSuddenBonus();
                }}
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg cursor-pointer active:scale-95 transition-transform animate-bounce"
              >
                🔓 Claim Chest!
              </button>
            ) : (
              <span className="text-xs font-mono text-amber-300 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-700/60">
                {moveState.activeBonusMission.stepsRemaining} steps remaining
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-300 font-mono">
            <span>Reward: +{moveState.activeBonusMission.rewardCoins} Coins</span>
            <span>·</span>
            <span>+{moveState.activeBonusMission.rewardTickets} Lucky Mystery Tickets 🎟️</span>
          </div>
        </div>
      )}

      {/* Walking Milestones Timeline */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white font-['Outfit']">
          Trail Milestones & Surprises
        </h2>

        <div className="space-y-3">
          {milestones.map((m) => {
            const isReached = moveState.currentSteps >= m.stepThreshold;

            const iconMap = {
              mission: <Bell className="w-5 h-5 text-amber-400" />,
              chest: <Gift className="w-5 h-5 text-yellow-400" />,
              map_fragment: <Map className="w-5 h-5 text-emerald-400" />,
              puzzle: <Sparkles className="w-5 h-5 text-purple-400" />,
              final_clue: <Key className="w-5 h-5 text-amber-300" />,
            };

            return (
              <div
                key={m.stepThreshold}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isReached
                    ? 'bg-slate-800/90 border-slate-700'
                    : 'bg-slate-850/50 border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                    {iconMap[m.rewardType]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400">
                        {m.stepThreshold.toLocaleString()} Steps
                      </span>
                      <span className="text-xs text-slate-500">·</span>
                      <h4 className="text-sm font-bold text-white">
                        {m.title}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {m.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <span className="text-xs font-mono font-semibold text-amber-300 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700">
                    {m.rewardLabel}
                  </span>

                  {isReached ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-800/40">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Unlocked
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 font-mono">
                      {(m.stepThreshold - moveState.currentSteps).toLocaleString()} steps left
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety Notice Card */}
      <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800 flex items-center gap-3 text-xs text-slate-400">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
        <span>
          Safety Rule: Stay on pedestrian paths along Murray St, Princess St, and Temuka Domain. Maximum limit is Main Street. Do not enter the private Community Garden.
        </span>
      </div>

    </div>
  );
};
