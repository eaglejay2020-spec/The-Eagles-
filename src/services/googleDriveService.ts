import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { SharedMoment, MathAnswerLog, SyllabusUnit } from '../types';

// Initialize Firebase App instance safely (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Configure Google Auth Provider with Google Drive file scope
export const DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const provider = new GoogleAuthProvider();
DRIVE_SCOPES.forEach(scope => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account',
});

// Flag to track ongoing sign in flow
let isSigningIn = false;
// Cache the access token in memory (never in localStorage/sessionStorage as required)
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // If user is logged into Firebase session but access token is not in memory,
        // let the component request user to connect with Google
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google Drive access token from authentication.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign In error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logoutGoogle = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

export interface DriveSyncResult {
  fileId: string;
  fileName: string;
  webViewLink?: string;
  syncedAt: string;
  folderPath?: string;
}

/**
 * Format math answer logs into CSV matching the HK Mom specification:
 * Field: Date, Daughter, Form, Question ID, Topic, Topic (中文), Skill, Skill (中文), Correct / Wrong, Time Spent, Attempts, Difficulty, Source, Notes
 */
export const formatMathAnswerLogsCsv = (logs: MathAnswerLog[]): string => {
  const header = [
    'Date',
    'Daughter',
    'Form',
    'Question ID',
    'Topic',
    'Topic (中文)',
    'Skill',
    'Skill (中文)',
    'Correct / Wrong',
    'Time Spent',
    'Attempts',
    'Difficulty',
    'Source',
    'Notes',
  ].join(',');

  const rows = logs.map(log => {
    const cleanNotes = `"${(log.notes || '').replace(/"/g, '""')}"`;
    const cleanTopic = `"${(log.topicEn || log.topic || '').replace(/"/g, '""')}"`;
    const cleanTopicZh = `"${(log.topicZh || '').replace(/"/g, '""')}"`;
    const cleanSkill = `"${(log.skillEn || log.skill || '').replace(/"/g, '""')}"`;
    const cleanSkillZh = `"${(log.skillZh || '').replace(/"/g, '""')}"`;
    const timeSpent = `${log.timeSpentSeconds} seconds`;
    const correctStr = log.isCorrect ? 'Correct' : 'Wrong';
    const logDate = log.date || log.dateStr || new Date().toISOString().split('T')[0];
    return [
      logDate,
      log.daughter,
      log.form,
      log.questionId,
      cleanTopic,
      cleanTopicZh,
      cleanSkill,
      cleanSkillZh,
      correctStr,
      timeSpent,
      log.attempts,
      log.difficulty,
      `"${log.source}"`,
      cleanNotes,
    ].join(',');
  });

  return [header, ...rows].join('\n');
};

/**
 * Generate Weak & Strong summary JSON for Mom Dashboard & Google Drive
 */
export const generateWeakStrongSummaryJson = (
  logs: MathAnswerLog[],
  daughter: '妹妹' | '姐姐'
) => {
  const isMatch = (l: MathAnswerLog) =>
    daughter === '妹妹'
      ? l.daughter === '妹妹' || l.daughter === 'Jasmine' || l.userId === 'sister_younger'
      : l.daughter === '姐姐' || l.daughter === 'Jessie' || l.userId === 'sister_older';

  const filtered = logs.filter(isMatch);
  const topicMap: Record<string, { total: number; correct: number; totalTime: number; topicZh: string; skills: Record<string, { total: number; correct: number; skillZh: string }> }> = {};

  filtered.forEach(log => {
    const topicKey = log.topicEn || log.topic || 'General';
    const skillKey = log.skillEn || log.skill || 'Technique';

    if (!topicMap[topicKey]) {
      topicMap[topicKey] = {
        total: 0,
        correct: 0,
        totalTime: 0,
        topicZh: log.topicZh || topicKey,
        skills: {},
      };
    }
    topicMap[topicKey].total += 1;
    if (log.isCorrect) topicMap[topicKey].correct += 1;
    topicMap[topicKey].totalTime += log.timeSpentSeconds;

    if (!topicMap[topicKey].skills[skillKey]) {
      topicMap[topicKey].skills[skillKey] = { total: 0, correct: 0, skillZh: log.skillZh || skillKey };
    }
    topicMap[topicKey].skills[skillKey].total += 1;
    if (log.isCorrect) topicMap[topicKey].skills[skillKey].correct += 1;
  });

  const accuracyByTopic = Object.entries(topicMap).map(([topic, data]) => {
    const accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
    const avgTime = data.total > 0 ? Math.round(data.totalTime / data.total) : 0;
    return {
      topic,
      topicZh: data.topicZh,
      totalAnswered: data.total,
      correctCount: data.correct,
      accuracyRatePercent: accuracy,
      averageTimeSeconds: avgTime,
      status: accuracy >= 85 && avgTime <= 45 ? 'strong' : accuracy < 60 || avgTime > 80 ? 'weak' : 'normal',
      skills: Object.entries(data.skills).map(([skill, sData]) => ({
        skill,
        skillZh: sData.skillZh,
        accuracyPercent: Math.round((sData.correct / sData.total) * 100),
        total: sData.total,
      })),
    };
  });

  const weakAreas = accuracyByTopic.filter(t => t.status === 'weak');
  const strongAreas = accuracyByTopic.filter(t => t.status === 'strong');

  const suggestedPractice = weakAreas.length > 0
    ? `Recommend focusing on: ${weakAreas.map(w => `${w.topic} (${w.topicZh})`).join(', ')}`
    : `Excellent performance! Continue advancing to upcoming syllabus chapters.`;

  return {
    daughter,
    form: daughter === '妹妹' ? 'Form 1' : 'Form 3',
    generatedAt: new Date().toISOString(),
    overallAccuracy: filtered.length > 0
      ? Math.round((filtered.filter(l => l.isCorrect).length / filtered.length) * 100)
      : 0,
    totalQuestionsLogged: filtered.length,
    weakAreas: weakAreas.map(w => ({
      topic: w.topic,
      topicZh: w.topicZh,
      accuracy: `${w.accuracyRatePercent}%`,
      avgTime: `${w.averageTimeSeconds}s`,
      issue: w.accuracyRatePercent < 60 ? 'Accuracy below 60%' : 'Time spent excessively long',
    })),
    strongAreas: strongAreas.map(s => ({
      topic: s.topic,
      topicZh: s.topicZh,
      accuracy: `${s.accuracyRatePercent}%`,
      avgTime: `${s.averageTimeSeconds}s`,
      badge: 'High Accuracy & Fast Pace',
    })),
    accuracyByTopic,
    suggestedPractice,
  };
};

/**
 * Generate Progress Tracker JSON for Mom Dashboard & Google Drive
 */
export const generateProgressTrackerJson = (
  syllabus: SyllabusUnit[],
  form: 'Form 1' | 'Form 3'
) => {
  const completed = syllabus.filter(u => u.status === 'completed' || u.isCompleted);
  const inProgress = syllabus.filter(u => u.status === 'in_progress');
  const notStarted = syllabus.filter(u => u.status === 'not_started' && !u.isCompleted);
  const overallPercent = Math.round((completed.length / (syllabus.length || 1)) * 100);

  const strands = ['Number and Algebra', 'Measures, Shape and Space', 'Data Handling'] as const;
  const strandBreakdown = strands.map(st => {
    const units = syllabus.filter(u => u.strand === st);
    const stCompleted = units.filter(u => u.status === 'completed' || u.isCompleted);
    const percent = units.length > 0 ? Math.round((stCompleted.length / units.length) * 100) : 0;
    return {
      strand: st,
      completionPercent: percent,
      units: units.map(u => ({
        unitCode: u.unitCode,
        nameEn: u.nameEn,
        nameZh: u.nameZh,
        status: u.isCompleted || u.status === 'completed' ? 'Completed' : u.status === 'in_progress' ? 'In Progress' : 'Not started',
        progress: `${u.totalQuestionsMastered}/${u.targetQuestions}`,
      })),
    };
  });

  return {
    form,
    overallCompletionPercent: overallPercent,
    estimatedCompletion: 'June 2027',
    lastUpdated: new Date().toISOString(),
    totalUnits: syllabus.length,
    completedUnitsCount: completed.length,
    inProgressUnitsCount: inProgress.length,
    notStartedUnitsCount: notStarted.length,
    strands: strandBreakdown,
  };
};

/**
 * Format Scrapbook Markdown
 */
export const formatScrapbookMarkdown = (moments: SharedMoment[]): string => {
  const nowStr = new Date().toLocaleString('zh-HK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  let md = `# 📖 New Zealand Family Memory Book · Chapter 1: Everyday Moments & Footprints\n`;
  md += `**Temuka & Christchurch Family Digital Memory Book**\n\n`;
  md += `> **Last Backup Time**: ${nowStr}\n`;
  md += `> **Family Members**: Jasmine (Form 1), Jessie (Form 3), Mum (Remote GM)\n`;
  md += `> **Bookmarked Moments**: ${moments.length} curated memories\n\n`;
  md += `---\n\n`;

  moments.forEach((m, idx) => {
    const author = m.userId === 'sister_younger' ? 'Jasmine' : 'Jessie';
    md += `### 🌸 Memory #${idx + 1}: ${author} · ${m.dateStr} (${m.submittedAt})\n\n`;
    md += `- **Mood**: ${m.mood}\n`;
    md += `- **Location**: 📍 ${m.location}\n`;
    if (m.companions && m.companions.length > 0) {
      md += `- **Companions**: ${m.companions.join(', ')}\n`;
    }
    md += `- **Rewards Earned**: +${m.xpAwarded} XP · +${m.coinsAwarded} Coins\n\n`;
    md += `#### 📝 Story Note:\n${m.titleOrEvent}\n\n`;

    if (m.photoUrl) {
      md += `#### 📷 影像紀錄：\n![Moment Photo](${m.photoUrl})\n\n`;
    }

    if (m.mumReaction?.encouragement) {
      md += `> 💌 **媽媽的回覆 (${m.mumReaction.reactedAt || '已確認'})**：\n`;
      md += `> "${m.mumReaction.encouragement}"\n\n`;
    }

    md += `---\n\n`;
  });

  md += `\n*由 Real Life Adventure Game 自動匯出備份至媽媽 Google Drive 帳戶*\n`;
  return md;
};

/**
 * Uploads a text/json/csv file to Mum's Google Drive with specified path in name/description
 */
export const uploadFileToDrive = async (
  filename: string,
  content: string,
  mimeType: string,
  folderPathDescription: string
): Promise<DriveSyncResult> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('請先使用 Google 帳戶登入以授權儲存至 Google Drive。');
  }

  const boundary = '-------314159265358979323846' + Date.now();
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: filename,
    description: `Target Path: ${folderPathDescription}`,
    mimeType: mimeType,
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n` +
    content +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Drive Upload error:', errorText);
    throw new Error(`Google Drive 上傳失敗 (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  const now = new Date().toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' });

  return {
    fileId: result.id,
    fileName: result.name || filename,
    webViewLink: result.webViewLink,
    syncedAt: now,
    folderPath: folderPathDescription,
  };
};

/**
 * Uploads or updates the Scrapbook Chapter in Mum's Google Drive
 */
export const uploadScrapbookToDrive = async (
  moments: SharedMoment[],
  customTitle?: string
): Promise<DriveSyncResult> => {
  const fileName = customTitle || `Temuka_Family_Memory_Book_Chapter_1.md`;
  const fileContent = formatScrapbookMarkdown(moments);
  return uploadFileToDrive(
    fileName,
    fileContent,
    'text/markdown',
    '/RealLifeAdventureGame/ShareMoments/'
  );
};

/**
 * Downloads a file locally to browser as a fallback or immediate export
 */
export const downloadFileLocally = (fileName: string, content: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
