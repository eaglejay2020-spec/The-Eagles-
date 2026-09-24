import React from 'react';
import { Role, UserProfile, DailyMissionSummary, FamilyTreasureStatus, MoveState } from '../types';
import { ASSET_IMAGES } from '../data/initialData';
import { sounds } from '../utils/sound';
import {
  CheckCircle2,
  Circle,
  Footprints,
  Compass,
  Heart,
  BookOpen,
  Sparkles,
  ArrowRight,
  Flame,
  Zap,
  Users,
  Camera
} from 'lucide-react';

interface HomeTabProps {
  activeRole: Role;
  profiles: Record<'sister_older' | 'sister_younger' | 'mum', UserProfile>;
  dailyMissions: DailyMissionSummary[];
  moveState: MoveState;
  familyTreasure: FamilyTreasureStatus;
  onNavigateTab: (tabId: string) => void;
  onQuickToggleComplete?: (missionId: string) => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  activeRole,
  profiles,
  dailyMissions,
  moveState,
  familyTreasure,
  onNavigateTab,
}) => {
  const currentProfile = profiles[activeRole];
  const isYounger = activeRole === 'sister_younger';
  const isOlder = activeRole === 'sister_older';

  const completedCount = dailyMissions.filter(m => m.isCompleted).length;
  const progressPercent = Math.round((completedCount / Math.max(1, dailyMissions.length)) * 100);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Dynamic Role Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 border border-slate-700/80 p-6 sm:p-8 shadow-xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>
                {isYounger
                  ? '🕵️‍♀️ TEMUKA DETECTIVE MISSIONS'
                  : isOlder
                  ? '⚔️ TEMUKA EXPLORER MISSIONS'
                  : '👑 GAME MASTER DASHBOARD'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-['Outfit']">
              {isYounger
                ? "Today's Missions & Clues"
                : isOlder
                ? "Today's Missions & Challenges"
                : 'Temuka Missions & Progress'}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {isYounger
                ? 'Complete 10 maths questions, walk the stream trail, help Grandma, and unlock daily manga & detective reading time.'
                : isOlder
                ? 'Finish your 10 maths questions, outdoor step count, and daily family tasks to earn coins for rewards.'
                : 'Tracking daily maths, Temuka step goals, family tasks and reward approvals.'}
            </p>

            {/* Personal progress note */}
            <div className="pt-1 flex items-center gap-2 text-xs text-amber-300/90 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>{currentProfile.personalProgressNote}</span>
            </div>
          </div>

          {/* Character / Badge Visual slot */}
          <div className="shrink-0 flex items-center gap-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 shadow-lg">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-amber-500/30 bg-slate-900 flex items-center justify-center">
              <img
                src={isYounger ? ASSET_IMAGES.detectiveBadge : ASSET_IMAGES.championCrest}
                alt="Role Crest"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-1">
              <div className="text-base font-bold text-white flex items-center gap-1.5">
                <span>{currentProfile.name}</span>
              </div>
              <div className="text-xs text-slate-400">
                {activeRole === 'mum' ? 'Level' : 'Explorer Level'} <span className="font-mono text-amber-400 font-bold">Lv.{currentProfile.level}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <Flame className="w-3.5 h-3.5 fill-emerald-400" />
                <span>{currentProfile.streakDays}-Day Streak</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 📸 Share a Moment Quick Action Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-850 via-slate-800 to-slate-850 border border-amber-500/30 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                📸 Share a Moment
              </span>
              <span className="text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700 font-mono">
                +20 XP · +8 🪙
              </span>
            </div>
            <div className="text-sm font-semibold text-white mt-0.5">
              Took a walk to the park? Helped in the garden? Snap a photo to share.
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Daily photos and notes from Murray St, Princess St and Temuka Domain.
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            sounds.playTap();
            onNavigateTab('moments');
          }}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-transform active:scale-95 whitespace-nowrap cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shadow-md"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Record Moment</span>
        </button>
      </div>

      {/* Sudden Bonus Mission Alert Card (If applicable) */}
      {moveState.activeBonusMission && (
        <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent border-l-4 border-amber-400 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Zap className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                ⚡ SUDDEN BONUS MISSION
              </div>
              <div className="text-sm font-semibold text-slate-100">
                {moveState.activeBonusMission.description}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                <span className="text-amber-300 font-bold font-mono">{moveState.activeBonusMission.stepsRemaining}</span> steps remaining to unlock chest · Reward: +{moveState.activeBonusMission.rewardCoins} Coins & Mystery Ticket
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playTap();
              onNavigateTab('move');
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-transform active:scale-95 whitespace-nowrap cursor-pointer"
          >
            Open Walk Tracker →
          </button>
        </div>
      )}

      {/* Daily 5 Mission Deck Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 font-['Outfit']">
            <span>Today's 5 Core Missions</span>
            <span className="text-xs font-mono text-slate-400 font-normal">
              ({completedCount}/{dailyMissions.length} Completed · {progressPercent}%)
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Complete 10 maths questions daily. Explore walk and family tasks for instant coins.
          </p>
        </div>
        
        {/* Progress bar */}
        <div className="hidden sm:block w-36 bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700">
          <div
            className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 5 Core Missions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dailyMissions.map((mission) => {
          const isDone = mission.isCompleted;

          const routeMap: Record<string, string> = {
            maths: 'maths',
            move: 'move',
            adventure: 'adventure',
            family: 'family',
            reflection: 'reflection',
          };

          return (
            <div
              key={mission.id}
              onClick={() => {
                sounds.playTap();
                onNavigateTab(routeMap[mission.type] || 'home');
              }}
              className={`group relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                isDone
                  ? 'bg-slate-850/60 border-emerald-900/50 hover:border-emerald-700/60'
                  : 'bg-slate-800/90 border-slate-700 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{mission.icon}</span>
                  {isDone ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-800/40">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Completed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
                      <Circle className="w-3.5 h-3.5" />
                      Start
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                    {mission.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {mission.subtitle}
                  </p>
                </div>

                {mission.detailSnippet && (
                  <div className="text-xs bg-slate-900/80 text-emerald-300/90 p-2.5 rounded-xl border border-slate-700/50">
                    {mission.detailSnippet}
                  </div>
                )}
              </div>

              {/* Bottom Meta & Rewards */}
              <div className="pt-4 mt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-mono tabular-nums text-slate-300">
                  <span className="text-amber-400 font-semibold">+{mission.xpReward} XP</span>
                  <span>·</span>
                  <span className="text-yellow-400 font-semibold">+{mission.coinsReward} Coins</span>
                  {mission.ticketReward && (
                    <>
                      <span>·</span>
                      <span className="text-purple-400 font-semibold">+{mission.ticketReward} 🎟️</span>
                    </>
                  )}
                </div>

                <span className="text-slate-400 group-hover:text-amber-400 flex items-center gap-1 font-medium transition-colors">
                  Open
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Shared Family Treasure Card */}
      <div className="bg-gradient-to-br from-purple-950/40 via-slate-850 to-slate-900 rounded-3xl p-6 border border-purple-800/40 relative overflow-hidden shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Shared Family Treasure · Team Goal</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white font-['Outfit']">
              Milestone Reward: 20 Mission Goal
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Complete 20 missions together to unlock the weekend family dinner & outdoor treat!
            </p>

            <div className="pt-2 flex items-center gap-4 text-xs font-mono text-purple-300">
              <span>Progress: {familyTreasure.currentMissions} / {familyTreasure.targetMissions} missions</span>
              <span>·</span>
              <span>{Math.max(0, familyTreasure.targetMissions - familyTreasure.currentMissions)} missions remaining</span>
            </div>

            {/* Visual Bar */}
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-purple-900/60 mt-1">
              <div
                className="bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (familyTreasure.currentMissions / familyTreasure.targetMissions) * 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="shrink-0 w-full lg:w-64 bg-slate-900/80 p-4 rounded-2xl border border-purple-800/50 flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-purple-500/30">
              <img
                src={ASSET_IMAGES.familyTreasure}
                alt="Family Treasure Chest"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-xs space-y-1">
              <div className="font-bold text-amber-300">Unlock Reward:</div>
              <div className="text-slate-300 leading-tight font-medium">
                {familyTreasure.rewardDescription}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
