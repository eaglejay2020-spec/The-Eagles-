import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Role, MathQuestion, SyllabusUnit, MathAnswerLog } from '../types';
import { FORM_1_QUESTIONS, FORM_3_QUESTIONS } from '../data/initialData';
import { sounds } from '../utils/sound';
import {
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  HelpCircle,
  Trophy,
  Flame,
  Award,
  Zap,
  ArrowRight,
  RotateCcw,
  FileSearch,
  Check,
  BookOpen,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Landmark,
  ShieldCheck,
  Languages
} from 'lucide-react';

interface MathsTabProps {
  activeRole: Role;
  isMathsCompleted: boolean;
  syllabusUnits: SyllabusUnit[];
  onCompleteMaths: (score: number, speedBonus: boolean) => void;
  onToggleUnitComplete?: (unitId: string) => void;
  onLogAnswer?: (log: MathAnswerLog) => void;
}

export const MathsTab: React.FC<MathsTabProps> = ({
  activeRole,
  isMathsCompleted,
  syllabusUnits,
  onCompleteMaths,
  onToggleUnitComplete,
  onLogAnswer,
}) => {
  const isYounger = activeRole === 'sister_younger';
  const daughterName = isYounger ? 'Jasmine' : 'Jessie';
  const daughterZh = isYounger ? '妹妹' : '姐姐';
  const formTitle = isYounger ? 'Form 1' : 'Form 3';
  const questions: MathQuestion[] = isYounger ? FORM_1_QUESTIONS : FORM_3_QUESTIONS;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(new Array(10).fill(null));
  const [submittedStates, setSubmittedStates] = useState<boolean[]>(new Array(10).fill(false));
  const [attemptsCount, setAttemptsCount] = useState<number[]>(new Array(10).fill(0));
  const [revealedClues, setRevealedClues] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showSyllabusModal, setShowSyllabusModal] = useState(false);
  const [showChineseRef, setShowChineseRef] = useState(true);

  // Speed Challenge for Jessie (Form 3)
  const [speedChallengeActive, setSpeedChallengeActive] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(300); // 5 minutes
  const [timerRunning, setTimerRunning] = useState(false);

  // Question Start Time tracking for performance metrics
  const questionStartTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    questionStartTimeRef.current = Date.now();
  }, [currentIndex]);

  // Timer effect for Speed Challenge
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && secondsRemaining > 0 && !isFinished) {
      interval = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            setTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, secondsRemaining, isFinished]);

  const currentQ = questions[currentIndex] || questions[0];
  const currentSelected = selectedAnswers[currentIndex];
  const isCurrentSubmitted = submittedStates[currentIndex];

  const handleSelectOption = (optIndex: number) => {
    if (isCurrentSubmitted || isFinished) return;
    sounds.playTap();
    const newAnswers = [...selectedAnswers];
    newAnswers[currentIndex] = optIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleConfirmAnswer = () => {
    if (currentSelected === null || isCurrentSubmitted) return;

    const timeSpentSeconds = Math.max(
      1,
      Math.round((Date.now() - questionStartTimeRef.current) / 1000)
    );
    const newAttempts = [...attemptsCount];
    newAttempts[currentIndex] = (newAttempts[currentIndex] || 0) + 1;
    setAttemptsCount(newAttempts);

    const isCorrect = currentSelected === currentQ.correctIndex;
    const newSubmitted = [...submittedStates];
    newSubmitted[currentIndex] = true;
    setSubmittedStates(newSubmitted);
    setShowExplanation(true);

    // Create and emit detailed MathAnswerLog matching Mom Dashboard and Google Drive specification
    const logEntry: MathAnswerLog = {
      id: `log_${formTitle.toLowerCase().replace(' ', '')}_${Date.now()}_${currentIndex + 1}`,
      dateStr: new Date().toISOString().split('T')[0],
      timestamp: new Date().toTimeString().split(' ')[0],
      daughter: daughterName,
      userId: isYounger ? 'sister_younger' : 'sister_older',
      form: isYounger ? 'Form 1' : 'Form 3',
      questionId: `Q-${String(currentIndex + 1).padStart(3, '0')}`,
      topicEn: currentQ.topicEn || currentQ.topic,
      topicZh: currentQ.topicZh || currentQ.topic,
      skillEn: currentQ.skillEn || 'Algebraic Technique',
      skillZh: currentQ.skillZh || '基本運算',
      isCorrect,
      timeSpentSeconds,
      attempts: newAttempts[currentIndex],
      difficulty: currentQ.difficultyLevel || (currentQ.difficulty === 'boss' ? 'Hard' : currentQ.difficulty === 'challenge' ? 'Hard' : 'Medium'),
      source: currentQ.source || (currentQ.sourceExamSchool ? 'School Paper' : 'Textbook'),
      notes: isCorrect
        ? `Solved in ${timeSpentSeconds}s on attempt #${newAttempts[currentIndex]}.`
        : `Answered ${currentQ.options[currentSelected]}. Conceptual revision needed.`,
    };

    if (onLogAnswer) {
      onLogAnswer(logEntry);
    }

    if (isCorrect) {
      sounds.playCorrect();
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });

      // In Form 1 detective mode, reveal clue every 2 correct answers
      if (isYounger && currentQ.detectiveClueSnippet) {
        if (!revealedClues.includes(currentQ.detectiveClueSnippet)) {
          setRevealedClues(prev => [...prev, currentQ.detectiveClueSnippet!]);
        }
      }
    } else {
      sounds.playWrong();
    }
  };

  const handleNextQuestion = () => {
    sounds.playTap();
    if (currentIndex < 9) {
      setCurrentIndex(prev => prev + 1);
      setShowExplanation(submittedStates[currentIndex + 1] || false);
    } else {
      // Finished all 10 questions
      setIsFinished(true);
      setTimerRunning(false);
      const correctCount = selectedAnswers.reduce<number>((acc: number, ans: number | null, idx: number) => {
        return ans === questions[idx]?.correctIndex ? acc + 1 : acc;
      }, 0);

      const speedBonus = speedChallengeActive && secondsRemaining > 0;
      sounds.playFanfare();
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      onCompleteMaths(correctCount, speedBonus);
    }
  };

  const handleStartSpeedChallenge = () => {
    sounds.playTap();
    setSpeedChallengeActive(true);
    setTimerRunning(true);
    setSecondsRemaining(300);
  };

  const handleRestart = () => {
    sounds.playTap();
    setCurrentIndex(0);
    setSelectedAnswers(new Array(10).fill(null));
    setSubmittedStates(new Array(10).fill(false));
    setAttemptsCount(new Array(10).fill(0));
    setRevealedClues([]);
    setIsFinished(false);
    setShowExplanation(false);
    setSpeedChallengeActive(false);
    setTimerRunning(false);
    setSecondsRemaining(300);
    questionStartTimeRef.current = Date.now();
  };

  const correctCount = selectedAnswers.reduce<number>((acc: number, ans: number | null, idx: number) => {
    return ans === questions[idx]?.correctIndex ? acc + 1 : acc;
  }, 0);

  // Group syllabus units by the 3 official HK Curriculum Strands
  const strandsList = ['Number and Algebra', 'Measures, Shape and Space', 'Data Handling'] as const;
  const completedUnits = syllabusUnits.filter(u => u.isCompleted || u.status === 'completed');
  const syllabusProgressPercent = Math.round((completedUnits.length / (syllabusUnits.length || 1)) * 100);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Top Banner: Grade & Current Chapter Notice */}
      <div className="bg-slate-850 border border-slate-700/80 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Hong Kong Curriculum · Daily Practice
              </span>
              <span className="text-xs text-slate-400">10 Questions</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-['Outfit'] tracking-tight flex items-center gap-2">
              <span>
                {isYounger
                  ? `🕵️‍♀️ ${daughterName}'s Math Investigation`
                  : `⚡ ${daughterName}'s Math Challenge`}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              {isYounger
                ? 'Practice questions from authentic school examinations. Solve to uncover case clues.'
                : 'Proofs and algebraic problem solving with speed challenge and boss questions.'}
            </p>
          </div>

          {/* Quick Syllabus Tracker Button */}
          <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
            <button
              onClick={() => {
                sounds.playTap();
                setShowSyllabusModal(!showSyllabusModal);
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Syllabus Progress ({completedUnits.length}/{syllabusUnits.length})</span>
              {showSyllabusModal ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <div className="text-[11px] text-slate-400">
              Completion: <strong className="text-emerald-400 font-mono">{syllabusProgressPercent}%</strong>
            </div>
          </div>
        </div>

        {/* Current Active Topic Banner */}
        <div className="bg-slate-900/95 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-amber-400 font-mono tracking-wider">
                  🎯 Active Topic: {currentQ.topicEn || currentQ.topic}
                </span>
                {currentQ.topicZh && (
                  <span className="text-[11px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-medium">
                    {currentQ.topicZh}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Target Skill: <span className="text-slate-200">{currentQ.skillEn}</span>
                {currentQ.skillZh && <span className="text-slate-400 ml-1.5">({currentQ.skillZh})</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChineseRef(!showChineseRef)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-[11px] font-medium flex items-center gap-1.5 cursor-pointer"
              title="Toggle Chinese reference text"
            >
              <Languages className="w-3.5 h-3.5 text-amber-400" />
              <span>{showChineseRef ? 'Hide Chinese Ref' : 'Show 中文對照'}</span>
            </button>
          </div>
        </div>

        {/* Expandable Syllabus Checklist (With Strikethrough for In-Progress & Completed) */}
        {showSyllabusModal && (
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Hong Kong Mathematics Syllabus Progress
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Target: June 2027 completion
              </span>
            </div>

            {/* 3 Strands Breakdown */}
            <div className="space-y-4">
              {strandsList.map(strandName => {
                const unitsInStrand = syllabusUnits.filter(u => u.strand === strandName);
                if (unitsInStrand.length === 0) return null;
                const strandCompleted = unitsInStrand.filter(u => u.isCompleted || u.status === 'completed');
                const strandPercent = Math.round((strandCompleted.length / unitsInStrand.length) * 100);

                return (
                  <div key={strandName} className="bg-slate-850/90 rounded-xl p-3.5 border border-slate-750 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 font-mono">
                        {strandName}
                      </span>
                      <span className="text-[11px] font-mono text-emerald-400">
                        {strandPercent}% ({strandCompleted.length}/{unitsInStrand.length})
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {unitsInStrand.map(unit => {
                        const isUnitCompleted = unit.isCompleted || unit.status === 'completed';
                        const isUnitInProgress = unit.status === 'in_progress';
                        return (
                          <div
                            key={unit.id}
                            className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                              isUnitCompleted
                                ? 'bg-slate-900/80 border-emerald-900/50 text-slate-400'
                                : isUnitInProgress
                                ? 'bg-amber-950/20 border-amber-600/40 text-amber-200 font-medium'
                                : 'bg-slate-900/40 border-slate-800 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {isUnitCompleted ? (
                                <span className="text-emerald-400 shrink-0 font-bold">✅</span>
                              ) : isUnitInProgress ? (
                                <span className="text-amber-400 shrink-0 font-bold">━</span>
                              ) : (
                                <span className="text-slate-500 shrink-0">☐</span>
                              )}
                              <span
                                className={`truncate ${
                                  isUnitCompleted
                                    ? 'text-slate-300 font-normal'
                                    : isUnitInProgress
                                    ? 'line-through text-amber-300/90 decoration-amber-400 decoration-2 font-bold'
                                    : 'text-slate-400'
                                }`}
                              >
                                {unit.nameEn}
                              </span>
                            </div>

                            <span className="text-[10px] font-mono shrink-0 text-slate-500">
                              {isUnitCompleted ? 'Done' : isUnitInProgress ? 'In Progress' : 'Not started'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Speed Challenge Bar for Jessie */}
        {!isYounger && (
          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-200">
                Speed Challenge (5-minute timer sprint)
              </span>
            </div>

            {!speedChallengeActive && !isFinished ? (
              <button
                onClick={handleStartSpeedChallenge}
                className="px-4 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Start 5-Minute Timer (+10 Coins Bonus)</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 font-mono text-xs font-bold">
                <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className={secondsRemaining < 60 ? 'text-rose-400' : 'text-amber-300'}>
                  Time Remaining: {Math.floor(secondsRemaining / 60)}:{(secondsRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Question Card or Finished Screen */}
      {!isFinished ? (
        <div className="bg-slate-850 border border-slate-700 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          
          {/* Question Header & Authentic School Source Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center font-mono">
                {currentIndex + 1}
              </span>
              <div>
                <div className="text-xs font-bold text-amber-400 flex items-center gap-2">
                  <span>📐 Maths — {currentQ.topicEn || currentQ.topic}</span>
                  {currentQ.difficulty === 'boss' && (
                    <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded text-[10px] font-extrabold animate-pulse">
                      🔥 BOSS Question
                    </span>
                  )}
                  {currentQ.difficulty === 'challenge' && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px] font-bold">
                      ⭐ Challenge
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Question {currentIndex + 1} of 10
                </div>
              </div>
            </div>

            {/* School / STAR Exam Paper Source Tag */}
            {currentQ.sourceExamSchool && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-[11px] text-slate-300">
                <Landmark className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-medium text-amber-200/90">{currentQ.sourceExamSchool}</span>
              </div>
            )}
          </div>

          {/* Question Body (Alternating English & Chinese questions per specification) */}
          <div className="space-y-4 font-['Outfit',sans-serif]">
            {/* Primary Question Prompt (Alternates: Questions 1,3,5,7,9 in English; Questions 2,4,6,8,10 in Chinese) */}
            {currentIndex % 2 === 0 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400">
                  <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30">English Question</span>
                </div>
                <div className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed">
                  {currentQ.questionTextEn || currentQ.questionText}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30">中文題目</span>
                </div>
                <div className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed">
                  {currentQ.questionTextZh || currentQ.questionText}
                </div>
              </div>
            )}

            {/* Formula / Diagram if present */}
            {currentQ.formulaOrDiagram && (
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-sm text-amber-300 text-center select-all">
                {currentQ.formulaOrDiagram}
              </div>
            )}

            {/* Example Snippet */}
            {currentQ.exampleSnippet && (
              <div className="p-3 rounded-xl bg-slate-900/60 border border-amber-500/20 text-xs text-amber-200/90 font-mono">
                💡 {currentQ.exampleSnippet}
              </div>
            )}

            {/* Counterpart Reference Box */}
            {showChineseRef && (
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-750 space-y-1">
                <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                  <span>{currentIndex % 2 === 0 ? '中文對照：' : 'English Translation:'}</span>
                </div>
                <div className="text-sm text-slate-300 leading-normal">
                  {currentIndex % 2 === 0
                    ? currentQ.questionTextZh
                    : (currentQ.questionTextEn || currentQ.questionText)}
                </div>
              </div>
            )}
          </div>

          {/* Multiple Choice Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {currentQ.options.map((opt, optIdx) => {
              const isSelected = currentSelected === optIdx;
              const isCorrectAnswer = optIdx === currentQ.correctIndex;

              let btnStyle = 'bg-slate-900/80 hover:bg-slate-750 border-slate-700 text-slate-200';

              if (isCurrentSubmitted) {
                if (isCorrectAnswer) {
                  btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold';
                } else if (isSelected && !isCorrectAnswer) {
                  btnStyle = 'bg-rose-950/80 border-rose-500 text-rose-200';
                } else {
                  btnStyle = 'bg-slate-900/40 border-slate-800 text-slate-500';
                }
              } else if (isSelected) {
                btnStyle = 'bg-amber-500/20 border-amber-400 text-amber-200 font-semibold ring-1 ring-amber-400/50';
              }

              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelectOption(optIdx)}
                  disabled={isCurrentSubmitted}
                  className={`p-4 rounded-2xl border text-left text-sm transition-all duration-150 flex items-center justify-between cursor-pointer ${btnStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono flex items-center justify-center shrink-0">
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span>{opt}</span>
                  </div>

                  {isCurrentSubmitted && isCorrectAnswer && (
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  )}
                  {isCurrentSubmitted && isSelected && !isCorrectAnswer && (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Step-by-Step Marking Scheme Explanation */}
          {showExplanation && (
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <HelpCircle className="w-4 h-4" />
                <span>Marking Scheme & Step-by-Step Solution</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-sans">
                {currentQ.explanationEn || currentQ.explanation}
              </p>

              {currentQ.explanationZh && showChineseRef && (
                <div className="pt-2 border-t border-slate-800 text-xs text-slate-400">
                  <span className="text-amber-400/80 font-medium">中文解題步驟：</span>
                  <p className="mt-1 leading-relaxed">{currentQ.explanationZh}</p>
                </div>
              )}

              {/* Detective Clue Reveal for Jasmine */}
              {isYounger && currentQ.detectiveClueSnippet && currentSelected === currentQ.correctIndex && (
                <div className="mt-3 p-3 rounded-xl bg-amber-950/30 border border-amber-700/50 text-xs text-amber-200 font-medium flex items-start gap-2">
                  <FileSearch className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-amber-400">🕵️‍♀️ Temuka Clue Unlocked:</div>
                    <div className="mt-0.5">{currentQ.detectiveClueSnippet}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between">
            <button
              onClick={() => {
                if (currentIndex > 0) {
                  sounds.playTap();
                  setCurrentIndex(prev => prev - 1);
                  setShowExplanation(submittedStates[currentIndex - 1]);
                }
              }}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 disabled:opacity-40 cursor-pointer"
            >
              ← Previous
            </button>

            {!isCurrentSubmitted ? (
              <button
                onClick={handleConfirmAnswer}
                disabled={currentSelected === null}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <span>Confirm Answer</span>
                <Check className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <span>{currentIndex === 9 ? 'Finish Today\'s Challenge' : 'Next Question'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Completion Summary Screen */
        <div className="bg-slate-850 border border-slate-700 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
            <Trophy className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
              Today's 10 Questions Completed!
            </h2>
            <p className="text-sm text-slate-300">
              Baseline mission achieved! All answer attempts have been logged to Mum's Google Drive archive.
            </p>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto py-2">
            <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-700/60">
              <div className="text-xs text-slate-400">Score</div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {correctCount} / 10
              </div>
            </div>
            <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-700/60">
              <div className="text-xs text-slate-400">XP Earned</div>
              <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                +120 XP
              </div>
            </div>
            <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-700/60">
              <div className="text-xs text-slate-400">Coins</div>
              <div className="text-xl font-bold font-mono text-yellow-400 mt-1">
                +30 Coins
              </div>
            </div>
            <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-700/60">
              <div className="text-xs text-slate-400">Lucky Tickets</div>
              <div className="text-xl font-bold font-mono text-purple-400 mt-1">
                +1 🎟️
              </div>
            </div>
          </div>

          {/* Google Drive Auto-Sync Notice */}
          <div className="max-w-md mx-auto p-3.5 bg-slate-900/80 rounded-2xl border border-slate-750 text-xs text-slate-300 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Auto-archived to: <code className="text-amber-300 font-mono">/RealLifeAdventureGame/Maths/Sister_{isYounger ? 'Jasmine' : 'Jessie'}/</code>
            </span>
          </div>

          {/* Jasmine's Detective Case Review */}
          {isYounger && revealedClues.length > 0 && (
            <div className="text-left bg-amber-950/20 border border-amber-800/40 rounded-2xl p-5 space-y-3">
              <div className="font-bold text-amber-300 flex items-center gap-2 text-sm">
                <FileSearch className="w-4 h-4" />
                <span>Detective Notebook: Temuka Case Deduction Summary</span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                {revealedClues.map((clue, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold font-mono">[{idx + 1}]</span>
                    <span>{clue}</span>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/80 text-xs text-emerald-300 font-medium">
                🎯 Deduction Verified: The antique brass compass was secured in the dry crevice under the Temuka Domain stream bridge!
              </div>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleRestart}
              className="px-5 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Practice Again</span>
            </button>
          </div>

        </div>
      )}

      {/* Detective Clue Notebook Card for Jasmine (persistent below) */}
      {isYounger && !isFinished && (
        <div className="bg-slate-850 border border-amber-900/40 rounded-3xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <FileSearch className="w-4 h-4" />
              <span>Temuka Detective Notebook (Unlock 1 clue every 2 correct answers)</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {revealedClues.length} / 5 clues uncovered
            </span>
          </div>

          {revealedClues.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              No clues unlocked yet. Answer questions correctly to decipher the mystery code!
            </p>
          ) : (
            <div className="space-y-2">
              {revealedClues.map((clue, cIdx) => (
                <div key={cIdx} className="text-xs bg-slate-900/80 p-2.5 rounded-xl border border-amber-800/30 text-slate-200">
                  {clue}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
