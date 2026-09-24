import React from 'react';
import { Role, UserProfile } from '../types';
import { sounds } from '../utils/sound';
import { Cloud, CloudOff, RefreshCw, Star, Coins, Ticket, Shield } from 'lucide-react';

interface HeaderProps {
  activeRole: Role;
  profiles: Record<'sister_older' | 'sister_younger' | 'mum', UserProfile>;
  onSelectRole: (role: Role) => void;
  isOffline: boolean;
  onToggleOffline: () => void;
  pendingSyncCount: number;
  onOpenSyncModal: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeRole,
  profiles,
  onSelectRole,
  isOffline,
  onToggleOffline,
  pendingSyncCount,
  onOpenSyncModal,
  activeTab,
  onSelectTab,
}) => {
  const currentProfile = profiles[activeRole];

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'maths', label: 'Maths 10' },
    { id: 'move', label: 'Walk & Move' },
    { id: 'adventure', label: activeRole === 'sister_younger' ? 'Detective Hunt' : 'Adventure' },
    { id: 'moments', label: 'Moments' },
    { id: 'family', label: 'Family' },
    { id: 'reflection', label: 'Daily Reflection' },
    { id: 'rewards', label: 'Rewards' },
  ];

  if (activeRole === 'mum') {
    navLinks.push({ id: 'mum_gm', label: 'Mum GM' });
  }

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 transition-colors">
      {/* Strict 3-zone Top Bar Contract: Brand single wordmark | Nav links | Primary actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              sounds.playTap();
              onSelectTab('home');
            }}
            className="text-left group cursor-pointer focus:outline-none"
          >
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-amber-400 group-hover:text-amber-300 transition-colors font-['Outfit']">
              Real Life Adventure
            </span>
          </button>
        </div>

        {/* Zone 2: Clean text navigation links (single line, horizontal scroll on mobile) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-medium text-slate-300 overflow-x-auto py-1">
          {navLinks.map((link) => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => {
                  sounds.playTap();
                  onSelectTab(link.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs xl:text-sm whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-amber-400 font-semibold shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1-2 primary actions: Currency stats, Offline status & Role selector */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* User Currency Metrics (Clean unboxed text) */}
          {activeRole !== 'mum' ? (
            <div className="hidden sm:flex items-center gap-3 text-xs font-mono tabular-nums text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
              <span className="flex items-center gap-1 text-amber-300 font-semibold" title="冒險者等級與 XP">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                Lv.{currentProfile.level}
              </span>
              <span className="text-slate-600">·</span>
              <span className="flex items-center gap-1 text-yellow-400 font-semibold" title="金幣 (可兌換自選獎勵)">
                <Coins className="w-3.5 h-3.5 text-yellow-400" />
                {currentProfile.coins}
              </span>
              <span className="text-slate-600">·</span>
              <span className="flex items-center gap-1 text-purple-400 font-semibold" title="幸運抽獎券 (Mystery Box)">
                <Ticket className="w-3.5 h-3.5 text-purple-400" />
                {currentProfile.luckyTickets}
              </span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/40 border border-amber-800/50 px-2.5 py-1 rounded-lg">
              <Shield className="w-3.5 h-3.5" />
              <span>Game Master Console</span>
            </div>
          )}

          {/* Offline / Sync State Button */}
          <button
            onClick={() => {
              sounds.playTap();
              onOpenSyncModal();
            }}
            title={isOffline ? 'Offline mode active (click to sync)' : 'All progress online'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
              isOffline
                ? 'bg-amber-950/50 border-amber-700/60 text-amber-300 hover:bg-amber-900/60'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
            }`}
          >
            {isOffline ? (
              <>
                <CloudOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden md:inline">Offline</span>
                {pendingSyncCount > 0 && (
                  <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 rounded-full">
                    {pendingSyncCount}
                  </span>
                )}
              </>
            ) : (
              <>
                <Cloud className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="hidden md:inline">Online</span>
                {pendingSyncCount > 0 && (
                  <span className="bg-emerald-500 text-slate-950 text-[10px] font-bold px-1.5 rounded-full">
                    {pendingSyncCount}
                  </span>
                )}
              </>
            )}
          </button>

          {/* Role Switcher: Jasmine, Jessie, Mum */}
          <div className="relative">
            <select
              value={activeRole}
              onChange={(e) => {
                sounds.playTap();
                onSelectRole(e.target.value as Role);
              }}
              className="appearance-none bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-400"
            >
              <option value="sister_younger">Jasmine</option>
              <option value="sister_older">Jessie</option>
              <option value="mum">Mum</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Secondary Navigation Row */}
      <div className="lg:hidden px-3 py-2 border-t border-slate-800/80 overflow-x-auto flex items-center gap-1 text-xs">
        {navLinks.map((link) => (
          <button
            key={link.id}
            onClick={() => {
              sounds.playTap();
              onSelectTab(link.id);
            }}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors ${
              activeTab === link.id
                ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {link.label}
          </button>
        ))}
      </div>
    </header>
  );
};
