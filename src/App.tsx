import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Role,
  UserProfile,
  RewardItem,
  DailyReflection,
  FamilyMission,
  SharedMoment,
  SecuritySettings,
  MathAnswerLog,
  MumGMSettings
} from './types';
import {
  loadGameState,
  saveGameState,
  getOfflineQueue,
  queueOfflineAction,
  clearOfflineQueue,
  getOfflineMode,
  setOfflineMode,
  AppGameState
} from './utils/storage';
import { sounds } from './utils/sound';

import { Header } from './components/Header';
import { HomeTab } from './components/HomeTab';
import { MathsTab } from './components/MathsTab';
import { MoveTab } from './components/MoveTab';
import { AdventureTab } from './components/AdventureTab';
import { MomentsTab } from './components/MomentsTab';
import { FamilyTab } from './components/FamilyTab';
import { ReflectionTab } from './components/ReflectionTab';
import { RewardsTab } from './components/RewardsTab';
import { MumDashboardTab } from './components/MumDashboardTab';
import { OfflineSyncModal } from './components/OfflineSyncModal';
import { PinModal } from './components/PinModal';

export default function App() {
  const [gameState, setGameState] = useState<AppGameState>(() => loadGameState());
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isOffline, setIsOffline] = useState<boolean>(() => getOfflineMode());
  const [offlineQueue, setOfflineQueue] = useState(() => getOfflineQueue());
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [pinModalState, setPinModalState] = useState<{
    isOpen: boolean;
    targetRole: Role;
  }>({
    isOpen: false,
    targetRole: 'sister_younger',
  });

  // Sync state changes to local storage
  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  // Level up helper
  const checkLevelUp = (profile: UserProfile, addedXp: number): UserProfile => {
    let newXp = profile.xp + addedXp;
    let newLevel = profile.level;
    let newXpNext = profile.xpToNextLevel;

    while (newXp >= newXpNext) {
      newXp -= newXpNext;
      newLevel += 1;
      newXpNext = Math.round(newXpNext * 1.3);
      sounds.playFanfare();
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
    }

    return {
      ...profile,
      xp: newXp,
      level: newLevel,
      xpToNextLevel: newXpNext,
    };
  };

  const performRoleSwitch = (role: Role) => {
    sounds.playTap();
    setGameState(prev => ({
      ...prev,
      activeRole: role,
    }));
    if (role === 'mum') {
      setActiveTab('mum_gm');
    } else if (activeTab === 'mum_gm') {
      setActiveTab('home');
    }
  };

  const handleSelectRole = (role: Role) => {
    if (role === gameState.activeRole) return;

    // Security Check: If device is locked or PIN protection is on
    const isSecurityOn = gameState.security?.pinProtectionEnabled ?? true;
    const isDeviceLocked = Boolean(gameState.security?.lockedDeviceRole && gameState.security.lockedDeviceRole !== role);

    if (isSecurityOn || isDeviceLocked) {
      setPinModalState({
        isOpen: true,
        targetRole: role,
      });
      return;
    }

    performRoleSwitch(role);
  };

  const handlePinSuccess = () => {
    performRoleSwitch(pinModalState.targetRole);
    setPinModalState(prev => ({ ...prev, isOpen: false }));
  };

  const handleUpdateSecuritySettings = (updated: Partial<SecuritySettings>) => {
    setGameState(prev => ({
      ...prev,
      security: {
        ...prev.security,
        ...updated,
      },
    }));
  };

  const getTargetExpectedPin = (role: Role): string => {
    if (role === 'mum') return gameState.security?.mumPin || '8888';
    if (role === 'sister_older') return gameState.security?.jessiePin || '5678';
    return gameState.security?.jasminePin || '1234';
  };

  const getTargetDisplayName = (role: Role): string => {
    if (role === 'mum') return 'Mum';
    if (role === 'sister_older') return 'Jessie';
    return 'Jasmine';
  };

  const handleToggleOffline = () => {
    const nextVal = !isOffline;
    setIsOffline(nextVal);
    setOfflineMode(nextVal);
  };

  // 1. Math complete handler
  const handleCompleteMaths = (score: number, speedBonus: boolean) => {
    if (gameState.activeRole === 'mum') return;
    const currentRole = gameState.activeRole;

    const baseCoins = 30;
    const earnedCoins = baseCoins + (score === 10 ? 15 : 0) + (speedBonus ? 10 : 0);
    const earnedTickets = score === 10 ? 1 : 0;
    const addedXp = 120 + (score * 10);

    setGameState(prev => {
      const updatedProfile = checkLevelUp(prev.profiles[currentRole], addedXp);
      const newProfile: UserProfile = {
        ...updatedProfile,
        coins: updatedProfile.coins + earnedCoins,
        luckyTickets: updatedProfile.luckyTickets + earnedTickets,
        completedMissionsCount: updatedProfile.completedMissionsCount + 1,
      };

      const updatedMissions = prev.dailyMissions[currentRole].map(m =>
        m.type === 'maths'
          ? { ...m, isCompleted: true, completedAt: new Date().toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' }) }
          : m
      );

      return {
        ...prev,
        profiles: {
          ...prev.profiles,
          [currentRole]: newProfile,
        },
        dailyMissions: {
          ...prev.dailyMissions,
          [currentRole]: updatedMissions,
        },
        familyTreasure: {
          ...prev.familyTreasure,
          currentMissions: prev.familyTreasure.currentMissions + 1,
        },
      };
    });

    const act = queueOfflineAction('complete_math', { role: currentRole, score, earnedCoins });
    setOfflineQueue(prev => [...prev, act]);
  };

  const handleLogMathAnswer = (newLog: MathAnswerLog) => {
    setGameState(prev => ({
      ...prev,
      mathAnswerLogs: [newLog, ...(prev.mathAnswerLogs || [])],
    }));
  };

  const handleUpdateMumGMSettings = (updated: Partial<MumGMSettings>) => {
    setGameState(prev => ({
      ...prev,
      mumGMSettings: {
        ...prev.mumGMSettings,
        ...updated,
      },
    }));
  };

  const handleToggleUnitComplete = (role: 'sister_older' | 'sister_younger', unitId: string) => {
    setGameState(prev => ({
      ...prev,
      syllabusUnits: {
        ...prev.syllabusUnits,
        [role]: prev.syllabusUnits[role].map(u =>
          u.id === unitId
            ? {
                ...u,
                isCompleted: !u.isCompleted,
                status: !u.isCompleted ? 'completed' : 'in_progress',
                completedDate: !u.isCompleted ? new Date().toISOString().split('T')[0] : undefined,
              }
            : u
        ),
      },
    }));
  };

  // 2. Step add handler
  const handleAddSteps = (stepsToAdd: number) => {
    if (gameState.activeRole === 'mum') return;
    const currentRole = gameState.activeRole;

    setGameState(prev => {
      const currentMove = prev.moveStates[currentRole];
      const newSteps = currentMove.currentSteps + stepsToAdd;

      // Update milestones
      const updatedMilestones = prev.walkingMilestones[currentRole].map(m => ({
        ...m,
        isUnlocked: m.isUnlocked || newSteps >= m.stepThreshold,
      }));

      // Update sudden bonus if active
      let updatedBonus = currentMove.activeBonusMission;
      if (updatedBonus) {
        const remaining = Math.max(0, updatedBonus.stepsRemaining - stepsToAdd);
        updatedBonus = {
          ...updatedBonus,
          stepsRemaining: remaining,
        };
      }

      // Check if target reached for daily mission
      const isTargetMet = newSteps >= currentMove.targetSteps;
      const updatedMissions = prev.dailyMissions[currentRole].map(m =>
        m.type === 'move' ? { ...m, isCompleted: isTargetMet } : m
      );

      return {
        ...prev,
        moveStates: {
          ...prev.moveStates,
          [currentRole]: {
            ...currentMove,
            currentSteps: newSteps,
            activeBonusMission: updatedBonus,
          },
        },
        walkingMilestones: {
          ...prev.walkingMilestones,
          [currentRole]: updatedMilestones,
        },
        dailyMissions: {
          ...prev.dailyMissions,
          [currentRole]: updatedMissions,
        },
      };
    });

    const act = queueOfflineAction('log_walk', { role: currentRole, stepsAdded: stepsToAdd });
    setOfflineQueue(prev => [...prev, act]);
  };

  const handleToggleIndoorMode = () => {
    if (gameState.activeRole === 'mum') return;
    const currentRole = gameState.activeRole;

    setGameState(prev => ({
      ...prev,
      moveStates: {
        ...prev.moveStates,
        [currentRole]: {
          ...prev.moveStates[currentRole],
          isIndoorMode: !prev.moveStates[currentRole].isIndoorMode,
        },
      },
    }));
  };

  const handleClaimMilestone = (stepThreshold: number) => {
    if (gameState.activeRole === 'mum') return;
    const currentRole = gameState.activeRole;

    sounds.playCoin();
    setGameState(prev => {
      const updatedProfile = checkLevelUp(prev.profiles[currentRole], 40);
      return {
        ...prev,
        profiles: {
          ...prev.profiles,
          [currentRole]: {
            ...updatedProfile,
            coins: updatedProfile.coins + 15,
          },
        },
      };
    });
  };

  const handleClaimSuddenBonus = () => {
    if (gameState.activeRole === 'mum') return;
    const currentRole = gameState.activeRole;

    setGameState(prev => {
      const bonus = prev.moveStates[currentRole].activeBonusMission;
      if (!bonus) return prev;

      const updatedProfile = checkLevelUp(prev.profiles[currentRole], 80);
      const newProfile: UserProfile = {
        ...updatedProfile,
        coins: updatedProfile.coins + bonus.rewardCoins,
        luckyTickets: updatedProfile.luckyTickets + bonus.rewardTickets,
      };

      return {
        ...prev,
        profiles: {
          ...prev.profiles,
          [currentRole]: newProfile,
        },
        moveStates: {
          ...prev.moveStates,
          [currentRole]: {
            ...prev.moveStates[currentRole],
            activeBonusMission: undefined, // Cleared after claim
          },
        },
      };
    });
  };

  // 3. Adventure Checkpoint Complete
  const handleCompleteCheckpoint = (questId: string, checkpointId: string, photoUrl?: string, note?: string) => {
    setGameState(prev => {
      const updatedQuests = prev.adventureQuests.map(q => {
        if (q.id !== questId) return q;
        const updatedCheckpoints = q.checkpoints.map(cp => {
          if (cp.id !== checkpointId) return cp;
          return {
            ...cp,
            isCompleted: true,
            photoDataUrl: photoUrl || cp.photoDataUrl,
            userNote: note || cp.userNote,
          };
        });
        return {
          ...q,
          checkpoints: updatedCheckpoints,
        };
      });

      return {
        ...prev,
        adventureQuests: updatedQuests,
      };
    });

    const act = queueOfflineAction('checkpoint_evidence', { questId, checkpointId, note });
    setOfflineQueue(prev => [...prev, act]);
  };

  const handleClaimTreasure = (questId: string) => {
    if (gameState.activeRole === 'mum') return;
    const currentRole = gameState.activeRole;

    setGameState(prev => {
      const quest = prev.adventureQuests.find(q => q.id === questId);
      if (!quest) return prev;

      const updatedProfile = checkLevelUp(prev.profiles[currentRole], quest.xpReward);
      const newProfile: UserProfile = {
        ...updatedProfile,
        coins: updatedProfile.coins + quest.coinsReward,
        luckyTickets: updatedProfile.luckyTickets + quest.ticketsReward,
        completedMissionsCount: updatedProfile.completedMissionsCount + 1,
      };

      const updatedMissions = prev.dailyMissions[currentRole].map(m =>
        m.type === 'adventure' ? { ...m, isCompleted: true } : m
      );

      return {
        ...prev,
        profiles: {
          ...prev.profiles,
          [currentRole]: newProfile,
        },
        dailyMissions: {
          ...prev.dailyMissions,
          [currentRole]: updatedMissions,
        },
        familyTreasure: {
          ...prev.familyTreasure,
          currentMissions: prev.familyTreasure.currentMissions + 1,
        },
      };
    });
  };

  // 4. Family mission complete
  const handleCompleteFamilyMission = (missionId: string, note?: string) => {
    if (gameState.activeRole === 'mum') return;
    const currentRole = gameState.activeRole;

    setGameState(prev => {
      const mission = prev.familyMissions.find(m => m.id === missionId);
      const xp = mission?.xpReward || 70;
      const coins = mission?.coinsReward || 20;

      const updatedProfile = checkLevelUp(prev.profiles[currentRole], xp);
      const newProfile: UserProfile = {
        ...updatedProfile,
        coins: updatedProfile.coins + coins,
        completedMissionsCount: updatedProfile.completedMissionsCount + 1,
      };

      const updatedFamilyMissions = prev.familyMissions.map(m =>
        m.id === missionId ? { ...m, isCompleted: true, completedNote: note } : m
      );

      const updatedDailyMissions = prev.dailyMissions[currentRole].map(m =>
        m.type === 'family' ? { ...m, isCompleted: true, detailSnippet: note } : m
      );

      return {
        ...prev,
        profiles: {
          ...prev.profiles,
          [currentRole]: newProfile,
        },
        familyMissions: updatedFamilyMissions,
        dailyMissions: {
          ...prev.dailyMissions,
          [currentRole]: updatedDailyMissions,
        },
        familyTreasure: {
          ...prev.familyTreasure,
          currentMissions: prev.familyTreasure.currentMissions + 1,
        },
      };
    });

    const act = queueOfflineAction('family_done', { missionId, note });
    setOfflineQueue(prev => [...prev, act]);
  };

  const handleAddLuckyDrawMission = (drawnMission: FamilyMission) => {
    setGameState(prev => ({
      ...prev,
      familyMissions: [drawnMission, ...prev.familyMissions],
    }));
  };

  // 5. Reflection submit
  const handleSubmitReflection = (newRef: Omit<DailyReflection, 'id' | 'submittedAt'>) => {
    if (gameState.activeRole === 'mum') return;
    const currentRole = gameState.activeRole;

    const fullRef: DailyReflection = {
      ...newRef,
      id: 'ref_' + Date.now(),
      submittedAt: new Date().toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' }),
    };

    setGameState(prev => {
      const updatedProfile = checkLevelUp(prev.profiles[currentRole], 50);
      const newProfile: UserProfile = {
        ...updatedProfile,
        coins: updatedProfile.coins + 15,
        completedMissionsCount: updatedProfile.completedMissionsCount + 1,
      };

      const updatedMissions = prev.dailyMissions[currentRole].map(m =>
        m.type === 'reflection' ? { ...m, isCompleted: true } : m
      );

      return {
        ...prev,
        profiles: {
          ...prev.profiles,
          [currentRole]: newProfile,
        },
        reflections: [fullRef, ...prev.reflections],
        dailyMissions: {
          ...prev.dailyMissions,
          [currentRole]: updatedMissions,
        },
        familyTreasure: {
          ...prev.familyTreasure,
          currentMissions: prev.familyTreasure.currentMissions + 1,
        },
      };
    });

    const act = queueOfflineAction('submit_reflection', fullRef);
    setOfflineQueue(prev => [...prev, act]);
  };

  // 5b. Share a Moment submit
  const handleSubmitMoment = (momentData: Omit<SharedMoment, 'id' | 'submittedAt' | 'dateStr' | 'xpAwarded' | 'coinsAwarded' | 'aiReview'>) => {
    if (gameState.activeRole === 'mum') return;
    const currentRole = gameState.activeRole;

    const hasEvidence = !!(momentData.photoUrl || momentData.voiceNoteUrl || momentData.drawingDataUrl);
    const xp = hasEvidence ? 20 : 15;
    const coins = hasEvidence ? 8 : 5;

    const fullMoment: SharedMoment = {
      ...momentData,
      id: 'moment_' + Date.now(),
      submittedAt: new Date().toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' }),
      dateStr: new Date().toISOString().split('T')[0],
      xpAwarded: xp,
      coinsAwarded: coins,
      aiReview: {
        status: 'auto_approved',
        feedbackMessage: hasEvidence ? '✅ 附有生活證據的紀錄已自動通過並存入回憶冊！' : '✅ 生活點滴文字紀錄已自動通過！',
      },
    };

    setGameState(prev => {
      const updatedProfile = checkLevelUp(prev.profiles[currentRole], xp);
      const newProfile: UserProfile = {
        ...updatedProfile,
        coins: updatedProfile.coins + coins,
        completedMissionsCount: updatedProfile.completedMissionsCount + 1,
      };

      return {
        ...prev,
        profiles: {
          ...prev.profiles,
          [currentRole]: newProfile,
        },
        sharedMoments: [fullMoment, ...prev.sharedMoments],
      };
    });

    const act = queueOfflineAction('share_moment', fullMoment);
    setOfflineQueue(prev => [...prev, act]);
  };

  const handleMumReactMoment = (momentId: string, liked: boolean, comment?: string, extraBonus?: boolean, bookmark?: boolean) => {
    setGameState(prev => {
      const targetMoment = prev.sharedMoments.find(m => m.id === momentId);
      if (!targetMoment) return prev;

      let updatedProfiles = prev.profiles;
      if (extraBonus && !targetMoment.mumReaction?.extraXp) {
        const authorRole = targetMoment.userId;
        const currentAuthorProf = prev.profiles[authorRole];
        const leveledProf = checkLevelUp(currentAuthorProf, 10);
        updatedProfiles = {
          ...prev.profiles,
          [authorRole]: {
            ...leveledProf,
            coins: leveledProf.coins + 5,
          },
        };
      }

      const updatedMoments = prev.sharedMoments.map(m => {
        if (m.id !== momentId) return m;
        const prevReaction = m.mumReaction || { liked: false, bookmarkedForScrapbook: false };
        return {
          ...m,
          mumReaction: {
            liked,
            encouragement: comment !== undefined ? comment : prevReaction.encouragement,
            extraXp: extraBonus ? 10 : prevReaction.extraXp,
            extraCoins: extraBonus ? 5 : prevReaction.extraCoins,
            bookmarkedForScrapbook: bookmark !== undefined ? bookmark : prevReaction.bookmarkedForScrapbook,
            reactedAt: new Date().toLocaleString('zh-HK', { dateStyle: 'short', timeStyle: 'short' }),
          },
        };
      });

      return {
        ...prev,
        profiles: updatedProfiles,
        sharedMoments: updatedMoments,
      };
    });
  };

  // 6. Rewards redeem
  const handleRedeemReward = (reward: RewardItem): boolean => {
    if (gameState.activeRole === 'mum') return false;
    const currentRole = gameState.activeRole;

    const profile = gameState.profiles[currentRole];
    if (profile.coins < reward.coinCost) return false;

    const newRedemption = {
      id: 'red_' + Date.now(),
      userId: currentRole,
      rewardId: reward.id,
      rewardTitle: reward.title,
      rewardCategory: reward.category,
      cost: reward.coinCost,
      requestedAt: new Date().toLocaleString('zh-HK', { dateStyle: 'short', timeStyle: 'short' }),
      status: 'pending_gm' as const,
      gmFeedback: '已收到申請，媽媽稍後在香港 GM 面板批准！',
    };

    setGameState(prev => ({
      ...prev,
      profiles: {
        ...prev.profiles,
        [currentRole]: {
          ...prev.profiles[currentRole],
          coins: prev.profiles[currentRole].coins - reward.coinCost,
        },
      },
      redemptions: [newRedemption, ...prev.redemptions],
    }));

    const act = queueOfflineAction('redeem_reward', newRedemption);
    setOfflineQueue(prev => [...prev, act]);
    return true;
  };

  const handleSpinMysteryBox = (): { title: string; rewardDesc: string } => {
    if (gameState.activeRole === 'mum') return { title: '', rewardDesc: '' };
    const currentRole = gameState.activeRole;
    const mysteryPool = [
      { title: '金幣大爆發 (+50 🪙)', coins: 50, tickets: 0, desc: '金幣錢包大豐收，可直接在獎勵目錄兌換心水好物！' },
      { title: '免做一次碗筷特權卡', coins: 15, tickets: 0, desc: '可轉交一次飯後收拾小任務給神秘小精靈。' },
      { title: '自選紐西蘭奇異果冰淇淋一球', coins: 20, tickets: 0, desc: '由祖父母在週末散步時親自帶你挑選！' },
      { title: '幸運雙重彩 (+2 🎟️ Lucky Tickets)', coins: 25, tickets: 2, desc: '幸運之神降臨，獲得 2 張全新抽獎券！' },
      { title: '自選週末睡前聽故事加時 20 分鐘', coins: 10, tickets: 0, desc: '放鬆身心，享受更多精彩小說與廣播劇時光。' },
    ];

    const pick = mysteryPool[Math.floor(Math.random() * mysteryPool.length)];

    setGameState(prev => ({
      ...prev,
      profiles: {
        ...prev.profiles,
        [currentRole]: {
          ...prev.profiles[currentRole],
          luckyTickets: Math.max(0, prev.profiles[currentRole].luckyTickets - 1) + pick.tickets,
          coins: prev.profiles[currentRole].coins + pick.coins,
        },
      },
    }));

    return {
      title: pick.title,
      rewardDesc: pick.desc,
    };
  };

  // 7. Mum console handlers
  const handleSendMumMission = (title: string, description: string, recipient: 'sister_older' | 'sister_younger' | 'both') => {
    const newMission: FamilyMission = {
      id: 'mum_mission_' + Date.now(),
      title: `【媽媽特派】${title}`,
      description,
      recipient: 'Mum (HK)',
      isMumMission: true,
      xpReward: 90,
      coinsReward: 30,
      isCompleted: false,
    };

    setGameState(prev => ({
      ...prev,
      familyMissions: [newMission, ...prev.familyMissions],
    }));

    const act = queueOfflineAction('mum_mission', newMission);
    setOfflineQueue(prev => [...prev, act]);
  };

  const handleReplyReflection = (refId: string, replyText: string, badge: string) => {
    setGameState(prev => ({
      ...prev,
      reflections: prev.reflections.map(r => {
        if (r.id !== refId) return r;
        return {
          ...r,
          mumReply: {
            replyText,
            mumBadge: badge,
            repliedAt: new Date().toLocaleString('zh-HK', { dateStyle: 'short', timeStyle: 'short' }),
          },
        };
      }),
    }));
  };

  const handleApproveRedemption = (redemptionId: string, feedback: string) => {
    setGameState(prev => ({
      ...prev,
      redemptions: prev.redemptions.map(rec =>
        rec.id === redemptionId ? { ...rec, status: 'approved', gmFeedback: feedback } : rec
      ),
    }));
  };

  // 8. Offline Sync
  const handlePerformSync = () => {
    clearOfflineQueue();
    setOfflineQueue([]);
    setGameState(prev => ({
      ...prev,
      lastSyncedAt: new Date().toLocaleString('zh-HK', { dateStyle: 'short', timeStyle: 'short' }),
    }));
    setIsSyncModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-['Plus_Jakarta_Sans'] flex flex-col">
      
      {/* Strict Top Bar Contract Header */}
      <Header
        activeRole={gameState.activeRole}
        profiles={gameState.profiles}
        onSelectRole={handleSelectRole}
        isOffline={isOffline}
        onToggleOffline={handleToggleOffline}
        pendingSyncCount={offlineQueue.length}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'home' && (
          <HomeTab
            activeRole={gameState.activeRole}
            profiles={gameState.profiles}
            dailyMissions={gameState.dailyMissions[gameState.activeRole as 'sister_older' | 'sister_younger'] || gameState.dailyMissions.sister_younger}
            moveState={gameState.moveStates[gameState.activeRole as 'sister_older' | 'sister_younger'] || gameState.moveStates.sister_younger}
            familyTreasure={gameState.familyTreasure}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'maths' && (
          <MathsTab
            activeRole={gameState.activeRole}
            isMathsCompleted={
              (gameState.dailyMissions[gameState.activeRole as 'sister_older' | 'sister_younger'] || gameState.dailyMissions.sister_younger)
                .find(m => m.type === 'maths')?.isCompleted || false
            }
            syllabusUnits={gameState.syllabusUnits[gameState.activeRole as 'sister_older' | 'sister_younger'] || gameState.syllabusUnits.sister_younger}
            onCompleteMaths={handleCompleteMaths}
            onToggleUnitComplete={(unitId) => handleToggleUnitComplete(gameState.activeRole as 'sister_older' | 'sister_younger', unitId)}
            onLogAnswer={handleLogMathAnswer}
          />
        )}

        {activeTab === 'move' && (
          <MoveTab
            activeRole={gameState.activeRole}
            moveState={gameState.moveStates[gameState.activeRole as 'sister_older' | 'sister_younger'] || gameState.moveStates.sister_younger}
            milestones={gameState.walkingMilestones[gameState.activeRole as 'sister_older' | 'sister_younger'] || gameState.walkingMilestones.sister_younger}
            onAddSteps={handleAddSteps}
            onToggleIndoorMode={handleToggleIndoorMode}
            onClaimMilestone={handleClaimMilestone}
            onClaimSuddenBonus={handleClaimSuddenBonus}
          />
        )}

        {activeTab === 'adventure' && (
          <AdventureTab
            activeRole={gameState.activeRole}
            quests={gameState.adventureQuests}
            onCompleteCheckpoint={handleCompleteCheckpoint}
            onClaimTreasure={handleClaimTreasure}
          />
        )}

        {activeTab === 'moments' && (
          <MomentsTab
            activeRole={gameState.activeRole}
            sharedMoments={gameState.sharedMoments}
            onSubmitMoment={handleSubmitMoment}
          />
        )}

        {activeTab === 'family' && (
          <FamilyTab
            activeRole={gameState.activeRole}
            missions={gameState.familyMissions}
            onCompleteMission={handleCompleteFamilyMission}
            onAddLuckyDrawMission={handleAddLuckyDrawMission}
          />
        )}

        {activeTab === 'reflection' && (
          <ReflectionTab
            activeRole={gameState.activeRole}
            reflections={gameState.reflections}
            onSubmitReflection={handleSubmitReflection}
          />
        )}

        {activeTab === 'rewards' && (
          <RewardsTab
            activeRole={gameState.activeRole}
            profiles={gameState.profiles}
            rewardsCatalog={gameState.rewardsCatalog}
            redemptions={gameState.redemptions}
            onRedeemReward={handleRedeemReward}
            onSpinMysteryBox={handleSpinMysteryBox}
          />
        )}

        {activeTab === 'mum_gm' && (
          <MumDashboardTab
            profiles={gameState.profiles}
            dailyMissions={gameState.dailyMissions}
            moveStates={gameState.moveStates}
            reflections={gameState.reflections}
            redemptions={gameState.redemptions}
            syllabusUnits={gameState.syllabusUnits}
            sharedMoments={gameState.sharedMoments}
            mathAnswerLogs={gameState.mathAnswerLogs || []}
            mumGMSettings={gameState.mumGMSettings}
            security={gameState.security}
            onUpdateMumGMSettings={handleUpdateMumGMSettings}
            onUpdateSecurity={handleUpdateSecuritySettings}
            onSendMumMission={handleSendMumMission}
            onReplyReflection={handleReplyReflection}
            onApproveRedemption={handleApproveRedemption}
            onMumReactMoment={handleMumReactMoment}
            onToggleUnitComplete={handleToggleUnitComplete}
          />
        )}
      </main>

      {/* Account Passcode & Anti-Cheating PIN Modal */}
      <PinModal
        isOpen={pinModalState.isOpen}
        targetRole={pinModalState.targetRole}
        targetName={getTargetDisplayName(pinModalState.targetRole)}
        expectedPin={getTargetExpectedPin(pinModalState.targetRole)}
        masterPin={gameState.security?.mumPin || '8888'}
        isDeviceLocked={Boolean(gameState.security?.lockedDeviceRole)}
        onSuccess={handlePinSuccess}
        onClose={() => setPinModalState(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Offline Sync Modal */}
      <OfflineSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        isOffline={isOffline}
        onToggleOffline={handleToggleOffline}
        offlineQueue={offlineQueue}
        lastSyncedAt={gameState.lastSyncedAt}
        onPerformSync={handlePerformSync}
      />

      {/* Subtle Footer conforming to anti-slop rules (clean copyright and timezones) */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span>Real Life Adventure Game</span> · <span>紐西蘭 Temuka, South Canterbury (NZST) ⇌ 香港 (HKT)</span>
          </div>
          <div>
            <span>Offline-First Safe Architecture</span> · <span>Progress &gt; Surveillance</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
