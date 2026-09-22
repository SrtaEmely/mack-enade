/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Student,
  Mission,
  Competency,
  Question,
  Achievement,
  SimulationExam,
  RecommendedActivity,
  ScreenType,
  QuestionResult,
  UserRole,
  Professor,
} from './types';
import {
  initialStudent,
  initialMissions,
  initialCompetencies,
  sampleQuestions,
  initialAchievements,
  simulationExams,
  recommendedActivity,
  initialProfessor,
  initialMentorChallenges,
  initialClassStudents,
} from './data/mockData';

// Student Screens
import { LoginScreen } from './screens/LoginScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { TodayMissionScreen } from './screens/TodayMissionScreen';
import { QuestionScreen } from './screens/QuestionScreen';
import { FeedbackScreen } from './screens/FeedbackScreen';
import { ProgressScreen } from './screens/ProgressScreen';
import { AchievementsScreen } from './screens/AchievementsScreen';
import { SimulationScreen } from './screens/SimulationScreen';
import { RewardsCenterScreen } from './screens/RewardsCenterScreen';

// Professor Screens
import { ProfessorDashboardScreen } from './screens/ProfessorDashboardScreen';
import { ProfessorQuestionsScreen } from './screens/ProfessorQuestionsScreen';
import { ProfessorMentorshipScreen } from './screens/ProfessorMentorshipScreen';
import { ProfessorClassPerformanceScreen } from './screens/ProfessorClassPerformanceScreen';
import { ProfessorChallengesScreen } from './screens/ProfessorChallengesScreen';
import { ProfessorRewardManagerScreen } from './screens/ProfessorRewardManagerScreen';
import { SocialShareScreen } from './screens/SocialShareScreen';


// Navigation
import { Navigation } from './components/Navigation';
import { PWAController } from './components/PWAController';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('dashboard');

  // Application state
  const [student, setStudent] = useState<Student>(initialStudent);
  const [professor, setProfessor] = useState<Professor>(initialProfessor);
  const [missions, setMissions] = useState<Mission[]>(initialMissions);
  const [competencies, setCompetencies] = useState<Competency[]>(initialCompetencies);
  const [questions, setQuestions] = useState<Question[]>(sampleQuestions);
  const [achievements, setAchievements] = useState<Achievement[]>(initialAchievements);

  // Active question flow
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [lastSelectedAlternative, setLastSelectedAlternative] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('C');

  // Stored mock student results for dynamic dashboard updates
  const [recentResults, setRecentResults] = useState<QuestionResult[]>(() => {
    try {
      const saved = localStorage.getItem('mack_enade_results');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Toast / XP celebration banner
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'xp' | 'level' | 'success' } | null>(null);

  const showToast = (text: string, type: 'xp' | 'level' | 'success' = 'xp') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync state with server API
  useEffect(() => {
    fetch('/api/student')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setStudent(data);
      })
      .catch(() => {});

    fetch('/api/professor/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setProfessor(data);
      })
      .catch(() => {});

    fetch('/api/questions')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setQuestions(data);
        }
      })
      .catch(() => {});
  }, []);

  const handleNavigate = (screen: ScreenType, params?: { questionId?: string; missionId?: string }) => {
    if (params?.questionId) {
      const idx = questions.findIndex((q) => q.id === params.questionId);
      if (idx !== -1) {
        setCurrentQuestionIndex(idx);
      }
    }
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchRole = (newRole: UserRole) => {
    setUserRole(newRole);
    if (newRole === 'professor') {
      setCurrentScreen('professor-dashboard');
      showToast('Modo Docente Ativado: Prof. Dr. Carlos Medeiros', 'success');
    } else {
      setCurrentScreen('dashboard');
      showToast('Modo Estudante Ativado: Gabriel Siqueira', 'success');
    }
  };

  const handleLogin = (role: UserRole = 'student', studentData?: Partial<Student>) => {
    if (studentData) {
      setStudent((prev) => ({ ...prev, ...studentData }));
    }
    setUserRole(role);
    setIsLoggedIn(true);
    if (role === 'professor') {
      setCurrentScreen('professor-dashboard');
      showToast('Bem-vindo ao Painel Docente Mack ENADE!', 'success');
    } else {
      setCurrentScreen('dashboard');
      showToast('Bem-vindo de volta ao Mack ENADE!', 'success');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentScreen('login');
  };

  const handleStartMission = (mission: Mission) => {
    if (mission.questionIds && mission.questionIds.length > 0) {
      const targetQId = mission.questionIds[0];
      const targetIdx = questions.findIndex((q) => q.id === targetQId);
      if (targetIdx !== -1) {
        setCurrentQuestionIndex(targetIdx);
      }
    }
    setCurrentScreen('question');
  };

  const handleSubmitAnswer = async (
    questionId: string,
    alternative: 'A' | 'B' | 'C' | 'D' | 'E',
    navigateToFeedback: boolean = false
  ) => {
    const currentQ = questions.find((q) => q.id === questionId) || questions[currentQuestionIndex];
    if (!currentQ) return;
    const isCorrect = currentQ.correctAnswer === alternative;
    let earnedXp = isCorrect ? 50 : 15;

    setLastSelectedAlternative(alternative);

    // Call backend endpoint to trigger Boss Battle damage, Mentor Hour multiplier & Question Analytics
    try {
      const res = await fetch('/api/answer-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQ.id,
          alternative,
          studentRa: student.ra,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.earnedXp) {
          earnedXp = data.earnedXp;
        }
        if (data.isMentorHourActive) {
          showToast(`⚡ Multiplicador do Plantão do Mentor Ativo: +${earnedXp} XP (2x)!`, 'xp');
        } else if (data.bossDamageDealt && data.bossDamageDealt > 0) {
          showToast(`💥 +${earnedXp} XP! Você desferiu ${data.bossDamageDealt} de dano no Boss da Turma!`, 'xp');
        } else {
          showToast(isCorrect ? `+${earnedXp} XP! Resposta Correta!` : `+${earnedXp} XP pelo esforço.`, isCorrect ? 'xp' : 'success');
        }
      }
    } catch (e) {
      console.warn('Could not post answer to backend, updating locally:', e);
      showToast(isCorrect ? `+${earnedXp} XP! Resposta Correta!` : `+${earnedXp} XP pelo esforço.`, isCorrect ? 'xp' : 'success');
    }

    // 1. Record mock student results history
    const newResult: QuestionResult = {
      id: 'res-' + Date.now(),
      questionId: currentQ.id,
      selectedAlternative: alternative,
      isCorrect,
      earnedXp,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      competency: currentQ.competency,
      topic: currentQ.topic,
      area: currentQ.area,
    };

    setRecentResults((prev) => {
      const updated = [newResult, ...prev];
      try {
        localStorage.setItem('mack_enade_results', JSON.stringify(updated.slice(0, 50)));
      } catch {}
      return updated;
    });

    // 2. Update student XP, count, level, score, and prep
    setStudent((prev) => {
      const newXp = prev.xp + earnedXp;
      let newLevel = prev.level;
      let newNextXp = prev.nextLevelXp;
      let newTitle = prev.levelTitle;

      if (newXp >= prev.nextLevelXp) {
        newLevel += 1;
        newNextXp = Math.round(newNextXp * 1.35);
        if (newLevel >= 10) newTitle = 'Lenda do ENADE UPM';
        else if (newLevel >= 8) newTitle = 'Especialista Mackenzie';
        showToast(`🎉 Parabéns! Você subiu para o Nível ${newLevel}: ${newTitle}!`, 'level');
      }

      const totalAnswered = prev.questionsAnswered + 1;
      const totalCorrect = prev.correctAnswers + (isCorrect ? 1 : 0);
      const calculatedScore = +(3.2 + (totalCorrect / totalAnswered) * 1.8).toFixed(1);
      const newPrepPercentage = Math.min(100, prev.enadePreparationPercentage + 1);

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        nextLevelXp: newNextXp,
        levelTitle: newTitle,
        questionsAnswered: totalAnswered,
        correctAnswers: totalCorrect,
        estimatedScore: calculatedScore,
        enadePreparationPercentage: newPrepPercentage,
      };
    });

    // 3. Update missions progress
    setMissions((prevMissions) =>
      prevMissions.map((m) => {
        const matchesCategory =
          m.category === currentQ.area ||
          m.title.toLowerCase().includes(currentQ.area.toLowerCase());

        if (matchesCategory && !m.completed) {
          const nextCount = m.currentCount + 1;
          const isDone = nextCount >= m.targetCount;
          if (isDone && !m.completed) {
            showToast(`🎯 Missão Concluída: "${m.title}" (+${m.xpReward} XP)!`, 'success');
            setStudent((s) => ({ ...s, xp: s.xp + m.xpReward }));
          }
          return {
            ...m,
            currentCount: Math.min(m.targetCount, nextCount),
            completed: isDone,
          };
        }
        return m;
      })
    );

    // 4. Update competency stats
    setCompetencies((prevComp) =>
      prevComp.map((comp) => {
        if (comp.name === currentQ.competency || comp.area === currentQ.area) {
          const newResolved = comp.questionsResolved + 1;
          const newAccuracy = Math.min(
            100,
            Math.max(30, Math.round((comp.performancePercentage * (newResolved - 1) + (isCorrect ? 100 : 30)) / newResolved))
          );
          return {
            ...comp,
            questionsResolved: newResolved,
            performancePercentage: newAccuracy,
          };
        }
        return comp;
      })
    );

    // 5. If requested, navigate directly to feedback screen
    if (navigateToFeedback) {
      setCurrentScreen('feedback');
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setCurrentScreen('question');
    } else {
      setCurrentScreen('progress');
    }
  };

  const handleRetryQuestion = () => {
    setCurrentScreen('question');
  };

  const handleFinishSimulation = (projectedConceito: number, earnedXp: number) => {
    setStudent((prev) => ({
      ...prev,
      xp: prev.xp + earnedXp,
      simulatedExamsCompleted: prev.simulatedExamsCompleted + 1,
      estimatedScore: +( (prev.estimatedScore + projectedConceito) / 2 ).toFixed(1),
    }));
    showToast(`+${earnedXp} XP adicionados pelo Simulado Oficial!`, 'xp');
  };

  // Render Login screen if user is not logged in or explicitly at login screen
  if (!isLoggedIn || currentScreen === 'login') {
    return (
      <>
        <PWAController />
        <LoginScreen onLogin={handleLogin} />
      </>
    );
  }

  const activeQuestion = questions[currentQuestionIndex] || questions[0];

  return (
    <div id="mack-enade-app-root" className="min-h-screen bg-[#F8F9FA] text-zinc-900 flex flex-col">
      {/* PWA Controller (Offline Banner, Update Detection, iOS Prompt) */}
      <PWAController />

      {/* Top Header Navigation */}
      <Navigation
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        userRole={userRole}
        student={student}
        professor={professor}
        onSwitchRole={handleSwitchRole}
        onLogout={handleLogout}
      />

      {/* Floating XP / Level Celebration Toast */}
      {toastMessage && (
        <div
          id="celebration-toast"
          className="fixed top-20 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-200"
        >
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs sm:text-sm font-bold ${
              toastMessage.type === 'level'
                ? 'bg-amber-400 text-zinc-900 border-amber-300'
                : toastMessage.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-zinc-900 text-white border-zinc-700'
            }`}
          >
            <span className="text-base">
              {toastMessage.type === 'level' ? '🏆' : toastMessage.type === 'success' ? '✨' : '⚡'}
            </span>
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-16">
        {/* STUDENT SCREENS */}
        {currentScreen === 'dashboard' && (
          <DashboardScreen
            student={student}
            missions={missions}
            competencies={competencies}
            recommended={recommendedActivity}
            recentResults={recentResults}
            onNavigate={handleNavigate}
          />
        )}

        {currentScreen === 'today-mission' && (
          <TodayMissionScreen
            missions={missions}
            streak={student.studyStreak}
            onNavigate={handleNavigate}
            onStartMission={handleStartMission}
          />
        )}

        {currentScreen === 'question' && (
          <QuestionScreen
            question={activeQuestion}
            allQuestions={questions}
            currentQuestionIndex={currentQuestionIndex}
            onSelectIndex={(idx) => setCurrentQuestionIndex(idx)}
            onSubmitAnswer={handleSubmitAnswer}
            onNavigate={handleNavigate}
          />
        )}

        {currentScreen === 'feedback' && (
          <FeedbackScreen
            question={activeQuestion}
            selectedAlternative={lastSelectedAlternative}
            onNextQuestion={handleNextQuestion}
            onRetryQuestion={handleRetryQuestion}
            onNavigate={handleNavigate}
            hasNextQuestion={currentQuestionIndex < questions.length - 1}
          />
        )}

        {currentScreen === 'progress' && (
          <ProgressScreen
            student={student}
            competencies={competencies}
            onNavigate={handleNavigate}
          />
        )}

        {currentScreen === 'achievements' && (
          <AchievementsScreen
            student={student}
            achievements={achievements}
            onNavigate={handleNavigate}
          />
        )}

        {currentScreen === 'simulation' && (
          <SimulationScreen
            exams={simulationExams}
            questions={questions}
            onFinishSimulation={handleFinishSimulation}
            onNavigate={handleNavigate}
          />
        )}

        {currentScreen === 'rewards' && (
          <RewardsCenterScreen
            student={student}
            missions={missions}
            mentorChallenges={initialMentorChallenges}
            recentResults={recentResults}
            onNavigate={handleNavigate}
          />
        )}

        {/* PROFESSOR SCREENS */}
        {currentScreen === 'professor-dashboard' && (
          <ProfessorDashboardScreen
            professor={professor}
            onNavigate={handleNavigate}
          />
        )}

        {currentScreen === 'professor-rewards' && (
          <ProfessorRewardManagerScreen
            professor={professor}
            classStudents={initialClassStudents}
            onNavigate={handleNavigate}
          />
        )}


        {currentScreen === 'professor-questions' && (
          <ProfessorQuestionsScreen
            professor={professor}
          />
        )}

        {currentScreen === 'professor-mentorship' && (
          <ProfessorMentorshipScreen
            professor={professor}
          />
        )}

        {currentScreen === 'professor-class-performance' && (
          <ProfessorClassPerformanceScreen />
        )}

        {currentScreen === 'professor-challenges' && (
          <ProfessorChallengesScreen
            professor={professor}
          />
        )}

        {currentScreen === 'professor-social-share' && (
          <SocialShareScreen />
        )}
      </main>

      {/* Global Academic Footer */}
      <footer className="mt-auto border-t border-zinc-200/80 bg-white py-6 hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#EA0029]">MACK ENADE</span>
            <span>•</span>
            <span className="bg-zinc-100 text-zinc-600 font-bold px-1.5 py-0.5 rounded text-[11px] border border-zinc-200">
              Versão Piloto
            </span>
            <span>•</span>
            <span>Universidade Presbiteriana Mackenzie</span>
            <span>•</span>
            <span>Ciclo Avaliativo Trienal do SINAES / INEP</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Ambiente de Aprendizagem & Mentoria Docente</span>
            {userRole === 'student' ? (
              <>
                <button
                  onClick={() => handleNavigate('dashboard')}
                  className="text-zinc-700 font-bold hover:text-[#EA0029] cursor-pointer"
                >
                  Painel
                </button>
                <button
                  onClick={() => handleNavigate('simulation')}
                  className="text-zinc-700 font-bold hover:text-[#EA0029] cursor-pointer"
                >
                  Simulados
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNavigate('professor-dashboard')}
                  className="text-zinc-700 font-bold hover:text-[#EA0029] cursor-pointer"
                >
                  Painel Docente
                </button>
                <button
                  onClick={() => handleNavigate('professor-questions')}
                  className="text-zinc-700 font-bold hover:text-[#EA0029] cursor-pointer"
                >
                  Criar Questão (&lt; 2 min)
                </button>
              </>
            )}
            <button
              onClick={() => handleSwitchRole(userRole === 'student' ? 'professor' : 'student')}
              className="text-[#EA0029] font-bold hover:underline cursor-pointer"
            >
              Alternar para {userRole === 'student' ? 'Docente' : 'Estudante'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
