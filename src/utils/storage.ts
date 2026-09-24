import {
  Role,
  UserProfile,
  DailyMissionSummary,
  WalkingMilestone,
  MoveState,
  AdventureQuest,
  FamilyMission,
  DailyReflection,
  RewardItem,
  RedemptionRecord,
  FamilyTreasureStatus,
  OfflineAction,
  SyllabusUnit,
  SharedMoment,
  SecuritySettings,
  MathAnswerLog,
  MumGMSettings,
} from '../types';
import {
  INITIAL_PROFILES,
  INITIAL_DAILY_MISSIONS,
  INITIAL_WALKING_MILESTONES,
  INITIAL_ADVENTURE_QUESTS,
  INITIAL_FAMILY_MISSIONS,
  INITIAL_REFLECTIONS,
  INITIAL_REWARDS,
  INITIAL_REDEMPTIONS,
  INITIAL_FAMILY_TREASURE,
  INITIAL_SYLLABUS_UNITS,
  INITIAL_SHARED_MOMENTS,
  INITIAL_MATH_ANSWER_LOGS,
  INITIAL_MUM_GM_SETTINGS,
} from '../data/initialData';

const STORAGE_KEY = 'real_life_adventure_game_state_v6';
const OFFLINE_QUEUE_KEY = 'real_life_adventure_offline_queue_v6';
const OFFLINE_MODE_KEY = 'real_life_adventure_is_offline_v6';

export interface AppGameState {
  language: 'en' | 'zh';
  security: SecuritySettings;
  activeRole: Role;
  profiles: Record<'sister_older' | 'sister_younger' | 'mum', UserProfile>;
  dailyMissions: Record<'sister_older' | 'sister_younger', DailyMissionSummary[]>;
  moveStates: Record<'sister_older' | 'sister_younger', MoveState>;
  walkingMilestones: Record<'sister_older' | 'sister_younger', WalkingMilestone[]>;
  adventureQuests: AdventureQuest[];
  familyMissions: FamilyMission[];
  reflections: DailyReflection[];
  rewardsCatalog: RewardItem[];
  redemptions: RedemptionRecord[];
  familyTreasure: FamilyTreasureStatus;
  syllabusUnits: Record<'sister_older' | 'sister_younger', SyllabusUnit[]>;
  sharedMoments: SharedMoment[];
  mathAnswerLogs: MathAnswerLog[];
  mumGMSettings: MumGMSettings;
  lastSyncedAt: string;
}

export function getInitialGameState(): AppGameState {
  return {
    language: 'en',
    security: {
      pinProtectionEnabled: true,
      mumPin: '8888',
      jessiePin: '5678',
      jasminePin: '1234',
      lockedDeviceRole: null,
    },
    activeRole: 'sister_younger',
    profiles: INITIAL_PROFILES,
    dailyMissions: INITIAL_DAILY_MISSIONS,
    moveStates: {
      sister_older: {
        currentSteps: 2450,
        targetSteps: 4000,
        isIndoorMode: false,
        activeBonusMission: {
          id: 'bonus_older_1',
          description: 'Walk 600 more steps along Taumatakahu track to unlock green mystery box!',
          requiredExtraSteps: 600,
          stepsRemaining: 350,
          rewardCoins: 25,
          rewardTickets: 1,
        },
      },
      sister_younger: {
        currentSteps: 3120,
        targetSteps: 5000,
        isIndoorMode: false,
        activeBonusMission: {
          id: 'bonus_younger_1',
          description: 'Walk 500 more steps along Murray St track to trigger surprise detective chest!',
          requiredExtraSteps: 500,
          stepsRemaining: 210,
          rewardCoins: 30,
          rewardTickets: 1,
        },
      },
    },
    walkingMilestones: {
      sister_older: INITIAL_WALKING_MILESTONES,
      sister_younger: INITIAL_WALKING_MILESTONES,
    },
    adventureQuests: INITIAL_ADVENTURE_QUESTS,
    familyMissions: INITIAL_FAMILY_MISSIONS,
    reflections: INITIAL_REFLECTIONS,
    rewardsCatalog: INITIAL_REWARDS,
    redemptions: INITIAL_REDEMPTIONS,
    familyTreasure: INITIAL_FAMILY_TREASURE,
    syllabusUnits: INITIAL_SYLLABUS_UNITS,
    sharedMoments: INITIAL_SHARED_MOMENTS,
    mathAnswerLogs: INITIAL_MATH_ANSWER_LOGS,
    mumGMSettings: INITIAL_MUM_GM_SETTINGS,
    lastSyncedAt: 'Just now',
  };
}

export function loadGameState(): AppGameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('real_life_adventure_game_state_v5');
    if (!raw) {
      const initial = getInitialGameState();
      saveGameState(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    
    // Preset language to English as requested
    if (!parsed.language) {
      parsed.language = 'en';
    }
    
    // Security & anti-cheat PIN settings
    if (!parsed.security) {
      parsed.security = {
        pinProtectionEnabled: true,
        mumPin: '8888',
        jessiePin: '5678',
        jasminePin: '1234',
        lockedDeviceRole: null,
      };
    }

    // Force migration of names to Jasmine, Jessie, and Mum
    if (parsed.profiles) {
      if (parsed.profiles.sister_younger) {
        parsed.profiles.sister_younger.name = 'Jasmine';
        parsed.profiles.sister_younger.roleLabel = 'Jasmine';
      }
      if (parsed.profiles.sister_older) {
        parsed.profiles.sister_older.name = 'Jessie';
        parsed.profiles.sister_older.roleLabel = 'Jessie';
      }
      if (parsed.profiles.mum) {
        parsed.profiles.mum.name = 'Mum';
        parsed.profiles.mum.roleLabel = 'Mum';
      }
    }

    if (!parsed.syllabusUnits || !parsed.syllabusUnits.sister_younger?.[0]?.strand) {
      parsed.syllabusUnits = INITIAL_SYLLABUS_UNITS;
    }
    if (!parsed.sharedMoments) {
      parsed.sharedMoments = INITIAL_SHARED_MOMENTS;
    }
    if (!parsed.mathAnswerLogs || parsed.mathAnswerLogs.length === 0) {
      parsed.mathAnswerLogs = INITIAL_MATH_ANSWER_LOGS;
    }
    if (!parsed.mumGMSettings) {
      parsed.mumGMSettings = INITIAL_MUM_GM_SETTINGS;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load state from localStorage:', err);
    return getInitialGameState();
  }
}

export function saveGameState(state: AppGameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
  }
}

export function getOfflineMode(): boolean {
  try {
    return localStorage.getItem(OFFLINE_MODE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setOfflineMode(isOffline: boolean): void {
  try {
    localStorage.setItem(OFFLINE_MODE_KEY, String(isOffline));
  } catch (err) {
    console.error('Failed to set offline mode:', err);
  }
}

export function getOfflineQueue(): OfflineAction[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function queueOfflineAction(actionType: OfflineAction['actionType'], payload: any): OfflineAction {
  const newAction: OfflineAction = {
    id: 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    actionType,
    payload,
    timestamp: new Date().toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    synced: false,
  };

  try {
    const queue = getOfflineQueue();
    queue.push(newAction);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Failed to queue offline action:', err);
  }

  return newAction;
}

export function clearOfflineQueue(): void {
  try {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch (err) {
    console.error('Failed to clear offline queue:', err);
  }
}
