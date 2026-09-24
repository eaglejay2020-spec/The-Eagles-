export type Role = 'sister_older' | 'sister_younger' | 'mum';

export interface UserProfile {
  id: Role;
  name: string;
  roleLabel: string;
  age?: number;
  grade?: string; // Form 3 or Form 1
  location: string; // "Auckland, New Zealand" or "Hong Kong"
  avatar: string;
  themeStyle: 'sleek_adventurer' | 'anime_detective' | 'game_master';
  level: number;
  xp: number;
  xpToNextLevel: number;
  coins: number;
  luckyTickets: number;
  streakDays: number;
  completedMissionsCount: number;
  personalProgressNote: string;
}

export type MissionType = 'maths' | 'move' | 'adventure' | 'family' | 'reflection';

export interface DailyMissionSummary {
  id: string;
  type: MissionType;
  title: string;
  subtitle: string;
  icon: string;
  xpReward: number;
  coinsReward: number;
  ticketReward?: number;
  isCompleted: boolean;
  completedAt?: string;
  detailSnippet?: string;
}

// HK Curriculum Maths
export type CurriculumStrand = 'Number and Algebra' | 'Measures, Shape and Space' | 'Data Handling';

export interface SyllabusUnit {
  id: string;
  grade: 'Form 1' | 'Form 3';
  chapterNumber: number;
  unitCode: string;
  strand: CurriculumStrand;
  nameZh: string;
  nameEn: string;
  keyConcepts: string[];
  status: 'completed' | 'in_progress' | 'not_started';
  isCompleted: boolean;
  completedDate?: string;
  totalQuestionsMastered: number;
  targetQuestions: number;
}

export interface MathQuestion {
  id: string;
  grade: 'Form 1' | 'Form 3';
  unitCode: string;
  sourceExamSchool?: string; // Real HK school exam paper source / STAR / Textbook
  source?: string; // e.g. "School Paper" | "STAR" | "Textbook"
  topic: string;
  topicEn: string;
  topicZh: string;
  skillEn: string;
  skillZh: string;
  questionText: string;
  questionTextEn: string;
  questionTextZh: string;
  exampleSnippet?: string; // "Example: If you have -3 and add 7, you get 4."
  formulaOrDiagram?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  explanationEn?: string;
  explanationZh?: string;
  detectiveClueSnippet?: string; // For Jasmine's detective clue revelation
  difficulty: 'normal' | 'challenge' | 'boss';
  difficultyLevel: 'Easy' | 'Medium' | 'Hard';
}

export interface MathAnswerLog {
  id: string;
  dateStr?: string; // YYYY-MM-DD
  date?: string; // Date alias for Drive CSV specification
  timestamp?: string; // HH:mm:ss
  daughter: 'Jasmine' | 'Jessie' | '妹妹' | '姐姐' | string;
  userId?: 'sister_younger' | 'sister_older';
  daughterId?: 'sister_younger' | 'sister_older';
  form: 'Form 1' | 'Form 3';
  questionId: string;
  topic?: string;
  topicEn?: string;
  topicZh: string;
  skill?: string;
  skillEn?: string;
  skillZh: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  attempts: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  source: string;
  userAnswerText?: string;
  notes?: string;
  createdAt?: string;
}

export interface TopicAccuracySummary {
  topicEn: string;
  topicZh: string;
  skillEn?: string;
  skillZh?: string;
  totalAnswered: number;
  correctCount: number;
  accuracyRate: number; // 0 to 1
  avgTimeSeconds: number;
  status: 'weak' | 'strong' | 'normal';
}

export interface MumGMSettings {
  dashboardLanguage: 'zh' | 'en'; // default 'zh' for Mum
  mathDailyCount: number; // default 10
  speedChallengeEnabled: boolean;
  bossQuestionEnabled: boolean;
  difficultyMultiplier: 'Standard' | 'Challenging' | 'Advanced';
  dailyStepTargetYounger: number;
  dailyStepTargetOlder: number;
  walkingSurpriseProbability: number; // e.g. 35
  dailySurpriseCap: number; // e.g. 3
  pityGuaranteedSteps: number; // e.g. 1500
  indoorModeYounger: boolean;
  indoorModeOlder: boolean;
  autoUpdateEnabled: boolean;
  wifiOnlySync: boolean;
  googleDriveSyncEnabled: boolean;
  backupFrequency: 'instant' | 'daily' | 'weekly';
  appVersion: string;
  cloudQuestionBankVersion: string;
  contentVersion: string;
  lastUpdateCheckAt: string;
}

export interface MathsSessionState {
  currentQuestionIndex: number;
  answers: (number | null)[];
  isFinished: boolean;
  score: number;
  revealedClues: string[];
  speedChallengeActive?: boolean;
  timeSpentSeconds: number;
}

// Move / Walking
export interface WalkingMilestone {
  stepThreshold: number;
  title: string;
  description: string;
  rewardType: 'mission' | 'chest' | 'map_fragment' | 'puzzle' | 'final_clue';
  rewardLabel: string;
  isUnlocked: boolean;
}

export interface MoveState {
  currentSteps: number;
  targetSteps: number;
  isIndoorMode: boolean; // Weather or indoor alternative
  activeBonusMission?: {
    id: string;
    description: string;
    requiredExtraSteps: number;
    stepsRemaining: number;
    rewardCoins: number;
    rewardTickets: number;
  };
}

// Adventure & Treasure Hunt
export interface AdventureCheckpoint {
  id: string;
  stepNumber: number;
  title: string;
  hint: string;
  riddleOrMathClue?: string;
  taskPrompt: string; // e.g., "Find something red and take a photo"
  verificationType: 'photo' | 'cipher' | 'text';
  cipherAnswer?: string;
  isCompleted: boolean;
  photoDataUrl?: string;
  userNote?: string;
}

export interface AdventureQuest {
  id: string;
  targetRole: 'sister_younger' | 'sister_older' | 'both';
  title: string;
  category: 'detective_case' | 'urban_nature' | 'co_op_mystery';
  description: string;
  caseBrief?: {
    victim?: string;
    mysteryItem: string;
    suspects: { name: string; trait: string; alibi: string; isSuspect: boolean }[];
  };
  checkpoints: AdventureCheckpoint[];
  finalTreasureUnlocked: boolean;
  xpReward: number;
  coinsReward: number;
  ticketsReward: number;
}

// Family Missions
export interface FamilyMission {
  id: string;
  title: string;
  description: string;
  recipient: 'Grandma' | 'Grandpa' | 'Both Grandparents' | 'Mum (HK)' | 'Sister';
  isWeeklyLuckyDraw?: boolean;
  isMumMission?: boolean;
  xpReward: number;
  coinsReward: number;
  isCompleted: boolean;
  completedNote?: string;
  photoUrl?: string;
}

// Daily Reflection
export interface DailyReflection {
  id: string;
  date: string;
  userId: Role;
  language: 'zh' | 'en';
  highlightHappy: string; // 今日最開心
  highlightMeaningful: string; // 一件有感覺的事
  highlightHard: string; // 最辛苦/學到嘅事
  mood: 'joyful' | 'curious' | 'peaceful' | 'tired' | 'excited';
  audioNoteUrl?: string;
  hasAudioClip: boolean;
  submittedAt: string;
  mumReply?: {
    replyText: string;
    audioStamp?: string;
    repliedAt: string;
    mumBadge: string;
  };
}

// Reward Catalog
export type RewardCategory = 'digital_time' | 'physical_goods' | 'privilege' | 'mystery';

export interface RewardItem {
  id: string;
  title: string;
  description: string;
  category: RewardCategory;
  coinCost: number;
  ticketCost?: number;
  icon: string;
  applicableRoles: Role[]; // sister_older, sister_younger, or both
  badgeTag?: string;
}

export interface RedemptionRecord {
  id: string;
  userId: Role;
  rewardId: string;
  rewardTitle: string;
  rewardCategory: RewardCategory;
  cost: number;
  requestedAt: string;
  status: 'pending_gm' | 'approved' | 'delivered';
  gmFeedback?: string;
}

// Family Shared Treasure
export interface FamilyTreasureStatus {
  targetMissions: number;
  currentMissions: number;
  rewardDescription: string;
  unlocked: boolean;
}

// 📸 分享時刻 (Share a Moment)
export type MomentMood = '😍' | '😮' | '😅' | '🤩' | '😌';

export interface SharedMoment {
  id: string;
  userId: Role;
  titleOrEvent: string; // 係咩事？/ What happened?
  location: string;     // 喺邊度？/ Where? e.g. Auntie 屋企（Christchurch）
  companions: string[]; // 同邊個一齊？
  mood: MomentMood;      // 心情？
  evidenceType?: 'photo' | 'voice' | 'drawing';
  photoUrl?: string;
  voiceNoteUrl?: string;
  drawingDataUrl?: string;
  submittedAt: string;
  dateStr: string;      // YYYY-MM-DD
  xpAwarded: number;
  coinsAwarded: number;
  aiReview: {
    status: 'auto_approved' | 'flagged_duplicate' | 'upgraded_to_first_time' | 'needs_review';
    similarityScore?: number;
    feedbackMessage?: string;
  };
  mumReaction?: {
    liked: boolean;
    encouragement?: string;
    extraXp?: number;
    extraCoins?: number;
    bookmarkedForScrapbook: boolean;
    reactedAt?: string;
  };
}

// Offline Action Queue
export interface OfflineAction {
  id: string;
  actionType: 'complete_math' | 'log_walk' | 'checkpoint_evidence' | 'family_done' | 'submit_reflection' | 'redeem_reward' | 'mum_mission' | 'share_moment';
  payload: any;
  timestamp: string;
  synced: boolean;
}

// Account Switching & Anti-Cheating Security Settings
export interface SecuritySettings {
  pinProtectionEnabled: boolean;
  mumPin: string;     // Default: "8888"
  jessiePin: string;  // Default: "5678"
  jasminePin: string; // Default: "1234"
  lockedDeviceRole: Role | null; // e.g. "sister_younger" locks this device so account cannot easily be swapped
}

