import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Role, UserProfile, RewardItem, RedemptionRecord, RewardCategory } from '../types';
import { sounds } from '../utils/sound';
import {
  Coins,
  Ticket,
  Star,
  Gift,
  Gamepad2,
  Sparkles,
  CheckCircle,
  Clock,
  Dices,
  Lock,
  ArrowRight,
  ShoppingBag,
  Award
} from 'lucide-react';

interface RewardsTabProps {
  activeRole: Role;
  profiles: Record<'sister_older' | 'sister_younger' | 'mum', UserProfile>;
  rewardsCatalog: RewardItem[];
  redemptions: RedemptionRecord[];
  onRedeemReward: (reward: RewardItem) => boolean;
  onSpinMysteryBox: () => { title: string; rewardDesc: string };
}

export const RewardsTab: React.FC<RewardsTabProps> = ({
  activeRole,
  profiles,
  rewardsCatalog,
  redemptions,
  onRedeemReward,
  onSpinMysteryBox,
}) => {
  const currentProfile = profiles[activeRole];
  const isYounger = activeRole === 'sister_younger';

  const [activeCategory, setActiveCategory] = useState<RewardCategory | 'all'>('all');
  const [isSpinning, setIsSpinning] = useState(false);
  const [mysteryResult, setMysteryResult] = useState<{ title: string; rewardDesc: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter rewards for active role
  const roleRewards = rewardsCatalog.filter(
    item => item.applicableRoles.includes(activeRole)
  );

  const filteredRewards = activeCategory === 'all'
    ? roleRewards
    : roleRewards.filter(item => item.category === activeCategory);

  const myRedemptions = redemptions.filter(r => r.userId === activeRole);

  const handleRedeem = (reward: RewardItem) => {
    sounds.playTap();
    if (reward.coinCost > currentProfile.coins) {
      setToastMessage(`Not enough coins! Need ${reward.coinCost} coins. You have ${currentProfile.coins}.`);
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    const success = onRedeemReward(reward);
    if (success) {
      sounds.playCoin();
      confetti({ particleCount: 70, spread: 70 });
      setToastMessage(`🎉 Redemption request submitted for "${reward.title}". Mum will review in the GM console.`);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleMysteryDraw = () => {
    if (currentProfile.luckyTickets < 1) {
      setToastMessage('Not enough Lucky Tickets! Earn tickets from daily challenges or step milestones.');
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    sounds.playTap();
    setIsSpinning(true);
    setMysteryResult(null);

    setTimeout(() => {
      setIsSpinning(false);
      const result = onSpinMysteryBox();
      setMysteryResult(result);
      sounds.playChestOpen();
      confetti({ particleCount: 90, spread: 80 });
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="p-3.5 bg-amber-500 text-slate-950 rounded-2xl font-bold text-xs flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="cursor-pointer text-slate-900 font-black ml-2">✕</button>
        </div>
      )}

      {/* Header Banner & Currency Overview */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
              <Gift className="w-4 h-4" />
              <span>Reward Catalog · Independent Choice</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
              Rewards &amp; Upgrades
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Redeem earned coins for Roblox time, Steam PC gaming, phone time (manga, drawing, friends), books, art supplies, snacks, or pocket money.
            </p>
          </div>

          {/* Currency Vault Widget */}
          <div className="shrink-0 bg-slate-900/90 border border-slate-700/70 p-4 rounded-2xl flex items-center gap-4 text-xs font-mono">
            <div className="text-center px-2">
              <div className="text-slate-400 text-[10px]">Level &amp; XP</div>
              <div className="text-amber-400 font-bold text-base mt-0.5 flex items-center justify-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                Lv.{currentProfile.level}
              </div>
              <div className="text-[10px] text-slate-500">{currentProfile.xp}/{currentProfile.xpToNextLevel}</div>
            </div>

            <div className="w-px h-8 bg-slate-800" />

            <div className="text-center px-2">
              <div className="text-slate-400 text-[10px]">Coins</div>
              <div className="text-yellow-400 font-bold text-base mt-0.5 flex items-center justify-center gap-1">
                <Coins className="w-3.5 h-3.5" />
                {currentProfile.coins}
              </div>
              <div className="text-[10px] text-yellow-500/80">Available</div>
            </div>

            <div className="w-px h-8 bg-slate-800" />

            <div className="text-center px-2">
              <div className="text-slate-400 text-[10px]">Lucky Tickets</div>
              <div className="text-purple-400 font-bold text-base mt-0.5 flex items-center justify-center gap-1">
                <Ticket className="w-3.5 h-3.5" />
                {currentProfile.luckyTickets}
              </div>
              <div className="text-[10px] text-purple-400/80">Mystery Draw</div>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="mt-6 pt-5 border-t border-slate-700/60 flex items-center gap-2 overflow-x-auto">
          {[
            { key: 'all', label: 'All Rewards' },
            { key: 'digital_time', label: isYounger ? '📱 Phone / Screen Time' : '🎮 Gaming / Screen Time' },
            { key: 'physical_goods', label: '🍫 Snacks, Books & Supplies' },
            { key: 'privilege', label: '⭐ Privileges' },
            { key: 'mystery', label: '🎲 Mystery Box' },
          ].map(cat => (
            <button
              key={cat.key}
              onClick={() => {
                sounds.playTap();
                setActiveCategory(cat.key as any);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                activeCategory === cat.key
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                  : 'bg-slate-900/60 hover:bg-slate-750 text-slate-300 border-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mystery Box Draw Card */}
      <div className="bg-gradient-to-br from-purple-950/40 via-slate-850 to-slate-900 border-2 border-purple-800/40 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-lg">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
              <Dices className="w-4 h-4" />
              <span>🎲 Mystery Reward Wheel</span>
            </div>
            <h3 className="text-xl font-bold text-white font-['Outfit']">
              Spin with 1 Lucky Ticket for a bonus reward!
            </h3>
            <p className="text-xs text-slate-300">
              Includes bonus coins, weekend privileges, snacks, or book perks.
            </p>
          </div>

          <button
            onClick={handleMysteryDraw}
            disabled={isSpinning || currentProfile.luckyTickets < 1}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-amber-500 hover:from-purple-400 hover:to-amber-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs rounded-2xl shadow-lg cursor-pointer active:scale-95 transition-transform whitespace-nowrap flex items-center gap-2"
          >
            <Sparkles className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>{isSpinning ? 'Opening Mystery Box...' : 'Use 1 🎟️ Draw Now'}</span>
          </button>
        </div>

        {mysteryResult && (
          <div className="mt-4 p-4 rounded-2xl bg-purple-900/40 border border-purple-500/50 flex items-center justify-between gap-3 animate-in fade-in">
            <div>
              <div className="text-xs font-bold text-amber-300">🎉 Result: {mysteryResult.title}</div>
              <div className="text-xs text-slate-200 mt-0.5">{mysteryResult.rewardDesc}</div>
            </div>
            <button
              onClick={() => setMysteryResult(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕ Claim
            </button>
          </div>
        )}
      </div>

      {/* Reward Items Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center justify-between">
          <span>Available Rewards</span>
          <span className="text-xs font-mono text-slate-400">
            You have {currentProfile.coins} Coins
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRewards.map(item => {
            const canAfford = item.ticketCost
              ? currentProfile.luckyTickets >= item.ticketCost
              : currentProfile.coins >= item.coinCost;

            return (
              <div
                key={item.id}
                className="bg-slate-850/80 border border-slate-700 hover:border-slate-600 rounded-2xl p-5 transition-all flex flex-col justify-between shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="text-2xl">{item.icon}</span>
                    {item.badgeTag && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {item.badgeTag}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-700/60 flex items-center justify-between">
                  <div className="text-xs font-mono font-bold">
                    {item.ticketCost ? (
                      <span className="text-purple-400">{item.ticketCost} 🎟️ Lucky Ticket</span>
                    ) : (
                      <span className="text-yellow-400">{item.coinCost} 🪙 Coins</span>
                    )}
                  </div>

                  {item.category === 'mystery' ? (
                    <button
                      onClick={handleMysteryDraw}
                      disabled={currentProfile.luckyTickets < 1}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl cursor-pointer active:scale-95 transition-transform"
                    >
                      Draw
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRedeem(item)}
                      disabled={!canAfford}
                      className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                          : 'bg-slate-700/60 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? 'Redeem' : 'Need Coins'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Redemptions History */}
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
          <span>My Redemption History ({myRedemptions.length})</span>
        </h2>

        <div className="space-y-3">
          {myRedemptions.map(rec => (
            <div key={rec.id} className="p-4 rounded-2xl bg-slate-850 border border-slate-700/80 flex items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <div className="font-bold text-white text-sm">{rec.rewardTitle}</div>
                <div className="text-slate-400 font-mono">
                  Requested: {rec.requestedAt} · Cost: {rec.cost} 🪙
                </div>
                {rec.gmFeedback && (
                  <div className="text-amber-300 text-[11px] font-medium mt-1">
                    Mum's GM note: {rec.gmFeedback}
                  </div>
                )}
              </div>

              <span className={`px-3 py-1 rounded-full font-bold shrink-0 ${
                rec.status === 'delivered'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                  : rec.status === 'approved'
                  ? 'bg-blue-950/60 text-blue-300 border border-blue-800'
                  : 'bg-amber-950/60 text-amber-300 border border-amber-800'
              }`}>
                {rec.status === 'delivered' ? '✅ Delivered' : rec.status === 'approved' ? '👍 Approved by Mum' : '⏳ Pending'}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
